import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { TABLE_PAGE_SIZE } from 'platform/common-base';
import { REQUEST_LONG_LOADING_MS } from '../constants';
import { getErrorMessage } from '../utils/request.utils';
import { useRequest } from './request.hook';

export type ResourcePageLoad<Data> = (pagination: {
  skip: number;
  take: number;
}) => Promise<{ items: Data[]; total: number }>;

export const useResourcePageData = <Data>({
  load,
  loadKey,
}: {
  load: ResourcePageLoad<Data>;
  loadKey: string;
}) => {
  const [selected, setSelected] = useState<Data[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [longLoading, setLongLoading] = useState(false);
  const previousLoadKey = useRef(loadKey);
  const loadRequest = useRequest(load, {
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const reload = () => {
    void loadRequest.reload();
  };

  const changePage = (nextPageIndex: number) => {
    setSelected([]);
    setPageIndex(nextPageIndex);
  };

  useEffect(() => {
    const filtersChanged = previousLoadKey.current !== loadKey;
    previousLoadKey.current = loadKey;

    if (filtersChanged) {
      setSelected([]);
      if (pageIndex !== 0) {
        setPageIndex(0);
        return;
      }
    }

    void loadRequest.fetch({
      skip: pageIndex * TABLE_PAGE_SIZE,
      take: TABLE_PAGE_SIZE,
    });
  }, [loadKey, loadRequest.fetch, pageIndex]);

  const data = loadRequest.data?.items ?? [];
  const pageCount = Math.ceil((loadRequest.data?.total ?? 0) / TABLE_PAGE_SIZE);

  useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pageCount && loadRequest.data) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [loadRequest.data, pageCount, pageIndex]);

  useEffect(() => {
    if (!loadRequest.isLoading) {
      if (longLoading) {
        setLongLoading(false);
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLongLoading(true);
    }, REQUEST_LONG_LOADING_MS);

    return () => window.clearTimeout(timeoutId);
  }, [loadRequest.isLoading]);

  return {
    changePage,
    data,
    loading: loadRequest.isInitial || loadRequest.isLoading,
    longLoading,
    initialLoading: loadRequest.isInitial && loadRequest.isLoading,
    refreshing: !loadRequest.isInitial && loadRequest.isLoading,
    loadRequest,
    pageCount,
    pageIndex,
    reload,
    selected,
    setSelected,
  };
};
