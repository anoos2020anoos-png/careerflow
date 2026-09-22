import type { BadgeTone } from '@/components/ui/Badge';
import type { ApplicationStatus } from '@/types';

/**
 * Badge tone per status. Kept out of `StatusBadge.tsx` so that file exports a
 * component and nothing else — which is what React Fast Refresh needs to
 * hot-reload it reliably.
 */
export const STATUS_TONES: Record<ApplicationStatus, BadgeTone> = {
  saved: 'neutral',
  applied: 'info',
  screening: 'brand',
  interview: 'warning',
  offer: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};
