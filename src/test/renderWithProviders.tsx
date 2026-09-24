import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';
import { AppDataProvider } from '@/state/AppDataProvider';
import { ThemeProvider } from '@/state/ThemeProvider';
import { I18nProvider } from '@/i18n/I18nProvider';

function providersAt(route: string) {
  return function Providers({ children }: { children: ReactNode }) {
    return (
      <I18nProvider>
        <ThemeProvider>
          <AppDataProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </AppDataProvider>
        </ThemeProvider>
      </I18nProvider>
    );
  };
}

/**
 * Renders a component with the same providers the real app mounts. `route`
 * sets the starting URL, for pages that read it (the company filter).
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: Omit<RenderOptions, 'wrapper'> & { route?: string } = {},
) {
  return render(ui, { wrapper: providersAt(route), ...options });
}
