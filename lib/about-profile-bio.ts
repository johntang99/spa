/** Merge legacy `profile.quote` into a single Markdown bio for display or admin editing. */

export function buildProfileBioMarkdown(profile: {
  bio?: string;
  quote?: string;
  name?: string;
}): string {
  const bio = (profile.bio || '').trim();
  const quote = (profile.quote || '').trim();
  const name = (profile.name || '').trim();
  if (!quote) return bio;
  if (bio.includes(quote)) return bio;
  const quoted = quote
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
  const attribution = name ? `\n\n**${name}**` : '';
  return `${bio}\n\n${quoted}${attribution}`.trim();
}

/** Merge quote into `bio` when present; always omit legacy `quote` from the returned object. */
export function profileWithMergedBio(profile: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!profile || typeof profile !== 'object') return profile;
  const { quote: _legacy, ...rest } = profile;
  const quote = (profile.quote || '').trim();
  if (!quote) return { ...rest };
  const bio = buildProfileBioMarkdown(profile);
  return { ...rest, bio };
}
