import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { STATUS_LABELS, type ApplicationStatus } from '@/types';

export const STATUS_TONES: Record<ApplicationStatus, BadgeTone> = {
  saved: 'neutral',
  applied: 'info',
  screening: 'brand',
  interview: 'warning',
  offer: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

/** Hex values for chart series, kept in step with the badge tones. */
export const STATUS_CHART_COLORS: Record<ApplicationStatus, string> = {
  saved: '#94A3B8',
  applied: '#0369A1',
  screening: '#4F46E5',
  interview: '#B45309',
  offer: '#15803D',
  rejected: '#B91C1C',
  withdrawn: '#64748B',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
