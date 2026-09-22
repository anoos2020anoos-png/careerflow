import type { ApplicationStatus } from '@/types';

/**
 * Chart colours.
 *
 * Recharts writes colours into SVG presentation attributes, where CSS custom
 * properties are not resolved, so each theme gets an explicit hex palette
 * chosen for its surface rather than an automatic flip of the other one.
 *
 * These are a *status* palette, not a categorical one: the hue reinforces a
 * meaning (green = offer, red = rejected) rather than carrying identity on its
 * own. Identity comes from the category label on every bar, plus the
 * screen-reader table rendered beside each chart. Two pairs sit below the
 * usual colour-blind separation target — Offer/Rejected (inherently green vs
 * red) and Saved/Applied — which is acceptable precisely because no reader has
 * to rely on colour to tell the bars apart.
 */
export interface ChartPalette {
  status: Record<ApplicationStatus, string>;
  series: string;
  grid: string;
  axis: string;
  tooltipSurface: string;
  tooltipBorder: string;
  tooltipInk: string;
}

export const LIGHT_PALETTE: ChartPalette = {
  status: {
    saved: '#94A3B8',
    applied: '#0369A1',
    screening: '#6D28D9',
    interview: '#B45309',
    offer: '#15803D',
    rejected: '#B91C1C',
    withdrawn: '#475569',
  },
  series: '#4F46E5',
  grid: '#E2E8F0',
  axis: '#64748B',
  tooltipSurface: '#FFFFFF',
  tooltipBorder: '#E2E8F0',
  tooltipInk: '#0F172A',
};

export const DARK_PALETTE: ChartPalette = {
  status: {
    saved: '#94A3B8',
    applied: '#38BDF8',
    screening: '#C4B5FD',
    interview: '#FBBF24',
    offer: '#4ADE80',
    rejected: '#F87171',
    withdrawn: '#CBD5E1',
  },
  series: '#818CF8',
  grid: '#2A3447',
  axis: '#94A3B8',
  tooltipSurface: '#121826',
  tooltipBorder: '#2A3447',
  tooltipInk: '#E2E8F0',
};

export function paletteFor(resolved: 'light' | 'dark'): ChartPalette {
  return resolved === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
}
