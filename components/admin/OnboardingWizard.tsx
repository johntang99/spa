'use client';

import { useState, useCallback, useRef } from 'react';
import { Button, Input, Select, Badge } from '@/components/ui';
import Checkbox from '@/components/ui/Checkbox';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingWizardProps {
  templateSites: Array<{ id: string; name: string }>;
}

interface Credential {
  credential: string;
  institution: string;
  year: string;
  location: string;
}

interface TeamMember {
  name: string;
  title: string;
  role: string;
  languages: string[];
  specializations: string;
}

interface StatItem {
  icon: string;
  number: string;
  label: string;
}

interface StepState {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  message: string;
  duration: number;
}

interface GenerationResult {
  siteId: string;
  entries: number;
  services: number;
  domains: number;
  errors: string[];
  warnings: string[];
}

type MediaFieldKey = 'logoImageUrl' | 'homeHeroImageUrl' | 'aboutBioImageUrl';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TCM_SERVICES: Record<string, Array<{ slug: string; label: string }>> = {
  'Core Modalities': [
    { slug: 'acupuncture', label: 'Acupuncture' },
    { slug: 'chinese-herbal-medicine', label: 'Chinese Herbal Medicine' },
    { slug: 'cupping-therapy', label: 'Cupping Therapy' },
    { slug: 'moxibustion', label: 'Moxibustion' },
  ],
  'Manual Therapies': [
    { slug: 'tuina-massage', label: 'Tui Na Medical Massage' },
    { slug: 'gua-sha', label: 'Gua Sha' },
  ],
  'Wellness & Lifestyle': [
    { slug: 'dietary-therapy', label: 'Chinese Dietary Therapy' },
    { slug: 'lifestyle-counseling', label: 'Lifestyle & Wellness Counseling' },
  ],
};

const BRAND_VARIANTS = [
  { id: 'teal-gold', label: 'Teal & Gold', primary: '#0D6E6E', secondary: '#C9A84C' },
  { id: 'blue-silver', label: 'Blue & Silver', primary: '#2563EB', secondary: '#94A3B8' },
  { id: 'green-cream', label: 'Green & Cream', primary: '#2D6A4F', secondary: '#DDA15E' },
  { id: 'purple-rose', label: 'Purple & Rose', primary: '#6D28D9', secondary: '#EC4899' },
  { id: 'navy-copper', label: 'Navy & Copper', primary: '#1E3A5F', secondary: '#B87333' },
];

