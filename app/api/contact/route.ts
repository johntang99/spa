import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { loadPageContent, loadSiteInfo } from '@/lib/content';
import { getDefaultSite, getSiteByHost, getSiteById, normalizeHost } from '@/lib/sites';
import type { Locale, SiteInfo } from '@/lib/types';
import { getSiteDisplayName } from '@/lib/siteInfo';
import { forwardToLeadHub } from '@/lib/lead-hub-forward';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);
const SITES_CONFIG_PATH = path.join(process.cwd(), 'content', '_sites.json');

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
  locale?: string;
}

interface ContactEmailContext {
  locale: Locale;
  businessName: string;
  phone: string;
  addressLine: string;
  notificationMessage: string;
  autoReplyMessage: string;
}

interface ContactPageEmailConfig {
  form?: {
    notificationEmail?: string;
    notificationEmails?: string[] | string;
    senderName?: string;
    senderEmail?: string | string[];
    senderFrom?: string;
    notificationMessage?: string;
    autoReplyMessage?: string;
  };
}

function toLocale(rawLocale: unknown): Locale {
  return rawLocale === 'zh' ? 'zh' : 'en';
}

function uniqueEmails(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)));
}

function normalizeEmailList(value: unknown): string[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const values: unknown[] = [];
  const appendValue = (input: unknown) => {
    if (Array.isArray(input)) {
      input.forEach(appendValue);
      return;
    }
    if (typeof input === 'string') {
      values.push(...input.split(/[\n,;]/));
    }
  };
  appendValue(value);

  return uniqueEmails(
    values
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => emailRegex.test(item))
  );
}

async function resolveContactPageEmailConfig(
  siteId: string | undefined,
  locale: Locale
): Promise<ContactPageEmailConfig | null> {
  if (!siteId) return null;
  return loadPageContent<ContactPageEmailConfig>('contact', locale, siteId);
}

function resolveTemplateValue(
  value: unknown,
  fallback: string,
  variables: Record<string, string>
): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return value.replace(/\{(\w+)\}/g, (_, token) => variables[token] || '');
}

function resolveNotificationRecipients(
  emailConfig: ContactPageEmailConfig | null,
  siteInfo: SiteInfo | null
): string[] {
  const configuredFromPage = normalizeEmailList([
    emailConfig?.form?.notificationEmail,
    emailConfig?.form?.notificationEmails,
  ]);
  if (configuredFromPage.length > 0) return configuredFromPage;

  const siteEmail = normalizeEmailList(siteInfo?.email);
  if (siteEmail.length > 0) return siteEmail;

  const envFallback = normalizeEmailList(process.env.CONTACT_FALLBACK_TO);
  if (envFallback.length > 0) return envFallback;

  return ['support@baamplatform.com'];
}

function resolveSenderFrom(
  emailConfig: ContactPageEmailConfig | null,
  businessName: string
): string {
  const explicitFrom =
    typeof emailConfig?.form?.senderFrom === 'string' ? emailConfig.form.senderFrom.trim() : '';
  if (explicitFrom) return explicitFrom;

  const senderEmail = normalizeEmailList(emailConfig?.form?.senderEmail)[0];
  if (!senderEmail) {
    return process.env.RESEND_FROM || 'No-Reply<no-reply@baamplatform.com>';
  }

  const senderNameRaw =
    typeof emailConfig?.form?.senderName === 'string' && emailConfig.form.senderName.trim()
      ? emailConfig.form.senderName.trim()
      : businessName || 'No-Reply';
  const senderName = senderNameRaw.replace(/[<>]/g, '').trim() || 'No-Reply';
  return `${senderName}<${senderEmail}>`;
}

