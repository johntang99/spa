import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizeMarkdown } from '@/components/admin/utils/editorHelpers';
import { resolveMediaUrl } from '@/lib/media-url';

interface PostsPanelProps {
  formData: Record<string, any>;
  isBlogPostFile: boolean;
  blogServiceOptions: Array<{ id: string; title: string }>;
  blogConditionOptions: Array<{ id: string; title: string }>;
  markdownPreview: Record<string, boolean>;
  toggleMarkdownPreview: (key: string) => void;
  toggleSelection: (path: string[], value: string) => void;
  updateFormValue: (path: string[], value: any) => void;
  openImagePicker: (path: string[]) => void;
}

export function PostsPanel({
  formData,
  isBlogPostFile,
  blogServiceOptions,
  blogConditionOptions,
  markdownPreview,
  toggleMarkdownPreview,
  toggleSelection,
  updateFormValue,
  openImagePicker,
}: PostsPanelProps) {
  const hideBodyPreview = markdownPreview['blog-article-body'] === false;
  const getPreviewUrl = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return resolveMediaUrl(trimmed);
  };

  return (
    <>
      {formData?.featuredPost && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Featured Post</div>
          <input
            className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Title"
            value={formData.featuredPost.title || ''}
            onChange={(event) => updateFormValue(['featuredPost', 'title'], event.target.value)}
          />
          <textarea
            className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Excerpt"
            value={formData.featuredPost.excerpt || ''}
            onChange={(event) => updateFormValue(['featuredPost', 'excerpt'], event.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Image"
              value={formData.featuredPost.image || ''}
              onChange={(event) => updateFormValue(['featuredPost', 'image'], event.target.value)}
            />
            <button
              type="button"
              onClick={() => openImagePicker(['featuredPost', 'image'])}
              className="px-3 rounded-md border border-gray-200 text-xs"
            >
              Choose
            </button>
          </div>
          {getPreviewUrl(formData.featuredPost.image) && (
            <div className="mt-2">
              <img
                src={getPreviewUrl(formData.featuredPost.image)}
                alt="Featured post preview"
                className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      {Array.isArray(formData?.posts) && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Blog Posts</div>
          <div className="space-y-4">
            {formData.posts.map((post: any, index: number) => (
              <div key={post.slug || index} className="border rounded-md p-3">
                <div className="text-xs text-gray-500 mb-2">{post.title || `Post ${index + 1}`}</div>
                <input
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Title"
                  value={post.title || ''}
                  onChange={(event) =>
                    updateFormValue(['posts', String(index), 'title'], event.target.value)
                  }
                />
                <textarea
                  className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Excerpt"
                  value={post.excerpt || ''}
                  onChange={(event) =>
                    updateFormValue(['posts', String(index), 'excerpt'], event.target.value)
                  }
                />
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Image"
                    value={post.image || ''}
                    onChange={(event) =>
                      updateFormValue(['posts', String(index), 'image'], event.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => openImagePicker(['posts', String(index), 'image'])}
                    className="px-3 rounded-md border border-gray-200 text-xs"
                  >
                    Choose
                  </button>
                </div>
                {getPreviewUrl(post.image) && (
                  <div className="mt-2">
                    <img
                      src={getPreviewUrl(post.image)}
                      alt={`Post ${index + 1} preview`}
                      className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {formData?.slug && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Blog Article</div>
          <input
            className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Title"
            value={formData.title || ''}
            onChange={(event) => updateFormValue(['title'], event.target.value)}
          />
          <textarea
            className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Excerpt"
            value={formData.excerpt || ''}
            onChange={(event) => updateFormValue(['excerpt'], event.target.value)}
          />
          <div className="flex gap-2 mb-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Image"
              value={formData.image || ''}
              onChange={(event) => updateFormValue(['image'], event.target.value)}
            />
            <button
              type="button"
              onClick={() => openImagePicker(['image'])}
              className="px-3 rounded-md border border-gray-200 text-xs"
            >
              Choose
            </button>
          </div>
          {getPreviewUrl(formData.image) && (
            <div className="mb-2">
              <img
                src={getPreviewUrl(formData.image)}
                alt="Blog article preview"
                className="h-20 w-36 rounded-md border border-gray-200 object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Image Alt"
              value={formData.imageAlt || ''}
              onChange={(event) => updateFormValue(['imageAlt'], event.target.value)}
            />
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Image Credit"
              value={formData.imageCredit || ''}
              onChange={(event) => updateFormValue(['imageCredit'], event.target.value)}
            />
          </div>
          <input
            className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Image Source URL"
            value={formData.imageSource || ''}
            onChange={(event) => updateFormValue(['imageSource'], event.target.value)}
          />
          <div className="grid gap-2 mt-2 md:grid-cols-3">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Author"
              value={formData.author || ''}
              onChange={(event) => updateFormValue(['author'], event.target.value)}
            />
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Publish Date (YYYY-MM-DD)"
              value={formData.publishDate || ''}
              onChange={(event) => updateFormValue(['publishDate'], event.target.value)}
            />
            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData.status || 'published'}
              onChange={(event) => updateFormValue(['status'], event.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="grid gap-2 mt-2 md:grid-cols-2">
            <input
              type="datetime-local"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={formData.publishAt ? String(formData.publishAt).slice(0, 16) : ''}
              onChange={(event) => updateFormValue(['publishAt'], event.target.value ? new Date(event.target.value).toISOString() : '')}
            />
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Translation Group (shared EN/ZH id)"
              value={formData.translationGroup || ''}
              onChange={(event) => updateFormValue(['translationGroup'], event.target.value)}
            />
          </div>
          <input
            className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            placeholder="Category"
            value={formData.category || ''}
            onChange={(event) => updateFormValue(['category'], event.target.value)}
          />
          <div className="mt-2 text-xs text-gray-500">
            Use <strong>draft</strong> to hide a post, <strong>scheduled</strong> with <strong>publishAt</strong> for future auto-publishing, or <strong>published</strong> to make it live now.
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={Boolean(formData.featured)}
              onChange={(event) => updateFormValue(['featured'], event.target.checked)}
            />
            <label htmlFor="featured" className="text-sm text-gray-700">
              Featured article
            </label>
          </div>
          {isBlogPostFile && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-gray-200 p-3">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Related Services</div>
                {blogServiceOptions.length === 0 && (
                  <p className="text-xs text-gray-500">No services found.</p>
                )}
                <div className="space-y-2">
                  {blogServiceOptions.map((service) => (
                    <label key={service.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={Array.isArray(formData.relatedServices) ? formData.relatedServices.includes(service.id) : false}
                        onChange={() => toggleSelection(['relatedServices'], service.id)}
                      />
                      {service.title}
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Related Conditions</div>
                {blogConditionOptions.length === 0 && (
                  <p className="text-xs text-gray-500">No conditions found.</p>
                )}
                <div className="space-y-2">
                  {blogConditionOptions.map((condition) => (
                    <label key={condition.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={Array.isArray(formData.relatedConditions) ? formData.relatedConditions.includes(condition.id) : false}
                        onChange={() => toggleSelection(['relatedConditions'], condition.id)}
                      />
                      {condition.title}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Body (Markdown)</span>
              <button
                type="button"
                onClick={() => toggleMarkdownPreview('blog-article-body')}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                {hideBodyPreview ? 'Show Preview' : 'Hide Preview'}
              </button>
            </div>
            <textarea
              className="w-full min-h-[220px] rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Write the article body in Markdown"
              value={formData.contentMarkdown || ''}
              onChange={(event) => updateFormValue(['contentMarkdown'], event.target.value)}
            />
            <div className={`mt-3 rounded-md border border-gray-200 p-3 ${hideBodyPreview ? 'hidden' : ''}`}>
              <div className="mb-2 text-xs font-semibold uppercase text-gray-500">Preview</div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ul: (props) => <ul className="list-disc pl-5" {...props} />,
                    ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                    li: (props) => <li className="mb-1" {...props} />,
                    table: (props) => (
                      <div className="my-4 overflow-x-auto">
                        <table className="min-w-full border border-gray-200 rounded-md" {...props} />
                      </div>
                    ),
                    thead: (props) => <thead className="bg-gray-50" {...props} />,
                    tr: (props) => <tr className="border-b border-gray-200" {...props} />,
                    th: (props) => (
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-800 align-top border-r border-gray-200 last:border-r-0" {...props} />
                    ),
                    td: (props) => (
                      <td className="px-3 py-2 text-xs text-gray-700 align-top border-r border-gray-200 last:border-r-0" {...props} />
                    ),
                  }}
                >
                  {normalizeMarkdown(formData.contentMarkdown || '')}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
