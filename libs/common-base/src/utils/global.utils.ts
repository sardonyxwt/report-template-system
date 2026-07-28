export const getGlobalObject = <T>() => {
  if (typeof self !== 'undefined') {
    return self as T;
  }
  if (typeof window !== 'undefined') {
    return window as T;
  }
  if (typeof global !== 'undefined') {
    return global as T;
  }
  throw new Error('cannot find the global object');
};
