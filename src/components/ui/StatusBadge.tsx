import { Badge } from '@/components/ui/Badge';
import { STATUS_TONES } from '@/lib/statusStyles';
import { STATUS_LABELS, type ApplicationStatus } from '@/types';

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