const PIPELINE_STEPS = [
  { id: 'O1', label: 'Clone Template' },
  { id: 'O2', label: 'Apply Brand' },
  { id: 'O3', label: 'Prune Services' },
  { id: 'O4', label: 'Replace Content' },
  { id: 'O5', label: 'AI Content & SEO' },
  { id: 'O6', label: 'Cleanup' },
  { id: 'O7', label: 'Verify' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const LANGUAGE_OPTIONS = ['English', 'Chinese'];

const LOCALE_MAP: Record<string, string> = {
  en: 'English',
  zh: 'Chinese (Mandarin)',
};

const STAT_ICONS = ['calendar', 'users', 'star', 'heart', 'award', 'clock'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getAllServiceSlugs(): string[] {
  return Object.values(TCM_SERVICES).flat().map(s => s.slug);
}

async function parseApiError(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text) as { message?: string };
    return parsed.message || fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// CollapsibleSection
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  defaultOpen,
  badge,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full bg-gray-50 px-6 py-4 flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge && <Badge variant="info" size="sm">{badge}</Badge>}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`transition-all duration-200 ${open ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
      >
        <div className="px-6 py-5 bg-white space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OnboardingWizard
// ---------------------------------------------------------------------------

export function OnboardingWizard({ templateSites }: OnboardingWizardProps) {
  // Phase
  const [phase, setPhase] = useState<'form' | 'generating' | 'done' | 'error'>('form');

  // Section 1: Identity
  const [businessName, setBusinessName] = useState('');
  const [siteId, setSiteId] = useState('');
  const [cloneFrom, setCloneFrom] = useState(templateSites[0]?.id || '');

  // Section 2: Business Info
  const [ownerName, setOwnerName] = useState('');
  const [ownerTitle, setOwnerTitle] = useState('');
  const [ownerLanguages, setOwnerLanguages] = useState<string[]>(['English']);
  const [foundedYear, setFoundedYear] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [ownerCertifications, setOwnerCertifications] = useState('');
  const [ownerSpecializations, setOwnerSpecializations] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Section 3: Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [appointmentsEmail, setAppointmentsEmail] = useState('');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [homeHeroImageUrl, setHomeHeroImageUrl] = useState('');
  const [aboutBioImageUrl, setAboutBioImageUrl] = useState('');
  const [mediaUploadingField, setMediaUploadingField] = useState<MediaFieldKey | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const homeHeroFileInputRef = useRef<HTMLInputElement | null>(null);
  const aboutBioFileInputRef = useRef<HTMLInputElement | null>(null);

  // Section 4: Hours
  const [hours, setHours] = useState<Record<string, string>>({
    Monday: '9:00 AM - 5:00 PM',
    Tuesday: '9:00 AM - 5:00 PM',
    Wednesday: '9:00 AM - 5:00 PM',
    Thursday: '9:00 AM - 5:00 PM',
    Friday: '9:00 AM - 5:00 PM',
    Saturday: '9:00 AM - 1:00 PM',
    Sunday: 'Closed',
  });

  // Section 5: Services (Modalities)
  const [selectedServices, setSelectedServices] = useState<string[]>(getAllServiceSlugs());

  // Section 6: Brand
  const [brandVariant, setBrandVariant] = useState('teal-gold');
  const [primaryOverride, setPrimaryOverride] = useState('');

  // Section 7: Locales & Domain
  const [supportedLocales, setSupportedLocales] = useState<string[]>(['en']);
  const [defaultLocale, setDefaultLocale] = useState('en');
  const [prodDomain, setProdDomain] = useState('');
  const [devDomain, setDevDomain] = useState('');

  // Section 8: Content Tone
  const [voice, setVoice] = useState('warm-professional');
  const [targetDemographic, setTargetDemographic] = useState('');
  const [usps, setUsps] = useState<string[]>([]);

  // Section 9: Social
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [google, setGoogle] = useState('');
  const [youtube, setYoutube] = useState('');
  const [wechat, setWechat] = useState('');

  // Section 10: Insurance & Booking
  const [acceptsInsurance, setAcceptsInsurance] = useState(false);
  const [inNetworkNote, setInNetworkNote] = useState('');
  const [financingNote, setFinancingNote] = useState('');
  const [membershipEnabled, setMembershipEnabled] = useState(false);
  const [membershipName, setMembershipName] = useState('');
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(false);
  const [bookingUrl, setBookingUrl] = useState('/book');

  // Section 11: Stats
  const [stats, setStats] = useState<StatItem[]>([
    { icon: 'calendar', number: '15+', label: 'Years Experience' },
    { icon: 'users', number: '10,000+', label: 'Happy Patients' },
    { icon: 'star', number: '4.9', label: 'Google Rating' },
    { icon: 'award', number: '5', label: 'Awards Won' },
  ]);

  // Bottom controls
  const [skipAI, setSkipAI] = useState(false);

  // Generation state
  const [steps, setSteps] = useState<StepState[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState('');

  // ---------------------------------------------------------------------------
  // Auto-generation on businessName change
  // ---------------------------------------------------------------------------
  const handleBusinessNameChange = useCallback((value: string) => {
    setBusinessName(value);
    const slug = slugify(value);
    setSiteId(slug);
    const domain = `${slug}.com`;
    const shortName = slug.split('-').slice(0, 2).join('-');
    setProdDomain(domain);
    setDevDomain(`${shortName}.local`);
    setEmail(`info@${domain}`);
    setAppointmentsEmail(`appointments@${domain}`);
  }, []);

  const setMediaFieldValue = (field: MediaFieldKey, value: string) => {
    if (field === 'logoImageUrl') setLogoImageUrl(value);
    else if (field === 'homeHeroImageUrl') setHomeHeroImageUrl(value);
    else setAboutBioImageUrl(value);
  };

  const uploadMediaOverride = async (field: MediaFieldKey, file: File) => {
    const uploadTargetSiteId = siteId.trim();
    if (!uploadTargetSiteId) {
      setError('Please set Site ID before uploading media.');
      return;
    }
    setMediaUploadingField(field);
    setError('');
    try {
      const formData = new FormData();
      formData.append('siteId', uploadTargetSiteId);
      formData.append('folder', 'onboarding-overrides');
      formData.append('file', file);

      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Image upload failed.'));
      }
      const payload = await response.json();
      if (!payload?.url) {
        throw new Error('Upload succeeded but URL was not returned.');
      }
      setMediaFieldValue(field, payload.url);
    } catch (err: any) {
      setError(err?.message || 'Image upload failed.');
    } finally {
      setMediaUploadingField(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Service toggling
  // ---------------------------------------------------------------------------
  const toggleService = (slug: string) => {
    setSelectedServices(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const selectAllInCategory = (category: string) => {
    const slugs = TCM_SERVICES[category].map(s => s.slug);
    setSelectedServices(prev => [...new Set([...prev, ...slugs])]);
  };

  const deselectAllInCategory = (category: string) => {
    const slugs = new Set(TCM_SERVICES[category].map(s => s.slug));
    setSelectedServices(prev => prev.filter(s => !slugs.has(s)));
  };

  // ---------------------------------------------------------------------------
  // Locale toggling
  // ---------------------------------------------------------------------------
  const toggleLocale = (locale: string) => {
    if (locale === 'en') return; // English always required
    setSupportedLocales(prev => {
      const next = prev.includes(locale)
        ? prev.filter(l => l !== locale)
        : [...prev, locale];
      // Reset default locale if removed
      if (!next.includes(defaultLocale)) setDefaultLocale('en');
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Owner language toggling
  // ---------------------------------------------------------------------------
  const toggleOwnerLanguage = (lang: string) => {
    setOwnerLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  // ---------------------------------------------------------------------------
  // Credential management
  // ---------------------------------------------------------------------------
  const addCredential = () => {
    setCredentials(prev => [...prev, { credential: '', institution: '', year: '', location: '' }]);
  };

  const updateCredential = (index: number, field: keyof Credential, value: string) => {
    setCredentials(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const removeCredential = (index: number) => {
    setCredentials(prev => prev.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------------------
  // Team management
  // ---------------------------------------------------------------------------
  const addTeamMember = () => {
    setTeamMembers(prev => [
      ...prev,
      { name: '', title: '', role: '', languages: ['English'], specializations: '' },
    ]);
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    setTeamMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const toggleTeamMemberLanguage = (index: number, lang: string) => {
    setTeamMembers(prev =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const langs = m.languages.includes(lang)
          ? m.languages.filter(l => l !== lang)
          : [...m.languages, lang];
        return { ...m, languages: langs };
      })
    );
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------------------
  // Stats management
  // ---------------------------------------------------------------------------
  const addStat = () => {
    setStats(prev => [...prev, { icon: 'star', number: '', label: '' }]);
  };

  const updateStat = (index: number, field: keyof StatItem, value: string) => {
    setStats(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeStat = (index: number) => {
    setStats(prev => prev.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------------------
  // USP management
  // ---------------------------------------------------------------------------
  const addUsp = () => setUsps(prev => [...prev, '']);

  const updateUsp = (index: number, value: string) => {
    setUsps(prev => prev.map((u, i) => i === index ? value : u));
  };

  const removeUsp = (index: number) => {
    setUsps(prev => prev.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------------------
  // Form validation
  // ---------------------------------------------------------------------------
  const isFormValid =
    businessName.trim() !== '' &&
    siteId.trim() !== '' &&
    cloneFrom !== '' &&
    selectedServices.length > 0;

  // ---------------------------------------------------------------------------
  // Build intake JSON
  // ---------------------------------------------------------------------------
  const buildIntakeJson = () => {
    // Convert hours to lowercase keys to match API expectations
    const lowerHours: Record<string, string> = {};
    for (const [day, time] of Object.entries(hours)) {
      lowerHours[day.toLowerCase()] = time;
    }

    return {
      clientId: siteId.trim(),
      templateSiteId: cloneFrom,
      skipAi: skipAI,
      industry: 'chinese-medicine',
      business: {
        name: businessName,
        ownerName,
        ownerTitle,
        ownerLanguages,
        foundedYear: foundedYear ? parseInt(foundedYear) : undefined,
        yearsExperience,
        ownerCredentials: credentials,
        ownerCertifications: ownerCertifications
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        ownerSpecializations: ownerSpecializations
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        teamMembers: teamMembers.map(m => ({
          ...m,
          specializations: m.specializations
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        })),
      },
      location: {
        address,
        city,
        state,
        zip,
        phone,
        email,
        phoneEmergency: emergencyPhone || phone,
        emailAppointments: appointmentsEmail,
      },
      media: {
        logoImageUrl: logoImageUrl || undefined,
        homeHeroImageUrl: homeHeroImageUrl || undefined,
        aboutBioImageUrl: aboutBioImageUrl || undefined,
      },
      hours: lowerHours,
      services: {
        enabled: selectedServices,
      },
      brand: {
        variant: brandVariant,
        primaryColor: primaryOverride || undefined,
      },
      locales: {
        supported: supportedLocales,
        default: defaultLocale,
      },
      domains: { production: prodDomain, dev: devDomain },
      contentTone: {
        voice,
        targetDemographic,
        uniqueSellingPoints: usps.filter(Boolean),
      },
      social: { facebook, instagram, google, youtube, wechat },
      insurance: {
        acceptsInsurance,
        inNetworkNote,
        financingNote,
        membershipEnabled,
        membershipName,
      },
      booking: { onlineBookingEnabled, bookingUrl },
      stats: stats.filter(s => s.number && s.label),
    };
  };

  // ---------------------------------------------------------------------------
  // SSE Generation
  // ---------------------------------------------------------------------------
  const handleGenerate = async () => {
    if (!siteId.trim()) {
      setError('Site ID is required before onboarding.');
      setPhase('error');
      return;
    }
    setPhase('generating');
    setSteps(PIPELINE_STEPS.map(s => ({ ...s, status: 'pending', message: '', duration: 0 })));

    try {
      const intake = buildIntakeJson();
      const response = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intake),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to start onboarding');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === 'progress') {
              setSteps(prev =>
                prev.map(s => (s.id === data.step ? { ...s, ...data } : s))
              );
            } else if (currentEvent === 'complete') {
              setResult(data);
              setPhase('done');
            } else if (currentEvent === 'error') {
              setError(data.message);
              setPhase('error');
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      setPhase('error');
    }
  };

  // ---------------------------------------------------------------------------
  // Reset form
  // ---------------------------------------------------------------------------
  const resetForm = () => {
    setPhase('form');
    setBusinessName('');
    setSiteId('');
    setCloneFrom(templateSites[0]?.id || '');
    setOwnerName('');
    setOwnerTitle('');
    setOwnerLanguages(['English']);
    setFoundedYear('');
    setYearsExperience('');
    setCredentials([]);
    setOwnerCertifications('');
    setOwnerSpecializations('');
    setTeamMembers([]);
    setAddress('');
    setCity('');
    setState('');
    setZip('');
    setPhone('');
    setEmail('');
    setEmergencyPhone('');
    setAppointmentsEmail('');
    setLogoImageUrl('');
    setHomeHeroImageUrl('');
    setAboutBioImageUrl('');
    setHours({
      Monday: '9:00 AM - 5:00 PM',
      Tuesday: '9:00 AM - 5:00 PM',
      Wednesday: '9:00 AM - 5:00 PM',
      Thursday: '9:00 AM - 5:00 PM',
      Friday: '9:00 AM - 5:00 PM',
      Saturday: '9:00 AM - 1:00 PM',
      Sunday: 'Closed',
    });
    setSelectedServices(getAllServiceSlugs());
    setBrandVariant('teal-gold');
    setPrimaryOverride('');
    setSupportedLocales(['en']);
    setDefaultLocale('en');
    setProdDomain('');
    setDevDomain('');
    setVoice('warm-professional');
    setTargetDemographic('');
    setUsps([]);
    setFacebook('');
    setInstagram('');
    setGoogle('');
    setYoutube('');
    setWechat('');
    setAcceptsInsurance(false);
    setInNetworkNote('');
    setFinancingNote('');
    setMembershipEnabled(false);
    setMembershipName('');
    setOnlineBookingEnabled(false);
    setBookingUrl('/book');
    setStats([
      { icon: 'calendar', number: '15+', label: 'Years Experience' },
      { icon: 'users', number: '10,000+', label: 'Happy Patients' },
      { icon: 'star', number: '4.9', label: 'Google Rating' },
      { icon: 'award', number: '5', label: 'Awards Won' },
    ]);
    setSkipAI(false);
    setSteps([]);
    setResult(null);
    setError('');
  };

  // =========================================================================
  // RENDER: Generating Phase
  // =========================================================================
  if (phase === 'generating') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-gray-200 rounded-xl bg-white p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Generating Site...</h2>
          <div className="space-y-4">
            {steps.map(step => (
              <div key={step.id} className="flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {step.status === 'pending' && (
                    <span className="inline-block w-5 h-5 text-center text-gray-400 leading-5">&#9675;</span>
                  )}
                  {step.status === 'running' && (
                    <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {step.status === 'done' && (
                    <span className="inline-block w-5 h-5 text-center text-green-600 leading-5 font-bold">&#10003;</span>
                  )}
                  {step.status === 'error' && (
                    <span className="inline-block w-5 h-5 text-center text-red-600 leading-5 font-bold">&#10007;</span>
                  )}
                </div>

                {/* Label + message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      step.status === 'running' ? 'text-blue-700' :
                      step.status === 'done' ? 'text-green-700' :
                      step.status === 'error' ? 'text-red-700' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                    {step.status === 'done' && step.duration > 0 && (
                      <Badge variant="success" size="sm">
                        {(step.duration / 1000).toFixed(1)}s
                      </Badge>
                    )}
                  </div>
                  {step.message && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{step.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Done Phase
  // =========================================================================
  if (phase === 'done' && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-gray-200 rounded-xl bg-white p-8">
          {/* Success banner */}
          <div className="flex items-center gap-3 mb-6 bg-green-50 border border-green-200 rounded-lg px-5 py-4">
            <span className="text-green-600 text-2xl">&#10003;</span>
            <div>
              <h2 className="text-lg font-bold text-green-800">Site Generated Successfully</h2>
              <p className="text-sm text-green-700">{businessName} is ready to go.</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500">Entries</p>
              <p className="text-lg font-semibold text-gray-900">{result.entries}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500">Services</p>
              <p className="text-lg font-semibold text-gray-900">{result.services}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500">Locales</p>
              <p className="text-lg font-semibold text-gray-900">{supportedLocales.join(', ')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500">Domains</p>
              <p className="text-lg font-semibold text-gray-900 truncate">{result.domains}</p>
            </div>
          </div>

          {/* Verification issues */}
          {result.errors && result.errors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 mb-2">Errors</p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          {result.warnings && result.warnings.length > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800 mb-2">Warnings</p>
              <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.href = `/admin/content?siteId=${result.siteId}&locale=en`}
            >
              View in Content Editor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`http://${devDomain}:3003/en`, '_blank')}
            >
              Preview Site
            </Button>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Onboard Another Client
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Error Phase
  // =========================================================================
  if (phase === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-gray-200 rounded-xl bg-white p-8">
          <div className="flex items-center gap-3 mb-6 bg-red-50 border border-red-200 rounded-lg px-5 py-4">
            <span className="text-red-600 text-2xl">&#10007;</span>
            <div>
              <h2 className="text-lg font-bold text-red-800">Generation Failed</h2>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setPhase('form')}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Form Phase
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Section 1: Identity & Template */}
      <CollapsibleSection title="Identity & Template" defaultOpen badge="Required">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Business Name"
            value={businessName}
            onChange={e => handleBusinessNameChange(e.target.value)}
            placeholder="e.g. Golden Lotus Acupuncture"
            required
            fullWidth
          />
          <Input
            label="Site ID"
            value={siteId}
            onChange={e => setSiteId(e.target.value)}
            placeholder="auto-generated"
            required
            fullWidth
          />
        </div>
        <Select
          label="Clone From"
          value={cloneFrom}
          onChange={e => setCloneFrom(e.target.value)}
          options={templateSites.map(s => ({ value: s.id, label: s.name }))}
          fullWidth
        />
      </CollapsibleSection>

      {/* Section 2: Business Info */}
      <CollapsibleSection title="Business Info" defaultOpen badge="Required">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Owner Name" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Dr. Wei Chen" fullWidth />
          <Input label="Owner Title" value={ownerTitle} onChange={e => setOwnerTitle(e.target.value)} placeholder="L.Ac., NCCAOM, MSTCM" fullWidth />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Owner Languages</label>
          <div className="flex flex-wrap gap-4">
            {LANGUAGE_OPTIONS.map(lang => (
              <Checkbox
                key={lang}
                label={lang}
                checked={ownerLanguages.includes(lang)}
                onChange={() => toggleOwnerLanguage(lang)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Founded Year" type="number" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} placeholder="2010" fullWidth />
          <Input label="Years Experience" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} placeholder="8+" fullWidth />
        </div>

        <Input label="Owner Certifications" value={ownerCertifications} onChange={e => setOwnerCertifications(e.target.value)} placeholder="NCCAOM, California L.Ac. (comma-separated)" fullWidth />
        <Input label="Owner Specializations" value={ownerSpecializations} onChange={e => setOwnerSpecializations(e.target.value)} placeholder="Pain Management, Fertility, Stress Relief (comma-separated)" fullWidth />

        {/* Credentials */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Owner Credentials</label>
          {credentials.map((cred, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 items-end">
              <Input label="Credential" value={cred.credential} onChange={e => updateCredential(i, 'credential', e.target.value)} placeholder="MSTCM" fullWidth />
              <Input label="Institution" value={cred.institution} onChange={e => updateCredential(i, 'institution', e.target.value)} placeholder="ACTCM" fullWidth />
              <Input label="Year" value={cred.year} onChange={e => updateCredential(i, 'year', e.target.value)} placeholder="2012" fullWidth />
              <div className="flex gap-2 items-end">
                <Input label="Location" value={cred.location} onChange={e => updateCredential(i, 'location', e.target.value)} placeholder="San Francisco, CA" fullWidth />
                <button type="button" onClick={() => removeCredential(i)} className="text-red-500 hover:text-red-700 text-sm pb-3 flex-shrink-0">Remove</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addCredential} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Credential</button>
        </div>

        {/* Team Members */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Team Members</label>
          {teamMembers.map((member, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4 mb-3 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Input label="Name" value={member.name} onChange={e => updateTeamMember(i, 'name', e.target.value)} fullWidth />
                <Input label="Title" value={member.title} onChange={e => updateTeamMember(i, 'title', e.target.value)} fullWidth />
                <Input label="Role" value={member.role} onChange={e => updateTeamMember(i, 'role', e.target.value)} placeholder="Acupuncturist" fullWidth />
              </div>
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 block mb-1">Languages</label>
                <div className="flex flex-wrap gap-3">
                  {LANGUAGE_OPTIONS.map(lang => (
                    <Checkbox
                      key={`team-${i}-${lang}`}
                      label={lang}
                      checked={member.languages.includes(lang)}
                      onChange={() => toggleTeamMemberLanguage(i, lang)}
                    />
                  ))}
                </div>
              </div>
              <Input label="Specializations" value={member.specializations} onChange={e => updateTeamMember(i, 'specializations', e.target.value)} placeholder="comma-separated" fullWidth />
              <button type="button" onClick={() => removeTeamMember(i)} className="text-sm text-red-500 hover:text-red-700 mt-2 font-medium">Remove</button>
            </div>
          ))}
          <button type="button" onClick={addTeamMember} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Team Member</button>
        </div>
      </CollapsibleSection>

      {/* Section 3: Location & Contact */}
      <CollapsibleSection title="Location & Contact" defaultOpen badge="Required">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, Suite 200" fullWidth />
          </div>
          <Input label="City" value={city} onChange={e => setCity(e.target.value)} placeholder="Los Angeles" fullWidth />
          <div className="grid grid-cols-2 gap-4">
            <Input label="State" value={state} onChange={e => setState(e.target.value)} placeholder="CA" maxLength={2} fullWidth />
            <Input label="Zip" value={zip} onChange={e => setZip(e.target.value)} placeholder="90001" fullWidth />
          </div>
          <Input label="Phone" value={phone} onChange={e => { setPhone(e.target.value); if (!emergencyPhone) setEmergencyPhone(e.target.value); }} placeholder="(718) 555-0234" fullWidth />
          <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@example.com" fullWidth />
          <Input label="Emergency Phone" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="Defaults to phone" fullWidth />
          <Input label="Appointments Email" value={appointmentsEmail} onChange={e => setAppointmentsEmail(e.target.value)} placeholder="appointments@example.com" fullWidth />
        </div>
      </CollapsibleSection>

      {/* Section 3B: Media Overrides */}
      <CollapsibleSection title="Media Overrides" defaultOpen={false} badge="Optional">
        <p className="text-xs text-gray-500">
          Provide image URLs to replace template media during onboarding, or use Choose to upload.
        </p>
        <p className="text-xs text-gray-500">
          Uploaded files are stored under your storage bucket path
          {' '}<code className="rounded bg-gray-100 px-1 py-0.5">/{"<site-id>"}/onboarding-overrides/</code>.
        </p>
        {!siteId.trim() ? (
          <p className="text-xs text-amber-700">
            Enter Site ID first to enable Choose buttons and ensure uploads go to the new site folder.
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Input
              label="Site Logo URL"
              value={logoImageUrl}
              onChange={e => setLogoImageUrl(e.target.value)}
              placeholder="https://.../logo.png or .svg"
              fullWidth
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                disabled={mediaUploadingField === 'logoImageUrl' || !siteId.trim()}
                onClick={() => logoFileInputRef.current?.click()}
              >
                {mediaUploadingField === 'logoImageUrl' ? 'Uploading...' : 'Choose Logo'}
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setLogoImageUrl('')}
              >
                Clear
              </button>
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const input = event.currentTarget;
                  const file = input.files?.[0];
                  if (file) await uploadMediaOverride('logoImageUrl', file);
                  input.value = '';
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Input
              label="Home Hero Photo URL"
              value={homeHeroImageUrl}
              onChange={e => setHomeHeroImageUrl(e.target.value)}
              placeholder="https://.../home-hero.jpg"
              fullWidth
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                disabled={mediaUploadingField === 'homeHeroImageUrl' || !siteId.trim()}
                onClick={() => homeHeroFileInputRef.current?.click()}
              >
                {mediaUploadingField === 'homeHeroImageUrl' ? 'Uploading...' : 'Choose Home Hero'}
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setHomeHeroImageUrl('')}
              >
                Clear
              </button>
              <input
                ref={homeHeroFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const input = event.currentTarget;
                  const file = input.files?.[0];
                  if (file) await uploadMediaOverride('homeHeroImageUrl', file);
                  input.value = '';
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Input
              label="About Bio Photo URL"
              value={aboutBioImageUrl}
              onChange={e => setAboutBioImageUrl(e.target.value)}
              placeholder="https://.../doctor-bio.jpg"
              fullWidth
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                disabled={mediaUploadingField === 'aboutBioImageUrl' || !siteId.trim()}
                onClick={() => aboutBioFileInputRef.current?.click()}
              >
                {mediaUploadingField === 'aboutBioImageUrl' ? 'Uploading...' : 'Choose About Photo'}
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setAboutBioImageUrl('')}
              >
                Clear
              </button>
              <input
                ref={aboutBioFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const input = event.currentTarget;
                  const file = input.files?.[0];
                  if (file) await uploadMediaOverride('aboutBioImageUrl', file);
                  input.value = '';
                }}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 4: Hours */}
      <CollapsibleSection title="Hours" defaultOpen badge="Required">
        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="grid grid-cols-[120px_1fr] items-center gap-4">
              <label className="text-sm font-medium text-gray-700">{day}</label>
              <Input
                value={hours[day]}
                onChange={e => setHours(prev => ({ ...prev, [day]: e.target.value }))}
                placeholder="9:00 AM - 5:00 PM"
                fullWidth
              />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 5: Modalities */}
      <CollapsibleSection title="Modalities" defaultOpen badge="Required">
        <div className="space-y-5">
          {Object.entries(TCM_SERVICES).map(([category, services]) => {
            const allSelected = services.every(s => selectedServices.includes(s.slug));
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">{category}</h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => selectAllInCategory(category)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => deselectAllInCategory(category)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {services.map(svc => (
                    <Checkbox
                      key={svc.slug}
                      label={svc.label}
                      checked={selectedServices.includes(svc.slug)}
                      onChange={() => toggleService(svc.slug)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">{selectedServices.length} modalities selected</p>
      </CollapsibleSection>

      {/* Section 6: Brand */}
      <CollapsibleSection title="Brand" defaultOpen badge="Required">
        <div className="space-y-3">
          {BRAND_VARIANTS.map(variant => (
            <label key={variant.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="brandVariant"
                value={variant.id}
                checked={brandVariant === variant.id}
                onChange={e => setBrandVariant(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: variant.primary }} />
                <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: variant.secondary }} />
                <span className="text-sm text-gray-700">{variant.label}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 max-w-xs">
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Primary Color Override</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryOverride || BRAND_VARIANTS.find(v => v.id === brandVariant)!.primary}
              onChange={e => setPrimaryOverride(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-gray-300"
            />
            <span className="text-sm text-gray-500">
              {primaryOverride || 'Using variant default'}
            </span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 7: Locales & Domain */}
      <CollapsibleSection title="Locales & Domain" defaultOpen badge="Required">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Supported Locales</label>
          <div className="flex flex-wrap gap-4">
            <Checkbox label="English" checked disabled />
            <Checkbox
              label="Chinese (Mandarin)"
              checked={supportedLocales.includes('zh')}
              onChange={() => toggleLocale('zh')}
            />
          </div>
        </div>
        <Select
          label="Default Locale"
          value={defaultLocale}
          onChange={e => setDefaultLocale(e.target.value)}
          options={supportedLocales.map(l => ({ value: l, label: l.toUpperCase() }))}
          fullWidth
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Production Domain" value={prodDomain} onChange={e => setProdDomain(e.target.value)} placeholder="example.com" fullWidth />
          <Input label="Dev Domain" value={devDomain} onChange={e => setDevDomain(e.target.value)} placeholder="example.local" fullWidth />
        </div>
      </CollapsibleSection>

      {/* Section 8: Content Tone (optional) */}
      <CollapsibleSection title="Content Tone" defaultOpen={false}>
        <Select
          label="Voice"
          value={voice}
          onChange={e => setVoice(e.target.value)}
          options={[
            { value: 'warm-professional', label: 'Warm & Professional' },
            { value: 'clinical', label: 'Clinical' },
            { value: 'casual-friendly', label: 'Casual & Friendly' },
          ]}
          fullWidth
        />
        <Input label="Target Demographic" value={targetDemographic} onChange={e => setTargetDemographic(e.target.value)} placeholder="Families, young professionals" fullWidth />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Unique Selling Points</label>
          {usps.map((usp, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input value={usp} onChange={e => updateUsp(i, e.target.value)} placeholder="e.g. Over 20 years of clinical experience" fullWidth />
              <button type="button" onClick={() => removeUsp(i)} className="text-red-500 hover:text-red-700 text-sm flex-shrink-0">Remove</button>
            </div>
          ))}
          <button type="button" onClick={addUsp} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add USP</button>
        </div>
      </CollapsibleSection>

      {/* Section 9: Social Media (optional) */}
      <CollapsibleSection title="Social Media" defaultOpen={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Facebook" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." fullWidth />
          <Input label="Instagram" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." fullWidth />
          <Input label="Google" value={google} onChange={e => setGoogle(e.target.value)} placeholder="https://g.page/..." fullWidth />
          <Input label="YouTube" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/..." fullWidth />
          <Input label="WeChat" value={wechat} onChange={e => setWechat(e.target.value)} placeholder="WeChat ID or link" fullWidth />
        </div>
      </CollapsibleSection>

      {/* Section 10: Insurance & Booking (optional) */}
      <CollapsibleSection title="Insurance & Booking" defaultOpen={false}>
        <Checkbox label="Accepts Insurance" checked={acceptsInsurance} onChange={e => setAcceptsInsurance(e.target.checked)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="In-Network Note" value={inNetworkNote} onChange={e => setInNetworkNote(e.target.value)} placeholder="Most insurance plans accepted for acupuncture" fullWidth />
          <Input label="Financing Note" value={financingNote} onChange={e => setFinancingNote(e.target.value)} placeholder="CareCredit and in-house plans available" fullWidth />
        </div>
        <Checkbox label="Membership Plan Enabled" checked={membershipEnabled} onChange={e => setMembershipEnabled(e.target.checked)} />
        {membershipEnabled && (
          <Input label="Membership Plan Name" value={membershipName} onChange={e => setMembershipName(e.target.value)} placeholder="Wellness Membership Plan" fullWidth />
        )}
        <Checkbox label="Online Booking Enabled" checked={onlineBookingEnabled} onChange={e => setOnlineBookingEnabled(e.target.checked)} />
        {onlineBookingEnabled && (
          <Input label="Booking URL" value={bookingUrl} onChange={e => setBookingUrl(e.target.value)} placeholder="/book" fullWidth />
        )}
      </CollapsibleSection>

      {/* Section 11: Stats (optional) */}
      <CollapsibleSection title="Stats" defaultOpen={false}>
        {stats.map((stat, i) => (
          <div key={i} className="grid grid-cols-[140px_1fr_1fr_auto] gap-3 items-end">
            <Select
              label="Icon"
              value={stat.icon}
              onChange={e => updateStat(i, 'icon', e.target.value)}
              options={STAT_ICONS.map(ic => ({ value: ic, label: ic.charAt(0).toUpperCase() + ic.slice(1) }))}
              fullWidth
            />
            <Input label="Number" value={stat.number} onChange={e => updateStat(i, 'number', e.target.value)} placeholder="15+" fullWidth />
            <Input label="Label" value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} placeholder="Years Experience" fullWidth />
            <button type="button" onClick={() => removeStat(i)} className="text-red-500 hover:text-red-700 text-sm pb-3">Remove</button>
          </div>
        ))}
        <button type="button" onClick={addStat} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Stat</button>
      </CollapsibleSection>

      {/* Bottom Controls */}
      <div className="border border-gray-200 rounded-xl bg-white px-6 py-5 flex items-center justify-between">
        <Checkbox
          label="Skip AI content generation (faster, uses template content)"
          checked={skipAI}
          onChange={e => setSkipAI(e.target.checked)}
        />
        <Button
          variant="primary"
          size="md"
          disabled={!isFormValid}
          loading={false}
          onClick={handleGenerate}
        >
          Generate Site
        </Button>
      </div>
    </div>
  );
}
