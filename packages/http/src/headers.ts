/** A header that may arrive more than once, as one value. */
export function firstHeader(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
