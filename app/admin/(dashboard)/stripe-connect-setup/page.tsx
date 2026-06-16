import fs from 'fs/promises';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DOC_PATH = path.join(
  process.cwd(),
  'docs',
  'stripe-connect-connected-account-setup.md'
);

export default async function StripeConnectSetupAdminPage() {
  let markdown = '';
  try {
    markdown = await fs.readFile(DOC_PATH, 'utf-8');
  } catch {
    markdown = '# Stripe Connect Setup\n\nDocument not found at `docs/stripe-connect-connected-account-setup.md`.';
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Stripe Connect Setup
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Internal onboarding reference from{' '}
          <code>docs/stripe-connect-connected-account-setup.md</code>.
        </p>
      </header>

      <article className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-3 text-sm leading-7 text-gray-800">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="mb-3 text-2xl font-semibold text-gray-900">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-6 mb-2 text-xl font-semibold text-gray-900">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-4 mb-2 text-lg font-semibold text-gray-900">
                  {children}
                </h3>
              ),
              p: ({ children }) => <p className="text-sm text-gray-800">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc space-y-1 pl-6 text-sm text-gray-800">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal space-y-1 pl-6 text-sm text-gray-800">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li>{children}</li>,
              code: ({ children }) => (
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.85em] text-gray-900">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline hover:text-blue-700"
                >
                  {children}
                </a>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
