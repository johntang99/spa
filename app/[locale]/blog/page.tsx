import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadAllItems, loadContent, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';
import { isBlogPostVisible } from '@/lib/blog';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon } from '@/components/ui';
import HeroSection from '@/components/sections/HeroSection';
import { HeroVariant } from '@/lib/section-variants';

interface BlogPageData {
  hero: {
    variant?:
      | 'centered'
      | 'split-photo-right'
      | 'split-photo-left'
      | 'photo-background'
      | 'gallery-background';
    title: string;
    subtitle: string;
    backgroundImage?: string;
    gallery?: string[];
    photoOverlayOpacity?: number;
    photoContentPosition?: 'center' | 'center-below' | 'left' | 'left-below' | 'lower';
  };
  introduction: {
    text: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  cta: {
    title: string;
    description: string;
    primaryCta: {
      text: string;
      link: string;
    };
    secondaryCta: {
      text: string;
      link: string;
    };
  };
}

interface BlogListItem {
  slug: string;
  title: string;
  excerpt?: string;
  image?: string;
  category?: string;
  author?: string;
  publishDate?: string;
  readTime?: string;
  type?: 'article' | 'video';
  featured?: boolean;
}

interface BlogPageProps {
  params: {
    locale: Locale;
  };
  searchParams?: {
    category?: string;
    page?: string;
  };
}

interface HeaderMenuConfig {
  menu?: {
    variant?: 'default' | 'centered' | 'transparent' | 'stacked';
  };
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<BlogPageData>('blog', locale, siteId);

  return buildPageMetadata({
    siteId,
    locale,
    slug: 'blog',
    title: content?.hero?.title,
    description: content?.hero?.subtitle || content?.introduction?.text,
  });
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = params;
  const selectedCategory = searchParams?.category || 'all';
  const currentPage = parseInt(searchParams?.page || '1');
  const postsPerPage = 9;
  
  // Load page content + posts list
  const content = await loadPageContent<BlogPageData>('blog', locale);
  const siteId = await getRequestSiteId();
  const posts = await loadAllItems<BlogListItem>(siteId, locale, 'blog');
  const headerConfig = await loadContent<HeaderMenuConfig>(siteId, locale, 'header.json');
  
  if (!content) {
    notFound();
  }

