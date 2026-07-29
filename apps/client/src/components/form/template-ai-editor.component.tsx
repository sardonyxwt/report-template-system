import { SendIcon } from 'lucide-react';
import { useState } from 'react';
import { type RequestStatus } from '../../hooks/request.hook';
import { getErrorMessage } from '../../utils/request.utils';
import { Button } from '../shadcn/ui/button';
import { Textarea } from '../shadcn/ui/textarea';
import { RequestStatusNotification } from './request-status-notification.component';
import { SubmitLabel } from './submit-label.component';

/**
 * Reusable prompt, progress, and submit UI for template AI editing.
 *
 * The parent supplies the editing scope and applies the returned template data.
 */
export const TemplateAiEditor = ({
  active,
  busy,
  error,
  loadingMessage,
  placeholder,
  status,
  successMessage,
  ariaLabel,
  onSubmit,
}: {
  active: boolean;
  busy: boolean;
  error?: unknown;
  loadingMessage: string;
  placeholder: string;
  status: RequestStatus;
  successMessage: string;
  ariaLabel: string;
  onSubmit: (prompt: string) => Promise<void>;
}) => {
  const [prompt, setPrompt] = useState('');
  const editorStatus = active ? status : 'initial';

  return (
    <div className="grid gap-2">
      <Textarea
        rows={4}
        value={prompt}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <div className="flex items-stretch justify-between gap-3">
        <RequestStatusNotification
          status={editorStatus}
          loadingMessage={loadingMessage}
          successMessage={successMessage}
          errorMessage={
            active && error !== undefined ? getErrorMessage(error) : undefined
          }
          className="flex-1"
        />
        <Button
          type="button"
          className="shrink-0"
          disabled={!prompt.trim() || busy}
          onClick={() => {
            void onSubmit(prompt)
              .then(() => setPrompt(''))
              .catch(() => undefined);
          }}
        >
          <SubmitLabel loading={busy && active}>
            <SendIcon />
            Send
          </SubmitLabel>
        </Button>
      </div>
    </div>
  );
};
