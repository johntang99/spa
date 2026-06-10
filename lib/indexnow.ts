// IndexNow (Phase 3C) — ping search engines when content publishes/updates so new and
// changed URLs get crawled fast. Key file lives at public/<INDEXNOW_KEY>.txt. Call
// pingIndexNow(urls) from the content save pipeline (best-effort, never blocks the save).
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'd4a5c5a7860afb9f14615445e216433a';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

export async function pingIndexNow(urls: string[], host?: string): Promise<boolean> {
  if (!urls.length) return false;
  try {
    const u = new URL(urls[0]);
    const hostName = host || u.host;
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: hostName,
        key: INDEXNOW_KEY,
        keyLocation: `${u.protocol}//${hostName}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
    });
    if (!res.ok && process.env.NODE_ENV !== 'production') {
      console.warn('IndexNow ping non-OK:', res.status);
    }
    return res.ok;
  } catch (e) {
    console.warn('IndexNow ping failed:', (e as Error).message);
    return false;
  }
}
