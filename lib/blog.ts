export type BlogPostStatus = 'draft' | 'scheduled' | 'published';

export interface BlogScheduleFields {
  status?: BlogPostStatus;
  publishAt?: string;
  publishDate?: string;
  translationGroup?: string;
  image?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageSource?: string;
}

export function getBlogPostStatus(post: BlogScheduleFields): BlogPostStatus {
  if (post.status === 'draft' || post.status === 'scheduled' || post.status === 'published') {
    return post.status;
  }

  return 'published';
}

export function getBlogPostPublishTimestamp(post: BlogScheduleFields): number {
  const value = post.publishAt || post.publishDate || '';
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function isBlogPostVisible(post: BlogScheduleFields, now = new Date()): boolean {
  const status = getBlogPostStatus(post);
  if (status === 'draft') return false;
  if (status === 'published') return true;

  const publishAt = getBlogPostPublishTimestamp(post);
  if (!publishAt) return false;
  return publishAt <= now.getTime();
}

export function isBlogPostDue(post: BlogScheduleFields, now = new Date()): boolean {
  return getBlogPostStatus(post) === 'scheduled' && isBlogPostVisible(post, now);
}

export function normalizeBlogPostForPublish<T extends BlogScheduleFields>(post: T): T {
  const next = { ...post };
  const timestamp = getBlogPostPublishTimestamp(next);
  next.status = 'published';
  if (timestamp) {
    next.publishDate = new Date(timestamp).toISOString().slice(0, 10);
  }
  return next;
}
