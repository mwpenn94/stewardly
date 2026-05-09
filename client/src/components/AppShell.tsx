/**
 * AppShell — v3 PASSTHROUGH WRAPPER
 *
 * In v3, the global `AppLayout` (mounted in App.tsx) provides the single
 * source of chrome (primary sidebar, mobile header, footer disclaimer,
 * notification bell). AppShell — historically the v1/v2 chrome with
 * PersonaSidebar5 + mobile bottom tabs + Pomodoro — would otherwise
 * render INSIDE AppLayout and cause double-nested sidebars and a clipped
 * main content area in every applet (Formational, Relational, Missional,
 * Contextual, Optimal).
 *
 * Round 14.7 fix: AppShell becomes a thin passthrough that:
 *   • Renders only `children` (no PersonaSidebar5, no mobile bottom nav,
 *     no duplicate disclaimer footer, no global Pomodoro overlay).
 *   • Still applies the document.title side-effect for tabs/SEO so
 *     existing pages that rely on `<AppShell title="…">` keep working.
 *
 * Source pages (LearningShell, IntelligenceHubV2 sidebar, Calculators
 * sidebar, etc.) provide their own SECONDARY scoped navigation as inner
 * elements of `children` — those keep working unchanged, and they now
 * fill the full width of AppLayout's main content area without being
 * clipped by a redundant outer shell.
 *
 * Pages that pass `embedded={true}` already bypass this wrapper entirely
 * (they render a Fragment instead of AppShell). The passthrough behavior
 * here ensures that even pages still using `<AppShell>` directly (e.g.
 * `/learning/tracks` opened from the source-faithful URL) render
 * correctly inside AppLayout without nested sidebars.
 */
import { useEffect } from "react";

interface AppShellProps {
  children: React.ReactNode;
  /** Page title used for document.title (browser tab + SEO). */
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  // Auto-propagate title to the browser tab. Same behavior as the legacy
  // AppShell so any caller passing a title still gets the tab updated.
  useEffect(() => {
    if (title) {
      const suffix = " | Stewardly AI";
      document.title = title.includes("Stewardly") ? title : `${title}${suffix}`;
    }
  }, [title]);

  // No outer flex container — children render in whatever box AppLayout
  // gives us. A min-h-full wrapper ensures pages that expect to take the
  // full available height (sidebars, dashboards) still do.
  return <div className="h-full w-full flex flex-col min-h-0">{children}</div>;
}
