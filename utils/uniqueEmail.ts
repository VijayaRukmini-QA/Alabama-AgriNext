/** Unique non-existent email on a safe synthetic domain (avoid example.com: causes chrome-error). */
export function uniqueEmail(prefix = 'qa.nonexistent', domain = 'agrinextqa-nodomain-test.com'): string {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `${prefix}${suffix}@${domain}`;
}

/** Email of exactly `length` chars (used for maxlength=113 checks). */
export function emailOfLength(length: number, domain = 'agrinextqa-nodomain-test.com'): string {
  const tail = `@${domain}`;
  if (length <= tail.length) throw new Error(`length must exceed ${tail.length}`);
  return 'a'.repeat(length - tail.length) + tail;
}
