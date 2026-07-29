import { SparklesIcon } from 'lucide-react';
import { TemplateAiEditor } from '../../form/template-ai-editor.component';
import { useTemplateAiGeneration } from './template-ai-generation.provider';

export const TemplateAiPanel = () => {
  const { canGenerate, generate, getScopeState } = useTemplateAiGeneration();
  const busy = getScopeState('template').status === 'loading';

  return (
    <div className="grid gap-2 rounded-xl border bg-muted/30 p-3">
      <div>
        <h4 className="flex items-center gap-2 font-medium">
          <SparklesIcon className="size-4" />
          Edit the complete template with AI
        </h4>
        <p className="mt-1 text-sm text-muted-foreground">
          AI can update multiple blocks, enable or disable them, and change
          their order.
        </p>
      </div>
      <TemplateAiEditor
        busy={busy}
        disabled={!canGenerate('template')}
        ariaLabel="Complete template AI instructions"
        placeholder="Describe what you want AI to change across the template…"
        onSubmit={(params) => generate('template', params)}
      />
    </div>
  );
};
