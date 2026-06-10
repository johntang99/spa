import { getSupabaseServerClient } from '@/lib/supabase/server';

export type RewriteScope = 'services' | 'conditions' | 'custom';
export type RewriteMode = 'conservative' | 'balanced' | 'aggressive';
export type RewriteStatus = 'queued' | 'running' | 'needs_review' | 'completed' | 'failed';

export interface RewriteJobRow {
  id: string;
  site_id: string;
  locale: string;
  scope: RewriteScope;
  target_paths: string[];
  mode: RewriteMode;
  status: RewriteStatus;
  provider: string;
  model: string | null;
  requirements: Record<string, unknown>;
  source_of_truth: 'db' | 'local';
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface RewriteItemRow {
  id: string;
  job_id: string;
  site_id: string;
  locale: string;
  path: string;
  field_path: string;
  source_hash: string | null;
  source_text: string;
  rewritten_text: string | null;
  similarity_score: number | null;
  risk_flags: string[];
  validation: Record<string, unknown>;
  validation_passed: boolean;
  approved: boolean | null;
  approved_by: string | null;
  approved_at: string | null;
  applied: boolean;
  applied_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRewriteJobInput {
  siteId: string;
  locale: string;
  scope: RewriteScope;
  targetPaths: string[];
  mode: RewriteMode;
  provider?: string;
  model?: string | null;
  requirements?: Record<string, unknown>;
  sourceOfTruth?: 'db' | 'local';
  createdBy?: string;
}

export interface UpsertRewriteItemInput {
  jobId: string;
  siteId: string;
  locale: string;
  path: string;
  fieldPath: string;
  sourceHash?: string | null;
  sourceText: string;
  rewrittenText?: string | null;
  similarityScore?: number | null;
  riskFlags?: string[];
  validation?: Record<string, unknown>;
  validationPassed?: boolean;
  error?: string | null;
}

export function canUseRewriteDb() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function createRewriteJob(input: CreateRewriteJobInput): Promise<RewriteJobRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('rewrite_jobs')
    .insert({
      site_id: input.siteId,
      locale: input.locale,
      scope: input.scope,
      target_paths: input.targetPaths,
      mode: input.mode,
      status: 'queued',
      provider: input.provider || 'claude',
      model: input.model || null,
      requirements: input.requirements || {},
      source_of_truth: input.sourceOfTruth || 'db',
      created_by: input.createdBy || null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Supabase createRewriteJob error:', error);
    return null;
  }
  return (data || null) as RewriteJobRow | null;
}

export async function listRewriteJobs(params: {
  siteIds?: string[];
  locale?: string;
  limit?: number;
}): Promise<RewriteJobRow[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from('rewrite_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(params.limit || 30, 200)));

  if (params.siteIds && params.siteIds.length > 0) {
    query = query.in('site_id', params.siteIds);
  }
  if (params.locale) {
    query = query.eq('locale', params.locale);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase listRewriteJobs error:', error);
    return [];
  }
  return (data || []) as RewriteJobRow[];
}

export async function getRewriteJobById(jobId: string): Promise<RewriteJobRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from('rewrite_jobs').select('*').eq('id', jobId).maybeSingle();
  if (error) {
    console.error('Supabase getRewriteJobById error:', error);
    return null;
  }
  return (data || null) as RewriteJobRow | null;
}

export async function updateRewriteJob(params: {
  jobId: string;
  status?: RewriteStatus;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}): Promise<RewriteJobRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (params.status) payload.status = params.status;
  if (params.error !== undefined) payload.error = params.error;
  if (params.startedAt !== undefined) payload.started_at = params.startedAt;
  if (params.completedAt !== undefined) payload.completed_at = params.completedAt;

  const { data, error } = await supabase
    .from('rewrite_jobs')
    .update(payload)
    .eq('id', params.jobId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Supabase updateRewriteJob error:', error);
    return null;
  }
  return (data || null) as RewriteJobRow | null;
}

export async function replaceRewriteItems(items: UpsertRewriteItemInput[]): Promise<number> {
  if (items.length === 0) return 0;
  const supabase = getSupabaseServerClient();
  if (!supabase) return 0;

  const jobId = items[0].jobId;
  const { error: deleteError } = await supabase.from('rewrite_items').delete().eq('job_id', jobId);
  if (deleteError) {
    console.error('Supabase replaceRewriteItems delete error:', deleteError);
    return 0;
  }

  const now = new Date().toISOString();
  const rows = items.map((item) => ({
    job_id: item.jobId,
    site_id: item.siteId,
    locale: item.locale,
    path: item.path,
    field_path: item.fieldPath,
    source_hash: item.sourceHash || null,
    source_text: item.sourceText,
    rewritten_text: item.rewrittenText || null,
    similarity_score: item.similarityScore ?? null,
    risk_flags: item.riskFlags || [],
    validation: item.validation || {},
    validation_passed: item.validationPassed ?? false,
    error: item.error || null,
    updated_at: now,
  }));

  const chunkSize = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('rewrite_items')
      .insert(chunk);
    if (error) {
      console.error('Supabase replaceRewriteItems insert error:', error);
      return inserted;
    }
    inserted += chunk.length;
  }
  return inserted;
}

