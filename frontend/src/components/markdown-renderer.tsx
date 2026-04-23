import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownRenderer({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose-custom font-sans text-sm leading-relaxed text-foreground",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-3 tracking-tight" {...props} />,
          h2: (props) => <h2 className="text-xl font-semibold mt-6 mb-2 tracking-tight" {...props} />,
          h3: (props) => <h3 className="text-base font-semibold mt-4 mb-2" {...props} />,
          p: (props) => <p className="my-3 text-foreground/90" {...props} />,
          a: (props) => <a className="text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
          li: (props) => <li className="text-foreground/90" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-2 border-primary pl-4 my-3 text-muted-foreground italic" {...props} />
          ),
          code: ({ className, children, ...rest }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary" {...rest}>
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("font-mono text-xs", className)} {...rest}>
                {children}
              </code>
            );
          },
          pre: (props) => (
            <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-[color:var(--elevated)] p-4 text-xs leading-relaxed" {...props} />
          ),
          hr: () => <hr className="my-6 border-border" />,
          strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
          table: (props) => <table className="my-4 w-full border-collapse text-sm" {...props} />,
          th: (props) => <th className="border border-border bg-muted px-3 py-2 text-left font-semibold" {...props} />,
          td: (props) => <td className="border border-border px-3 py-2" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
