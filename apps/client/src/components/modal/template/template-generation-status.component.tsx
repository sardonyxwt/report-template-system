import { getErrorMessage } from '../../../utils/request.utils';
import { RequestStatusNotification } from '../../form/request-status-notification.component';
import { useTemplateAiGeneration } from './template-ai-generation.provider';
import { type AiGenerationScope } from './template.types';
import { formatBlockType } from './template.utils';

export const TemplateGenerationStatus = ({
  scope,
  className,
}: {
  scope: AiGenerationScope;
  className?: string;
}) => {
  const { getScopeState } = useTemplateAiGeneration();
  const state = getScopeState(scope);
  const successMessage =
    scope === 'template'
      ? 'Template updated.'
      : `${formatBlockType(scope)} block updated.`;

  return (
    <RequestStatusNotification
      status={state.status}
      loadingMessage={state.progressMessage}
      successMessage={successMessage}
      errorMessage={
        state.error !== undefined ? getErrorMessage(state.error) : undefined
      }
      className={className}
    />
  );
};
