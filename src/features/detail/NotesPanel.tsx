import { useEffect, useId, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';

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

  // Keep the draft in step when the record changes underneath (import, reset).
  useEffect(() => {
    setDraft(notes ?? '');
  }, [notes]);

  const dirty = draft.trim() !== (notes ?? '').trim();

  return (
    <Card>
      <CardHeader
        title="Notes"
        description="Stored and displayed as plain text — formatting and HTML are never interpreted."
      />
      <CardBody className="flex flex-col gap-3">
        <label htmlFor={id} className="sr-only">
          Notes for this application
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
          placeholder="Contacts, salary expectations, what to prepare…"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-ink-muted" aria-live="polite">
            {saved && !dirty ? 'Notes saved.' : `${draft.length} / ${MAX_LENGTH} characters`}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!dirty} onClick={() => setDraft(notes ?? '')}>
              Discard
            </Button>
            <Button
              variant="primary"
              disabled={!dirty}
              onClick={() => {
                onSave(draft);
                setSaved(true);
              }}
            >
              Save notes
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
