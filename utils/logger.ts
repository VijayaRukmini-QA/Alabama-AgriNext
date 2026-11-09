const secrets = new Set<string>();

/** Register a value that must never appear in logs. */
export function registerSecret(value: string | undefined): void {
  if (value) secrets.add(value);
}

export function mask(text: string): string {
  let out = text;
  for (const s of secrets) out = out.split(s).join('***');
  return out;
}

export const logger = {
  info: (msg: string): void => console.log(`[info] ${mask(msg)}`),
  warn: (msg: string): void => console.warn(`[warn] ${mask(msg)}`),
  error: (msg: string): void => console.error(`[error] ${mask(msg)}`),
};
