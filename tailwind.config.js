/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens driven by CSS custom properties so the same class
        // names work in both themes (see src/index.css).
        surface: 'rgb(var(--cf-surface) / <alpha-value>)',
        'surface-muted': 'rgb(var(--cf-surface-muted) / <alpha-value>)',
        canvas: 'rgb(var(--cf-canvas) / <alpha-value>)',
        line: 'rgb(var(--cf-line) / <alpha-value>)',
        ink: 'rgb(var(--cf-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--cf-ink-muted) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--cf-brand) / <alpha-value>)',
          soft: 'rgb(var(--cf-brand-soft) / <alpha-value>)',
          strong: 'rgb(var(--cf-brand-strong) / <alpha-value>)',
        },
        success: 'rgb(var(--cf-success) / <alpha-value>)',
        'success-soft': 'rgb(var(--cf-success-soft) / <alpha-value>)',
        warning: 'rgb(var(--cf-warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--cf-warning-soft) / <alpha-value>)',
        danger: 'rgb(var(--cf-danger) / <alpha-value>)',
        'danger-soft': 'rgb(var(--cf-danger-soft) / <alpha-value>)',
        info: 'rgb(var(--cf-info) / <alpha-value>)',
        'info-soft': 'rgb(var(--cf-info-soft) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        popover: '0 10px 30px -10px rgb(15 23 42 / 0.25)',
      },
    },
  },
  plugins: [],
};
