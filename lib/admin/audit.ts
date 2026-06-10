import fs from 'fs/promises';
import path from 'path';
import type { User } from '@/lib/types';
import { getSupabaseServerClient } from '@/lib/supabase/server';

interface AuditLogInput {
  actor?: Pick<User, 'id' | 'email'>;
  action: string;
  siteId?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const payload = {
    actor_id: input.actor?.id || null,
    actor_email: input.actor?.email || null,
    action: input.action,
    site_id: input.siteId || null,
    metadata: input.metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.from('admin_audit_logs').insert(payload);
      if (!error) return;
      console.error('Supabase writeAuditLog error:', error);
    }
  } catch (error) {
    console.error('writeAuditLog DB insert failed:', error);
  }

  try {
    const auditDir = path.join(process.cwd(), 'content', '_admin');
    const auditFile = path.join(auditDir, 'audit.log.jsonl');
    await fs.mkdir(auditDir, { recursive: true });
    await fs.appendFile(auditFile, `${JSON.stringify(payload)}\n`);
  } catch (error) {
    console.error('writeAuditLog file append failed:', error);
  }
}