async function getLocalDefaultSiteId(): Promise<string | null> {
  try {
    const raw = await fs.promises.readFile(SITES_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as {
      sites?: Array<{ id?: string; enabled?: boolean }>;
    };
    const sites = Array.isArray(parsed.sites) ? parsed.sites : [];
    const firstEnabled = sites.find((site) => site.enabled !== false && site.id);
    return firstEnabled?.id ?? sites[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function resolveRequestSite(request: NextRequest) {
  const host = request.headers.get('host');
  const normalizedHost = normalizeHost(host || '');
  const isLocalHost =
    normalizedHost.includes('localhost') ||
    normalizedHost.startsWith('127.0.0.1') ||
    normalizedHost.startsWith('0.0.0.0');

  // Keep localhost behavior consistent with page content loading:
  // prefer local _sites.json default over shared DB default.
  if (isLocalHost || !host) {
    const localSiteId = await getLocalDefaultSiteId();
    if (localSiteId) {
      const localSite = await getSiteById(localSiteId);
      if (localSite?.enabled) return localSite;
    }
  }

  const matchedSite = await getSiteByHost(host);
  if (matchedSite?.enabled) return matchedSite;

  return getDefaultSite();
}

async function resolveRequestSiteInfo(
  request: NextRequest,
  locale: Locale,
  resolvedSite?: Awaited<ReturnType<typeof resolveRequestSite>> | null
): Promise<SiteInfo | null> {
  const site = resolvedSite ?? (await resolveRequestSite(request));
  if (!site) return null;
  return loadSiteInfo(site.id, locale) as Promise<SiteInfo | null>;
}

function getReasonLabel(reason: string): string {
  return reason?.trim() || 'General inquiry';
}

function getAddressLine(siteInfo: SiteInfo | null): string {
  if (!siteInfo) return '';
  return [siteInfo.address, siteInfo.city, siteInfo.state, siteInfo.zip].filter(Boolean).join(', ');
}

function createEmailHTML(data: ContactFormData, context: ContactEmailContext): string {
  const { name, email, phone, reason, message } = data;
  const { businessName, locale, notificationMessage } = context;
  const reasonLabel = getReasonLabel(reason);
  const timestamp = new Date().toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { 
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">📧 New Contact Form Submission</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${businessName} Website</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                      <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 14px;">${notificationMessage}</p>
                    </div>

                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Reason for Contact</strong>
                          <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${reasonLabel}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Name</strong>
                          <p style="margin: 4px 0 0; color: #111827; font-size: 16px;">${name}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Email</strong>
                          <p style="margin: 4px 0 0;">
                            <a href="mailto:${email}" style="color: #059669; text-decoration: none; font-size: 16px;">${email}</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Phone</strong>
                          <p style="margin: 4px 0 0;">
                            <a href="tel:${phone.replace(/\D/g, '')}" style="color: #059669; text-decoration: none; font-size: 16px;">${phone}</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <strong style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Message</strong>
                          <div style="margin: 8px 0 0; padding: 16px; background-color: #f9fafb; border-radius: 6px; color: #111827; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 6px;">
                      <p style="margin: 0; color: #6b7280; font-size: 13px;">
                        <strong>Submitted:</strong> ${timestamp} (EST)
                      </p>
                    </div>

                    <!-- Action Button -->
                    <div style="margin-top: 32px; text-align: center;">
                      <a href="mailto:${email}?subject=Re: ${reasonLabel}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Reply to Customer</a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                      This email was sent from the ${businessName} contact form.<br>
                      <strong>Remember:</strong> Respond quickly for the best customer experience.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function createAutoReplyHTML(name: string, context: ContactEmailContext): string {
  const { businessName, phone, addressLine, autoReplyMessage } = context;
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting ${businessName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; color: #111827;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px; text-align: center; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Thank You!</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <p style="margin: 0 0 16px; color: #111827; font-size: 16px; line-height: 1.6;">Dear ${name},</p>
                    
                    <p style="margin: 0 0 16px; color: #111827; font-size: 16px; line-height: 1.6;">
                      ${autoReplyMessage}
                    </p>

                    <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #059669; border-radius: 4px;">
                      <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                        <strong>🕐 Need immediate assistance?</strong><br>
                        Call us at <a href="tel:${phone.replace(/\D/g, '')}" style="color: #059669; text-decoration: none; font-weight: 600;">${phone}</a><br>
                        <span style="color: #6b7280; font-size: 13px;">Mon-Fri: 8am-8pm | Sat-Sun: 9am-6pm</span>
                      </p>
                    </div>

                    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      We look forward to supporting your goals.
                    </p>

                    <p style="margin: 16px 0 0; color: #111827; font-size: 16px;">
                      <strong>${businessName} Support Team</strong><br>
                      <span style="color: #6b7280; font-size: 14px;">Customer Support</span>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="text-align: center; padding-bottom: 16px;">
                          <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">${businessName}</p>
                          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Professional Services</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; color: #6b7280; font-size: 12px; line-height: 1.5;">
                          ${addressLine ? `📍 ${addressLine}<br>` : ''}📞 ${phone}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, reason, message, locale: rawLocale } = body as ContactFormData;
    const locale = toLocale(rawLocale);
    const resolvedSite = await resolveRequestSite(request);
    const siteInfo = await resolveRequestSiteInfo(request, locale, resolvedSite);
    const emailConfig = await resolveContactPageEmailConfig(resolvedSite?.id, locale);
    const businessName = getSiteDisplayName(siteInfo, 'Business');
    const businessPhone = siteInfo?.phone || process.env.CONTACT_PHONE_FALLBACK || '(845) 381-1106';
    const notificationRecipients = resolveNotificationRecipients(emailConfig, siteInfo);
    const senderFrom = resolveSenderFrom(emailConfig, businessName);
    const alertRecipients = normalizeEmailList(process.env.ALERT_TO);
    const ccRecipients = uniqueEmails(
      alertRecipients.filter((item) => !notificationRecipients.includes(item))
    );
    const notificationMessage = resolveTemplateValue(
      emailConfig?.form?.notificationMessage,
      '⚡ Action Required: New customer inquiry',
      { businessName }
    );
    const autoReplyMessage = resolveTemplateValue(
      emailConfig?.form?.autoReplyMessage,
      `Thank you for contacting <strong>${businessName}</strong>. We've received your message and will respond shortly.`,
      { businessName }
    );
    const context: ContactEmailContext = {
      locale,
      businessName,
      phone: businessPhone,
      addressLine: getAddressLine(siteInfo),
      notificationMessage,
      autoReplyMessage,
    };

    // Validate required fields
    if (!name || !email || !phone || !reason || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate phone (basic)
    if (phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Prepare email data
    const reasonLabel = getReasonLabel(reason);
    const emailHTML = createEmailHTML({ name, email, phone, reason, message, locale }, context);
    const autoReplyHTML = createAutoReplyHTML(name, context);

    // Send notification email to business inbox
    const notificationEmail = await resend.emails.send({
      from: senderFrom,
      to: notificationRecipients,
      cc: ccRecipients.length > 0 ? ccRecipients : undefined,
      reply_to: email,
      subject: `New Contact: ${reasonLabel} - ${name}`,
      html: emailHTML,
    });

    // Send auto-reply to customer
    const autoReplyEmail = await resend.emails.send({
      from: senderFrom,
      to: email,
      subject: locale === 'zh' ? `感谢联系${businessName}` : `Thank you for contacting ${businessName}`,
      html: autoReplyHTML,
    });

    console.log('Emails sent successfully:', {
      notification: notificationEmail.data?.id,
      autoReply: autoReplyEmail.data?.id,
      timestamp: new Date().toISOString(),
    });

    // Fire-and-forget forward to BAAM Lead Hub.
    // Must not affect the user-facing response if it fails.
    try {
      const siteId = resolvedSite?.id || null;
      await forwardToLeadHub(siteId, {
        source: 'organic_site_form',
        source_form_name: 'contact',
        source_landing_page: '/contact',
        contact: {
          name,
          phone,
          email,
          language_preference: locale === 'zh' ? 'zh' : 'en',
        },
        service_requested: reasonLabel,
        message,
        raw_payload: { name, email, phone, reason, message, locale },
      });
    } catch {
      /* forwarder already never throws; defensive no-op */
    }

    return NextResponse.json(
      { 
        success: true, 
        message: locale === 'zh'
          ? '您的消息已发送成功。我们的团队将尽快与您联系，并请留意邮箱确认邮件。'
          : 'Your message has been sent successfully. Our team will contact you soon. Please check your email for confirmation.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    
    // Return user-friendly error
    return NextResponse.json(
      { 
        error: 'An error occurred while sending your message. Please try calling us directly.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: Add rate limiting in production
// You could use packages like 'rate-limiter-flexible' or Upstash Redis
