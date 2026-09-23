import { Badge } from '@/components/ui/Badge';
import { useT } from '@/i18n/i18n-context';
import { statusLabel } from '@/i18n/labels';
import { STATUS_TONES } from '@/lib/statusStyles';
import type { ApplicationStatus } from '@/types';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const t = useT();
  return <Badge tone={STATUS_TONES[status]}>{statusLabel(t, status)}</Badge>;
}
