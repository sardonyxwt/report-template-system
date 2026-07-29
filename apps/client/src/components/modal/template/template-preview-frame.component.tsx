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

  const [previewHeight, setPreviewHeight] = useState(
    fullPage ? A4_PAGE_HEIGHT_PX : TEMPLATE_BLOCK_PREVIEW_FALLBACK_HEIGHT_PX,
  );
  const previewRequest = useRequest((data: TemplatePreviewRequest) =>
    api.template.preview(data),
  );

  const refresh = useCallback(() => {
    setPreviewHeight(
      fullPage ? A4_PAGE_HEIGHT_PX : TEMPLATE_BLOCK_PREVIEW_FALLBACK_HEIGHT_PX,
    );
    void previewRequest
      .fetch({
        data: getDataRef.current(),
        ...(blockType ? { blockType } : {}),
      })
      .catch(() => undefined);
  }, [blockType, fullPage, previewRequest.fetch]);

  useEffect(() => {
    if (active) {
      refresh();
    }
  }, [active, contentRevision, refresh]);

  return (
    <div
      className={cn(
        'min-w-0 max-w-full overflow-hidden rounded-xl border bg-muted/40',
        fullPage && 'min-h-72',
      )}
    >
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
        className={cn(
          'w-full min-w-0 max-w-full overflow-x-auto p-4',
          fullPage && 'min-h-72',
        )}
      >
        {previewRequest.isLoading && (
          <p
            className={cn(
              'grid place-items-center text-sm text-muted-foreground',
              fullPage ? 'min-h-64 p-8' : 'min-h-56',
            )}
          >
            {loadingLabel}
          </p>
        )}
        {previewRequest.isError && (
          <div
            className={cn(
              'grid place-content-center text-center',
              fullPage ? 'mx-auto min-h-64 max-w-md p-8' : 'min-h-56',
            )}
          >
            <p className="font-medium">{errorTitle}</p>
            <p className="mt-1 text-sm text-destructive">
              {getErrorMessage(previewRequest.error)}
            </p>
          </div>
        )}
        {previewRequest.data && !previewRequest.isLoading && (
          <iframe
            title={title}
            sandbox="allow-same-origin"
            scrolling="no"
            srcDoc={previewRequest.data}
            style={{ height: previewHeight }}
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
