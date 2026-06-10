import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { MediaItem } from '@/lib/admin/media';

interface MediaRow {
  id: string;
  site_id: string;
  path: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export function canUseMediaDb() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function listMediaDb(siteId: string): Promise<MediaItem[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('media_assets')
    .select('id,site_id,path,url')
    .eq('site_id', siteId)
    .order('path', { ascending: true });
  if (error) {
    console.error('Supabase listMediaDb error:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: (row as MediaRow).id,
    path: (row as MediaRow).path,
    url: (row as MediaRow).url,
  }));
}

export async function upsertMediaDb(params: {
  siteId: string;
  path: string;
  url: string;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('media_assets')
    .upsert(
      {
        site_id: params.siteId,
        path: params.path,
        url: params.url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'site_id,path' }
    );
  if (error) {
    console.error('Supabase upsertMediaDb error:', error);
  }
}

export async function deleteMediaDb(siteId: string, path: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('media_assets')
    .delete()
    .eq('site_id', siteId)
    .eq('path', path);
  if (error) {
    console.error('Supabase deleteMediaDb error:', error);
  }
}
