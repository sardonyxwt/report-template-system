import { RefreshCwIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type TemplatePreviewRequest } from 'platform/common-base';
import { type TemplateBlockType, type TemplateData } from 'platform/prisma';
import { api } from '../../../api/client.api';
import {
  A4_PAGE_HEIGHT_PX,
  TEMPLATE_BLOCK_PREVIEW_FALLBACK_HEIGHT_PX,
} from '../../../constants';
import { useRequest } from '../../../hooks/request.hook';
import { getErrorMessage } from '../../../utils/request.utils';
import { cn } from '../../shadcn/lib/utils';
import { Button } from '../../shadcn/ui/button';
import { useTemplateAiGeneration } from './template-ai-generation.provider';
import { getBlockPreviewHeight } from './template.utils';

export const TemplatePreviewFrame = ({
  active,
  getData,
  blockType,
  title,
  loadingLabel,
  errorTitle,
  fullPage = false,
}: {
  /** When true, loads (or reloads) the preview. */
  active: boolean;
  getData: () => TemplateData;
  blockType?: TemplateBlockType;
  title: string;
  loadingLabel: string;
  errorTitle: string;
  fullPage?: boolean;
}) => {
  const { contentRevision } = useTemplateAiGeneration();
  const getDataRef = useRef(getData);
  getDataRef.current = getData;

  const fallbackHeight = fullPage
    ? A4_PAGE_HEIGHT_PX
    : TEMPLATE_BLOCK_PREVIEW_FALLBACK_HEIGHT_PX;
  const [previewHeight, setPreviewHeight] = useState(fallbackHeight);
  const previewRequest = useRequest((data: TemplatePreviewRequest) =>
    api.template.preview(data),
  );

  const refresh = useCallback(() => {
    void previewRequest.fetch({
      data: getDataRef.current(),
      ...(blockType ? { blockType } : {}),
    });
  }, [blockType, previewRequest.fetch]);

  useEffect(() => {
    if (active) {
      refresh();
    }
  }, [active, contentRevision, refresh]);

  // Reserve height before the fetch effect runs so the dialog does not
  // collapse to a short loading stub when switching into Preview.
  const showInitialLoading =
    active && !previewRequest.data && !previewRequest.isError;
  const showRefreshLoading = previewRequest.isLoading && !!previewRequest.data;
  const contentMinHeight = Math.max(previewHeight, fallbackHeight);

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between border-b bg-background px-3 py-2">
        <p className="text-sm text-muted-foreground">
          Rendered with preview report data
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={previewRequest.isLoading}
          onClick={refresh}
        >
          <RefreshCwIcon
            className={cn(previewRequest.isLoading && 'animate-spin')}
          />
          Refresh
        </Button>
      </div>
      <div
        className="relative w-full min-w-0 max-w-full overflow-x-auto p-4"
        style={{ minHeight: contentMinHeight }}
      >
        {(showInitialLoading || showRefreshLoading) && (
          <div
            className={cn(
              'grid place-items-center text-sm text-muted-foreground',
              showRefreshLoading
                ? 'absolute inset-4 z-10 rounded-lg bg-background/70 backdrop-blur-[1px]'
                : undefined,
            )}
            style={
              showInitialLoading ? { minHeight: contentMinHeight } : undefined
            }
          >
            {loadingLabel}
          </div>
        )}
        {previewRequest.isError && !previewRequest.isLoading && (
          <div
            className="grid place-content-center text-center"
            style={{ minHeight: contentMinHeight }}
          >
            <p className="font-medium">{errorTitle}</p>
            <p className="mt-1 text-sm text-destructive">
              {getErrorMessage(previewRequest.error)}
            </p>
          </div>
        )}
        {previewRequest.data && !previewRequest.isError && (
          <iframe
            title={title}
            sandbox="allow-same-origin"
            scrolling="no"
            srcDoc={previewRequest.data}
            style={{
              height: previewHeight,
              opacity: showRefreshLoading ? 0.45 : 1,
            }}
            className={cn(
              'mx-auto block w-[210mm] max-w-none bg-white',
              fullPage ? 'shrink-0 shadow-lg' : 'shadow-md',
            )}
            onLoad={(event) => {
              const document = event.currentTarget.contentDocument;

              if (fullPage) {
                setPreviewHeight(
                  Math.max(
                    A4_PAGE_HEIGHT_PX,
                    document?.documentElement.scrollHeight ?? 0,
                    document?.body.scrollHeight ?? 0,
                  ),
                );
                return;
              }

              setPreviewHeight(getBlockPreviewHeight(document));
            }}
          />
        )}
      </div>
    </div>
  );
};
