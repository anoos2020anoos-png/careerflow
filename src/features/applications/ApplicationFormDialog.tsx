import { useId } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ApplicationForm } from '@/features/applications/ApplicationForm';
import type { ApplicationFormValues } from '@/lib/schemas';

export function ApplicationFormDialog({
  open,
  mode,
  defaultValues,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  defaultValues: ApplicationFormValues;
  onSubmit: (values: ApplicationFormValues) => void;
  onClose: () => void;
}) {
  const formId = useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      title={mode === 'create' ? 'Add application' : 'Edit application'}
      description={
        mode === 'create'
          ? 'Track a role you have applied for or want to apply for.'
          : 'Update the details of this application.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            {mode === 'create' ? 'Add application' : 'Save changes'}
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
      />
    </Dialog>
  );
}
