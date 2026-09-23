import { useEffect, useId, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { useT } from '@/i18n/i18n-context';

const MAX_LENGTH = 5000;

export function NotesPanel({
  notes,
  onSave,
}: {
  notes: string | undefined;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(notes ?? '');
  const [saved, setSaved] = useState(false);
  const id = useId();
  const t = useT();

  // Keep the draft in step when the record changes underneath (import, reset).
  useEffect(() => {
    setDraft(notes ?? '');
  }, [notes]);

  const dirty = draft.trim() !== (notes ?? '').trim();

  return (
    <Card>
      <CardHeader title={t('notes.title')} description={t('notes.description')} />
      <CardBody className="flex flex-col gap-3">
        <label htmlFor={id} className="sr-only">
          {t('notes.label')}
        </label>
        <Textarea
          id={id}
          value={draft}
          maxLength={MAX_LENGTH}
          rows={6}
          onChange={(event) => {
            setDraft(event.target.value);
            setSaved(false);
          }}
          placeholder={t('notes.placeholder')}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-muted" aria-live="polite">
            {saved && !dirty
              ? t('notes.saved')
              : t('notes.counter', { count: draft.length, max: MAX_LENGTH })}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!dirty} onClick={() => setDraft(notes ?? '')}>
              {t('action.discard')}
            </Button>
            <Button
              variant="primary"
              disabled={!dirty}
              onClick={() => {
                onSave(draft);
                setSaved(true);
              }}
            >
              {t('notes.save')}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
