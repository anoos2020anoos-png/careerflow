/* eslint-disable react-refresh/only-export-components --
   Test-only helper: it defines a wrapper component and exports a render
   function. Fast Refresh never applies to test files. */
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';
import { AppDataProvider } from '@/state/AppDataProvider';
import { ThemeProvider } from '@/state/ThemeProvider';

function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </AppDataProvider>
    </ThemeProvider>
  );
}

/** Renders a component with the same providers the real app mounts. */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options });
}