  const { hero, introduction, categories, cta } = content;
  const parseDateValue = (value?: string) => {
    const parsed = Date.parse(value || '');
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  const visiblePosts = posts.filter((post) => isBlogPostVisible(post));
  const dedupedPosts = Array.from(new Map(visiblePosts.map((post) => [post.slug, post])).values());
  const sortedPosts = [...dedupedPosts].sort(
    (a, b) => parseDateValue(b.publishDate) - parseDateValue(a.publishDate)
  );
  const featuredPost = sortedPosts.find((post) => post.featured) || sortedPosts[0];
  const featuredImage =
    featuredPost?.image ||
    sortedPosts.find((post) => post.image)?.image;

  // Filter posts by category
  const listPosts = featuredPost
    ? sortedPosts.filter((post) => post.slug !== featuredPost.slug)
    : sortedPosts;
  const filteredPosts = selectedCategory === 'all' 
    ? listPosts 
    : listPosts.filter(post => post.category === selectedCategory);

  // Pagination
  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
  const isTransparentMenu = headerConfig?.menu?.variant === 'transparent';

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection
        variant={(hero.variant as HeroVariant) || 'split-photo-right'}
        topSpacingMode={isTransparentMenu ? 'extra' : 'default'}
        tagline={hero.title}
        description={hero.subtitle}
        badgeText="Learn & Explore"
        image={hero.backgroundImage || undefined}
        gallery={Array.isArray(hero.gallery) ? hero.gallery : undefined}
        photoOverlayOpacity={
          typeof hero.photoOverlayOpacity === 'number' ? hero.photoOverlayOpacity : 0.2
        }
        photoContentPosition={
          hero.photoContentPosition === 'center' ||
          hero.photoContentPosition === 'center-below' ||
          hero.photoContentPosition === 'left' ||
          hero.photoContentPosition === 'left-below' ||
          hero.photoContentPosition === 'lower'
            ? hero.photoContentPosition
            : 'left-below'
        }
      />

      {/* Introduction */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-gray-700">
              {introduction.text}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12 lg:py-16 bg-gradient-to-br from-backdrop-secondary to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <Badge variant="primary" className="mb-2">Featured Article</Badge>
                <h2 className="text-heading font-bold text-gray-900">Latest Insights</h2>
              </div>

              <Link href={`/${locale}/blog/${featuredPost.slug}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                  <div className="grid lg:grid-cols-2">
                    {/* Featured Image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      {featuredImage ? (
                        <img
                          src={featuredImage}
                          alt={featuredPost.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Icon
                            name={(featuredPost.type || 'article') === 'video' ? 'Video' : 'FileText'}
                            className="text-primary/30"
                          />
                        </div>
                      )}
                      
                      {/* Video Badge */}
                      {(featuredPost.type || 'article') === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon name="Play" className="text-primary ml-1" size="lg" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-8 lg:p-12">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <Badge variant="secondary">
                          {categories.find(cat => cat.id === featuredPost.category)?.name}
                        </Badge>
                        {featuredPost.readTime && (
                          <span className="text-sm text-gray-500">{featuredPost.readTime}</span>
                        )}
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {featuredPost.publishDate ? new Date(featuredPost.publishDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : ''}
                        </span>
                      </div>

                      <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors">
                        {featuredPost.title}
                      </h3>

                      {featuredPost.excerpt && (
                        <p className="text-lg text-gray-700 leading-relaxed mb-6">
                          {featuredPost.excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        {featuredPost.author && (
                          <div className="flex items-center gap-2">
                            <Icon name="User" size="sm" className="text-gray-400" />
                            <span className="text-sm text-gray-600">{featuredPost.author}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                          Read More
                          <Icon name="ArrowRight" size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-gray-100 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <span className="text-sm font-semibold text-gray-700 flex-shrink-0">Filter:</span>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/blog?category=${category.id}`}
                  className="flex-shrink-0"
                  scroll={false}
                >
                  <Badge
                    variant={selectedCategory === category.id ? 'primary' : 'secondary'}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedPosts.map((post) => (
                <Link key={post.slug} href={`/${locale}/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    {/* Post Image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Icon 
                            name={(post.type || 'article') === 'video' ? 'Video' : 'FileText'} 
                            size="lg" 
                            className="text-primary/30" 
                          />
                        </div>
                      )}

                      {/* Video Play Button */}
                      {(post.type || 'article') === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon name="Play" className="text-primary ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" size="sm">
                          {categories.find(cat => cat.id === post.category)?.name}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      {post.readTime && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <Icon name="Clock" size="sm" />
                          {post.readTime}
                        </div>
                      )}
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-3">
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {post.publishDate ? new Date(post.publishDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : ''}
                        </span>
                        <div className="flex items-center gap-1 text-primary font-semibold group-hover:gap-2 transition-all">
                          Read
                          <Icon name="ArrowRight" size="sm" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                {/* Previous Button */}
                {currentPage > 1 && (
                  <Link href={`/${locale}/blog?category=${selectedCategory}&page=${currentPage - 1}`} scroll={false}>
                    <Button variant="outline" size="sm">
                      <Icon name="ChevronLeft" size="sm" />
                      Previous
                    </Button>
                  </Link>
                )}

                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Link key={page} href={`/${locale}/blog?category=${selectedCategory}&page=${page}`} scroll={false}>
                      <Button
                        variant={currentPage === page ? 'primary' : 'outline'}
                        size="sm"
                        className="w-10"
                      >
                        {page}
                      </Button>
                    </Link>
                  ))}
                </div>

                {/* Next Button */}
                {currentPage < totalPages && (
                  <Link href={`/${locale}/blog?category=${selectedCategory}&page=${currentPage + 1}`} scroll={false}>
                    <Button variant="outline" size="sm">
                      Next
                      <Icon name="ChevronRight" size="sm" />
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Empty State */}
            {paginatedPosts.length === 0 && (
              <div className="text-center py-12">
                <Icon name="FileText" size="xl" className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No posts found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-heading text-white mb-4">
            {cta.title}
          </h2>
          <p className="text-subheading mb-10 leading-relaxed max-w-3xl mx-auto text-white/95">
            {cta.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={cta.primaryCta.link}
              className="bg-white text-[var(--primary)] px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-subheading transition-all shadow-lg"
            >
              {cta.primaryCta.text}
            </Link>
            <a
              href={cta.secondaryCta.link}
              target={cta.secondaryCta.link.startsWith('http') ? '_blank' : undefined}
              rel={cta.secondaryCta.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 font-semibold text-subheading transition-all"
            >
              {cta.secondaryCta.text}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
