import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Locale } from '@/lib/types';
import { getRequestSiteId, loadAllItems, loadItemBySlug, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Button, Badge, Icon, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { isBlogPostVisible } from '@/lib/blog';
import { getServiceSEOLinks } from '@/lib/seo-pages';

interface BlogContentBlock {
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'image' | 'video';
  level?: number;
  text?: string;
  items?: string[];
  src?: string;
  alt?: string;
  caption?: string;
}

interface BlogPostData {
  slug: string;
  type?: 'article' | 'video';
  title: string;
  excerpt?: string;
  image?: string;
  imageAlt?: string;
  category: string;
  author: string;
  publishDate: string;
  readTime?: string;
  tags?: string[];
  content?: BlogContentBlock[];
  contentMarkdown?: string;
  videoUrl?: string;
  relatedPosts?: string[];
  relatedServices?: string[];
  relatedConditions?: string[];
  // SEO fields from Auto Publisher
  metaTitle?: string;
  metaDescription?: string;
}

interface BlogDetailPageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

async function loadBlogPost(
  siteId: string,
  slug: string,
  locale: Locale
): Promise<BlogPostData | null> {
  return loadItemBySlug<BlogPostData>(siteId, locale, 'blog', slug);
}

async function loadPageJson(
  siteId: string,
  locale: Locale,
  pageName: string
): Promise<any | null> {
  return loadPageContent(pageName, locale, siteId);
}

function humanizeId(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const siteId = await getRequestSiteId();
  const post = await loadBlogPost(siteId, slug, locale);

  if (!post) {
    return buildPageMetadata({
      siteId,
      locale,
      slug: 'blog',
      title: 'Post Not Found',
    });
  }

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'blog',
    title: post.metaTitle || post.title,
    description:
      post.metaDescription ||
      post.excerpt ||
      (post.contentMarkdown ? post.contentMarkdown.slice(0, 160) : ''),
    canonicalPath: `/${locale}/blog/${slug}`,
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { locale, slug } = params;
  const siteId = await getRequestSiteId();
  
  // Load post content
  const post = await loadBlogPost(siteId, slug, locale);
  
  if (!post || !isBlogPostVisible(post)) {
    notFound();
  }

  // Load all posts for related posts
  const allPosts = await loadAllItems<BlogPostData>(siteId, locale, 'blog');
  const [servicesPage, conditionsPage] = await Promise.all([
    loadPageJson(siteId, locale, 'services'),
    loadPageJson(siteId, locale, 'conditions'),
  ]);
  const visiblePosts = allPosts.filter((candidate) => isBlogPostVisible(candidate));
  const relatedPosts = post.relatedPosts 
    ? visiblePosts.filter((p: any) => post.relatedPosts?.includes(p.slug)).slice(0, 3)
    : visiblePosts.filter((p: any) => p.category === post.category && p.slug !== post.slug).slice(0, 3);
  const servicesItems =
    servicesPage?.servicesList?.items ||
    servicesPage?.services ||
    [];
  const conditionsItems = conditionsPage?.conditions || [];
  // Resolve SEO page URLs for related services (links to SEO pages instead of anchor links)
  const seoServiceLinks = await getServiceSEOLinks(siteId, locale);
  const relatedServices = (post.relatedServices || []).map((serviceId) => {
    const match = servicesItems.find((service: any) => service?.id === serviceId);
    return {
      id: serviceId,
      title: match?.title || humanizeId(serviceId),
      link: seoServiceLinks.get(serviceId) || `/${locale}/services#${serviceId}`,
    };
  });
  const relatedConditions = (post.relatedConditions || []).map((conditionId) => {
    const match = conditionsItems.find((condition: any) => condition?.id === conditionId);
    return {
      id: conditionId,
      title: match?.title || humanizeId(conditionId),
      link: `/${locale}/conditions#${conditionId}`,
    };
  });
  const postType = post.type || 'article';
  const heroBottomSpacingStyle = { paddingBottom: 'var(--section-padding-y, 5rem)' };

  const normalizeMarkdown = (text: string) =>
    text
      .replace(/\r\n/g, '\n')
      .replace(/\|\s+\|(?=(?:-+:?|:?-+|[A-Za-z0-9"']))/g, '|\n|')
      .replace(/([^\n])\n-\s+/g, '$1\n\n- ')
      .replace(/([^\n])\n\*\s+/g, '$1\n\n- ');

  // Build JSON-LD Article schema for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || '',
    image: post.image || undefined,
    author: { '@type': 'Person', name: post.author || 'Staff' },
    datePublished: post.publishDate || undefined,
    publisher: {
      '@type': 'Organization',
      name: siteId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    },
  };

  return (
    <main className="min-h-screen">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section with Featured Image */}
      <section
        className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white pt-20 md:pt-24 px-4 overflow-hidden"
        style={heroBottomSpacingStyle}
      >
        <div className="absolute inset-0">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover opacity-30"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-gray-900" />
          )}
        </div>

        <div className="relative container mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/70 mb-8">
              <Link href={`/${locale}`} className="hover:text-white transition-colors">
                Home
              </Link>
              <Icon name="ChevronRight" size="sm" />
              <Link href={`/${locale}/blog`} className="hover:text-white transition-colors">
                Blog
              </Link>
              <Icon name="ChevronRight" size="sm" />
              <span className="text-white">{post.title}</span>
            </nav>

            {/* Category & Type */}
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="secondary">{post.category}</Badge>
              {postType === 'video' && (
                <Badge variant="primary">
                  <Icon name="Video" size="sm" className="mr-1" />
                  Video
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-display font-bold text-white mb-6">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Icon name="User" size="sm" />
                <span>{post.author}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Icon name="Calendar" size="sm" />
                <span>
                  {new Date(post.publishDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <span>•</span>
              {post.readTime && (
                <div className="flex items-center gap-2">
                  <Icon name="Clock" size="sm" />
                  <span>{post.readTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <article className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {post.image && (
              <div className="mb-10">
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            {/* Video Embed (if video type) */}
            {postType === 'video' && post.videoUrl && (
              <div className="mb-12">
                <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
                  {/* Placeholder for video embed */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="Video" size="xl" className="text-white/30" />
                  </div>
                  {/* In production, use iframe: <iframe src={post.videoUrl} ... /> */}
                </div>
              </div>
            )}

            {/* Article Content */}
            <div className="prose max-w-none">
              {post.contentMarkdown ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: (props) => (
                      <h1 className="text-3xl font-bold text-gray-900 mt-10 mb-4" {...props} />
                    ),
                    h2: (props) => (
                      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4" {...props} />
                    ),
                    h3: (props) => (
                      <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3" {...props} />
                    ),
                    p: (props) => (
                      <p className="text-gray-700 leading-relaxed mb-5" {...props} />
                    ),
                    ul: (props) => <ul className="list-disc pl-6 mb-5" {...props} />,
                    ol: (props) => <ol className="list-decimal pl-6 mb-5" {...props} />,
                    li: (props) => <li className="mb-2" {...props} />,
                    table: (props) => (
                      <div className="my-6 overflow-x-auto">
                        <table className="min-w-full border border-gray-200 rounded-lg" {...props} />
                      </div>
                    ),
                    thead: (props) => <thead className="bg-gray-50" {...props} />,
                    tr: (props) => <tr className="border-b border-gray-200" {...props} />,
                    th: (props) => (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 align-top border-r border-gray-200 last:border-r-0" {...props} />
                    ),
                    td: (props) => (
                      <td className="px-4 py-3 text-sm text-gray-700 align-top border-r border-gray-200 last:border-r-0" {...props} />
                    ),
                  }}
                >
                  {normalizeMarkdown(post.contentMarkdown)}
                </ReactMarkdown>
              ) : (
                post.content?.map((block, index) => {
                  switch (block.type) {
                    case 'paragraph':
                      return (
                        <p key={index} className="text-gray-700 leading-relaxed mb-6">
                          {block.text}
                        </p>
                      );

                    case 'heading': {
                      const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
                      const headingClasses = {
                        2: 'text-3xl font-bold text-gray-900 mt-12 mb-6',
                        3: 'text-2xl font-bold text-gray-900 mt-8 mb-4',
                        4: 'text-xl font-semibold text-gray-900 mt-6 mb-3',
                      }[block.level || 2];
                      
                      return (
                        <HeadingTag key={index} className={headingClasses}>
                          {block.text}
                        </HeadingTag>
                      );
                    }

                    case 'list':
                      return (
                        <ul key={index} className="space-y-3 my-6 ml-6">
                          {block.items?.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-3">
                              <Icon name="Check" className="text-primary mt-1 flex-shrink-0" size="sm" />
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      );

                    case 'quote':
                      return (
                        <blockquote key={index} className="border-l-4 border-primary bg-gradient-to-r from-primary/5 to-transparent pl-6 py-4 my-8 italic text-gray-700">
                          {block.text}
                        </blockquote>
                      );

                    case 'image':
                      return (
                        <figure key={index} className="my-8">
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            {/* Placeholder - replace with actual image */}
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="Image" size="xl" className="text-gray-300" />
                            </div>
                          </div>
                          {block.caption && (
                            <figcaption className="text-sm text-gray-500 mt-3 text-center">
                              {block.caption}
                            </figcaption>
                          )}
                        </figure>
                      );

                    default:
                      return null;
                  }
                })
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio */}
            <div className="mt-12 p-6 bg-gradient-to-br from-primary/5 to-backdrop-primary rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="User" className="text-primary" size="lg" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">About {post.author}</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Experienced professional sharing practical insights and best practices to help customers make informed decisions.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${locale}/about`}>
                      Learn More About Our Team
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {(relatedServices.length > 0 || relatedConditions.length > 0) && (
              <div className="mt-12 p-6 bg-white border border-gray-200 rounded-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Related Services & Conditions
                </h3>
                {relatedServices.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Services</p>
                    <div className="flex flex-wrap gap-2">
                      {relatedServices.map((item) => (
                        <Link key={item.id} href={item.link}>
                          <Badge variant="secondary" size="sm" className="cursor-pointer hover:shadow-sm">
                            {item.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {relatedConditions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {relatedConditions.map((item) => (
                        <Link key={item.id} href={item.link}>
                          <Badge variant="secondary" size="sm" className="cursor-pointer hover:shadow-sm">
                            {item.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-backdrop-secondary to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-heading font-bold text-gray-900 mb-8">
                Related Articles
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost: any) => (
                  <Link key={relatedPost.slug} href={`/${locale}/blog/${relatedPost.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                      <div className="relative aspect-video overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Icon 
                            name={relatedPost.type === 'video' ? 'Video' : 'FileText'} 
                            className="text-primary/30" 
                          />
                        </div>
                        {relatedPost.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <Icon name="Play" className="text-primary ml-0.5" size="sm" />
                            </div>
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {relatedPost.excerpt}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-8">
                <Button asChild variant="outline">
                  <Link href={`/${locale}/blog`}>
                    View All Articles
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-heading text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-subheading mb-10 leading-relaxed max-w-3xl mx-auto text-white/95">
            Connect with our team to discuss the best service plan for your goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/contact`}
              className="bg-white text-[var(--primary)] px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-subheading transition-all shadow-lg"
            >
              Contact Our Team
            </Link>
            <Link
              href={`/${locale}/services`}
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 font-semibold text-subheading transition-all"
            >
              Our Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
