import { useCallback, useEffect, useRef, useState } from 'react';

export type RequestStatus = 'initial' | 'loading' | 'success' | 'error';

export type RequestOptions<Arguments extends unknown[], ResponseData> = {
  onSuccess?: (data: ResponseData, args: Arguments) => void;
  onError?: (error: unknown, args: Arguments) => void;
};

export const useRequest = <Arguments extends unknown[], ResponseData>(
  request: (...args: Arguments) => Promise<ResponseData>,
  options: RequestOptions<Arguments, ResponseData> = {},
) => {
  const mountedRef = useRef(false);
  const requestRef = useRef(request);
  const optionsRef = useRef(options);
  const lastArgumentsRef = useRef<Arguments | undefined>(undefined);
  const [status, setStatus] = useState<RequestStatus>('initial');
  const [data, setData] = useState<ResponseData>();
  const [error, setError] = useState<unknown>();

  requestRef.current = request;
  optionsRef.current = options;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async (...args: Arguments) => {
    lastArgumentsRef.current = args;
    setStatus('loading');
    setError(undefined);

    try {
      const response = await requestRef.current(...args);
      if (mountedRef.current) {
        setData(response);
        setStatus('success');
        optionsRef.current.onSuccess?.(response, args);
      }
      return response;
    } catch (requestError) {
      if (mountedRef.current) {
        setError(requestError);
        setStatus('error');
        optionsRef.current.onError?.(requestError, args);
      }
      throw requestError;
    }
  }, []);

  const reload = useCallback(() => {
    if (!lastArgumentsRef.current) {
      return Promise.resolve(undefined);
    }
    return fetch(...lastArgumentsRef.current);
  }, [fetch]);

  return {
    data,
    error,
    status,
    fetch,
    reload,
    setData,
    isInitial: status === 'initial',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
};
