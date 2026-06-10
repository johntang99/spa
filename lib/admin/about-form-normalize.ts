import { profileWithMergedBio } from '@/lib/about-profile-bio';

/** When opening About in the admin form: legacy `team` → `staffs`, merge `profile.quote` into `bio`. */
export function normalizeAboutFormData(data: Record<string, any>): Record<string, any> {
  const next = { ...data };
  if (next.team && !next.staffs) {
    next.staffs = { ...next.team };
  }
  if (next.profile) {
    next.profile = profileWithMergedBio(next.profile);
  }
  return next;
}

/** On save, avoid duplicate staff keys. */
export function finalizeAboutFormForSave(data: Record<string, any>): Record<string, any> {
  const next = { ...data };
  if (next.staffs && next.team) {
    delete next.team;
  }
  if (next.profile && typeof next.profile === 'object') {
    next.profile = profileWithMergedBio(next.profile) ?? next.profile;
  }
  return next;
}
