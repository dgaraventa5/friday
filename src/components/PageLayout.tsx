import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  allowScroll?: boolean; // Set to true for pages like SchedulePage
}

/**
 * PageLayout - A reusable layout component that ensures pages fit within the viewport
 * without scrolling (unless allowScroll is true).
 *
 * Use this component for all new pages to maintain consistent layout and viewport fitting.
 */
export function PageLayout({
  children,
  title,
  allowScroll = false,
}: PageLayoutProps) {
  return (
    <div className={`${allowScroll ? 'schedule-page' : 'viewport-height'} animate-fade-in`}>
      {title && (
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">{title}</h1>
      )}
      {children}
    </div>
  );
}
