import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return crypto.randomUUID();
}

/**
 * Trigger a browser download of a JSON string as a .json file.
 * Extracted to avoid duplicating blob/anchor logic across components.
 */
export function downloadJsonFile(
  jsonString: string,
  filename = 'flow-schema.json',
) {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
