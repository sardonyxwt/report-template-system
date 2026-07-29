import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type TemplateAiEditRequest,
  type TemplateAiEditResponse,
} from 'platform/common-base';
import { type TemplateBlockType, type TemplateData } from 'platform/prisma';
import { api } from '../../../api/client.api';
import {
  type AiEditorContext,
  type AiGenerationScope,
  type GenerationState,
  IDLE_GENERATION_STATE,
  type ScopeGenerationState,
  type TemplateAiSubmitParams,
} from './template.types';

type ApplyAiResult = (scope: AiGenerationScope, data: TemplateData) => void;

type TemplateAiGenerationContextValue = {
  /** Per-scope generation status (template + each block). */
  generationState: GenerationState;
  /** Effective state for UI: blocks inherit template loading/progress. */
  getScopeState: (scope: AiGenerationScope) => ScopeGenerationState;
  canGenerate: (scope: AiGenerationScope) => boolean;
  canEditBlock: (blockType: TemplateBlockType) => boolean;
  isAnyGenerating: boolean;
  /** Bumps after successful AI edits so open previews can refresh. */
  contentRevision: number;
  generate: (
    scope: AiGenerationScope,
    params: TemplateAiSubmitParams,
  ) => Promise<void>;
  reset: () => void;
};

const TemplateAiGenerationContext = createContext<
  TemplateAiGenerationContextValue | undefined
>(undefined);

const isLoading = (state?: ScopeGenerationState) => state?.status === 'loading';

/**
 * Tracks concurrent AI generations for the template modal.
 *
 * Rules:
 * - Multiple block generations may run at once.
 * - Template generation cannot start while any block is generating.
 * - Block generation cannot start while the template is generating.
 * - A block cannot be manually edited while it (or the whole template) is generating.
 */
export const TemplateAiGenerationProvider = ({
  getTemplateData,
  applyResult,
  children,
}: PropsWithChildren<{
  getTemplateData: () => TemplateData;
  applyResult: ApplyAiResult;
}>) => {
  const [generationState, setGenerationState] = useState<GenerationState>({});
  const [contentRevision, setContentRevision] = useState(0);
  const contextsRef = useRef<
    Partial<Record<AiGenerationScope, AiEditorContext>>
  >({});
  const epochRef = useRef(0);
  const inFlightRef = useRef(new Set<AiGenerationScope>());

  const updateScope = useCallback(
    (scope: AiGenerationScope, patch: Partial<ScopeGenerationState>) => {
      setGenerationState((current) => ({
        ...current,
        [scope]: {
          ...(current[scope] ?? IDLE_GENERATION_STATE),
          ...patch,
        },
      }));
    },
    [],
  );

  const getScopeState = useCallback(
    (scope: AiGenerationScope): ScopeGenerationState => {
      const templateState = generationState.template;

      // Template generation mirrors its progress onto every block.
      if (scope !== 'template' && isLoading(templateState)) {
        return templateState ?? IDLE_GENERATION_STATE;
      }

      return generationState[scope] ?? IDLE_GENERATION_STATE;
    },
    [generationState],
  );

  const canGenerate = useCallback(
    (scope: AiGenerationScope) => {
      if (isLoading(generationState[scope]) || inFlightRef.current.has(scope)) {
        return false;
      }

      if (scope === 'template') {
        return !Object.entries(generationState).some(
          ([key, state]) => key !== 'template' && isLoading(state),
        );
      }

      return !isLoading(generationState.template);
    },
    [generationState],
  );

  const canEditBlock = useCallback(
    (blockType: TemplateBlockType) =>
      !isLoading(generationState.template) &&
      !isLoading(generationState[blockType]),
    [generationState],
  );

  const isAnyGenerating = useMemo(
    () => Object.values(generationState).some(isLoading),
    [generationState],
  );

  const reset = useCallback(() => {
    epochRef.current += 1;
    inFlightRef.current.clear();
    contextsRef.current = {};
    setGenerationState({});
    setContentRevision(0);
  }, []);

  const generate = useCallback(
    async (scope: AiGenerationScope, params: TemplateAiSubmitParams) => {
      if (!canGenerate(scope)) {
        return;
      }

      const epoch = epochRef.current;
      const blockType = scope === 'template' ? undefined : scope;
      const context = contextsRef.current[scope];

      inFlightRef.current.add(scope);
      updateScope(scope, {
        status: 'loading',
        progressMessage: 'Sending your request…',
        error: undefined,
      });

      try {
        const body: TemplateAiEditRequest = {
          data: getTemplateData(),
          prompt: params.prompt,
          model: params.model,
          reasoningEffort: params.reasoningEffort,
          speed: params.speed,
          visualValidation: params.visualValidation,
          ...(blockType ? { blockType } : {}),
          ...(context?.model === params.model ? { contextId: context.id } : {}),
        };

        const response = await runAiEdit(body, (message) => {
          if (epoch !== epochRef.current) {
            return;
          }

          updateScope(scope, { progressMessage: message });
        });

        if (epoch !== epochRef.current) {
          return;
        }

        applyResult(scope, response.data);
        contextsRef.current[scope] = {
          id: response.contextId,
          model: params.model,
        };
        setContentRevision((revision) => revision + 1);
        updateScope(scope, {
          status: 'success',
          progressMessage: IDLE_GENERATION_STATE.progressMessage,
          error: undefined,
        });
      } catch (error) {
        if (epoch !== epochRef.current) {
          return;
        }

        updateScope(scope, {
          status: 'error',
          error,
        });
        throw error;
      } finally {
        inFlightRef.current.delete(scope);
      }
    },
    [applyResult, canGenerate, getTemplateData, updateScope],
  );

  const value = useMemo(
    () => ({
      generationState,
      getScopeState,
      canGenerate,
      canEditBlock,
      isAnyGenerating,
      contentRevision,
      generate,
      reset,
    }),
    [
      canEditBlock,
      canGenerate,
      contentRevision,
      generate,
      generationState,
      getScopeState,
      isAnyGenerating,
      reset,
    ],
  );

  return (
    <TemplateAiGenerationContext.Provider value={value}>
      {children}
    </TemplateAiGenerationContext.Provider>
  );
};

export const useTemplateAiGeneration = () => {
  const context = useContext(TemplateAiGenerationContext);

  if (!context) {
    throw new Error(
      'useTemplateAiGeneration must be used within TemplateAiGenerationProvider.',
    );
  }

  return context;
};

const runAiEdit = async (
  body: TemplateAiEditRequest,
  onProgress: (message: string) => void,
): Promise<TemplateAiEditResponse> => {
  for await (const event of api.template.editWithAi(body)) {
    if (event.type === 'progress') {
      onProgress(event.data.message);
      continue;
    }

    if (event.type === 'error') {
      throw new Error(event.data.message);
    }

    return event.data;
  }

  throw new Error('The AI progress stream ended before returning a result.');
};
