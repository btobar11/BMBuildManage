/**
 * Utility function to merge class names conditionally
 * Similar to clsx but without the dependency
 */
type ClassValue = string | number | boolean | undefined | null | ClassValue[];

function toClassName(value: ClassValue): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(toClassName).filter(Boolean).join(' ');
  return '';
}

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .map(toClassName)
    .filter(Boolean)
    .join(' ');
}

export default cn;