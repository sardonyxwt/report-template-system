/**
 * Converts unknown runtime values into JSON-safe data for logging.
 *
 * Circular references, functions, symbols, browser globals, and omitted fields
 * are replaced with readable placeholders so logger transports do not crash
 * while serializing diagnostic context.
 */
export const toJsonValue = <T>(
  value: unknown,
  omitFields: string[] = [],
): T => {
  if (typeof value !== 'object' || value === null) {
    return value as T;
  }

  const seen = new WeakSet();

  try {
    const valueStr = JSON.stringify(value, (key, val) => {
      if (omitFields.includes(key)) return '<omit>';

      // Prevent cycles
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '<circular>';
        seen.add(val);
      }

      // Skip Window / global objects
      if (typeof Window !== 'undefined' && val instanceof Window) {
        return '<window>';
      }

      // Skip functions, symbols
      if (typeof val === 'function' || typeof val === 'symbol') {
        return `<${typeof val}>`;
      }

      // Fallback if .toJSON throws
      try {
        return val;
      } catch {
        return '<unserializable>';
      }
    });

    return JSON.parse(valueStr);
  } catch {
    return { message: '<unserializable>' } as T;
  }
};
