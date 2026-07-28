declare module 'zod' {
  /**
   * Shared metadata accepted by `schema.meta(...)` across platform packages.
   *
   * `name` is used by OpenAPI generation to place reusable Zod schemas into
   * `components.schemas` under a stable component key. Add it only to schemas
   * that should be reusable/documented by name rather than rendered inline.
   */
  interface GlobalMeta {
    name?: string;
    example?: string;
  }
}

export {};
