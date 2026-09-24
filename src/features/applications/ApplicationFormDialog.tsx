import { useId } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ApplicationForm } from '@/features/applications/ApplicationForm';
import { useT } from '@/i18n/i18n-context';
import type { ApplicationFormValues } from '@/lib/schemas';

export function ApplicationFormDialog({
  open,
  mode,
  defaultValues,
  onSubmit,
  onClose,
  companySuggestions,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  defaultValues: ApplicationFormValues;
  onSubmit: (values: ApplicationFormValues) => void;
  onClose: () => void;
  companySuggestions?: string[];
}) {
  const formId = useId();
  const t = useT();
  const creating = mode === 'create';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      title={creating ? t('form.createTitle') : t('form.editTitle')}
      description={creating ? t('form.createDesc') : t('form.editDesc')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            {creating ? t('action.addApplication') : t('action.saveChanges')}
          </Button>
        </>
      }
    >
      {/* Remounting on open discards any half-finished edits from last time. */}
      <ApplicationForm
        key={open ? 'open' : 'closed'}
        formId={formId}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        companySuggestions={companySuggestions}
      />
    </Dialog>
  );
}
