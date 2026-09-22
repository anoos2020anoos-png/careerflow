import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { isSafeHttpUrl } from '@/lib/urls';

export function ExternalLink({
  href,
  children,
  className,
  showIcon = true,
}: {
  href: string | undefined;
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
}) {
  // Anything that is not an http(s) link renders as inert text, never an anchor.
  if (!isSafeHttpUrl(href)) {
    return <span className={cn('text-ink-muted', className)}>{children}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(
        'inline-flex items-center gap-1 font-medium text-brand underline-offset-4 hover:underline',
        className,
      )}
    >
      {children}
      {showIcon ? <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
