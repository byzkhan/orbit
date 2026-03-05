import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { ReactNode } from 'react'

export function Markdown({ content }: { content: string }): ReactNode {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orbit-accent hover:text-orbit-accent-hover underline"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="border-collapse border border-orbit-border text-sm w-full">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-orbit-border bg-orbit-surface px-3 py-1.5 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-orbit-border px-3 py-1.5">{children}</td>
        ),
        ul: ({ children }) => <ul className="list-disc pl-6 my-1 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 my-1 space-y-0.5">{children}</ol>,
        p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
        h1: ({ children }) => <h1 className="text-xl font-heading font-bold mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-heading font-bold mt-3 mb-1.5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-heading font-bold mt-2 mb-1">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-orbit-accent pl-4 my-2 text-orbit-text-secondary italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
