import { NavLink, Outlet } from 'react-router-dom';
import { Briefcase, LayoutDashboard, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { StorageNotice } from '@/components/layout/StorageNotice';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/applications', label: 'Applications', icon: Briefcase },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main-content" className="cf-skip-link">
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 flex-col border-e border-line bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <nav aria-label="Main" className="flex-1 px-3 py-2">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-soft text-brand'
                        : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                      {isActive ? <span className="sr-only"> (current page)</span> : null}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="border-t border-line px-5 py-4 text-xs leading-relaxed text-ink-muted">
          Data is stored only in this browser. Nothing is uploaded and nothing syncs between
          devices.
        </p>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Logo />
        <ThemeToggle />
      </header>

      {/* Desktop top bar */}
      <div className="hidden h-16 items-center justify-end gap-3 border-b border-line bg-surface px-6 lg:flex lg:ps-[16rem]">
        <ThemeToggle />
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className="px-4 pb-24 pt-5 focus:outline-none sm:px-6 lg:ms-60 lg:px-8 lg:pb-12 lg:pt-6"
      >
        <StorageNotice />
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                    isActive ? 'text-brand' : 'text-ink-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                    {isActive ? <span className="sr-only"> (current page)</span> : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