export async function listRewriteItems(params: {
  jobId: string;
  limit?: number;
}): Promise<RewriteItemRow[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('rewrite_items')
    .select('*')
    .eq('job_id', params.jobId)
    .order('created_at', { ascending: true })
    .limit(Math.max(1, Math.min(params.limit || 500, 2000)));

  if (error) {
    console.error('Supabase listRewriteItems error:', error);
    return [];
  }
  return (data || []) as RewriteItemRow[];
}

export async function updateRewriteItemDecision(params: {
  jobId: string;
  itemId: string;
  approved: boolean;
  approvedBy?: string;
}): Promise<RewriteItemRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const payload = params.approved
    ? {
        approved: true,
        approved_by: params.approvedBy || null,
        approved_at: now,
        updated_at: now,
      }
    : {
        approved: false,
        approved_by: params.approvedBy || null,
        approved_at: now,
        updated_at: now,
      };

  const { data, error } = await supabase
    .from('rewrite_items')
    .update(payload)
    .eq('job_id', params.jobId)
    .eq('id', params.itemId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Supabase updateRewriteItemDecision error:', error);
    return null;
  }
  return (data || null) as RewriteItemRow | null;
}

export async function markRewriteItemsApplied(params: {
  jobId: string;
  itemIds: string[];
}): Promise<number> {
  if (params.itemIds.length === 0) return 0;
  const supabase = getSupabaseServerClient();
  if (!supabase) return 0;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('rewrite_items')
    .update({
      applied: true,
      applied_at: now,
      updated_at: now,
    })
    .eq('job_id', params.jobId)
    .in('id', params.itemIds)
    .select('id');

  if (error) {
    console.error('Supabase markRewriteItemsApplied error:', error);
    return 0;
  }
  return Array.isArray(data) ? data.length : 0;
}

export async function approveRewriteItems(params: {
  jobId: string;
  itemIds: string[];
  approved: boolean;
  approvedBy?: string;
}): Promise<number> {
  if (params.itemIds.length === 0) return 0;
  const supabase = getSupabaseServerClient();
  if (!supabase) return 0;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('rewrite_items')
    .update({
      approved: params.approved,
      approved_by: params.approvedBy || null,
      approved_at: now,
      updated_at: now,
    })
    .eq('job_id', params.jobId)
    .in('id', params.itemIds)
    .select('id');

  if (error) {
    console.error('Supabase approveRewriteItems error:', error);
    return 0;
  }
  return Array.isArray(data) ? data.length : 0;
}

export async function writeRewriteAuditLog(params: {
  jobId: string;
  action:
    | 'job_created'
    | 'job_started'
    | 'item_generated'
    | 'item_regenerated'
    | 'item_approved'
    | 'item_rejected'
    | 'job_applied'
    | 'job_rolled_back'
    | 'job_failed';
  actorId?: string;
  actorEmail?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.from('rewrite_audit_logs').insert({
    job_id: params.jobId,
    action: params.action,
    actor_id: params.actorId || null,
    actor_email: params.actorEmail || null,
    metadata: params.metadata || {},
  });
  if (error) {
    console.error('Supabase writeRewriteAuditLog error:', error);
  }
}
