/** Pure selection logic for the public SMS inbox (no browser, no I/O). Used by ReceiveSmsInboxPage and unit-tested. */

export type SmsRow = {
  /** Visible text of the inbox row (sender, message, time). */
  text: string;
  /** Optional receive time; when present on the rows it is used for ordering and for `notBefore`. */
  receivedAt?: Date;
};

export type PickOptions = {
  /** Sender name that must appear in the row text (case-insensitive). */
  sender: string;
  /** Codes already used or seen; never returned. */
  excludeCodes?: ReadonlySet<string>;
  /** Rows received before this instant are ignored (only applies to rows that carry `receivedAt`). */
  notBefore?: Date;
};

export const SMS_CODE_REGEX = /\b(\d{6})\b/;

/**
 * Returns the 6-digit code of the newest matching row, or undefined when nothing matches (never a wrong code).
 * Rows are in inbox order (top = newest, as the page shows them). When rows carry `receivedAt`, the newest
 * timestamp wins regardless of order; rows without a timestamp keep their inbox order.
 */
export function pickNewestCode(rows: ReadonlyArray<SmsRow | string>, opts: PickOptions): string | undefined {
  const { sender, excludeCodes = new Set<string>(), notBefore } = opts;
  const wanted = sender.toLowerCase();
  const candidates = rows
    .map((r, index) => ({ ...(typeof r === 'string' ? { text: r } : r), index }))
    .filter((r) => r.text.toLowerCase().includes(wanted))
    .filter((r) => !(notBefore && r.receivedAt && r.receivedAt < notBefore))
    .map((r) => ({ ...r, code: r.text.match(SMS_CODE_REGEX)?.[1] }))
    .filter((r): r is typeof r & { code: string } => !!r.code && !excludeCodes.has(r.code));
  candidates.sort((a, b) => {
    if (a.receivedAt && b.receivedAt) return b.receivedAt.getTime() - a.receivedAt.getTime() || a.index - b.index;
    return a.index - b.index;
  });
  return candidates[0]?.code;
}

export type PollClock = { now: () => number; sleep: (ms: number) => Promise<void> };

/**
 * Bounded poll: reads rows every `pollMs` (never below `minPollMs`) until a code is picked or `timeoutMs` elapsed.
 * Returns undefined on timeout ("no message"). Clock is injectable so it can be unit-tested with a fake clock.
 */
export async function pollForCode(
  readRows: () => Promise<ReadonlyArray<SmsRow | string>>,
  opts: PickOptions & { timeoutMs: number; pollMs?: number; minPollMs?: number },
  clock: PollClock = { now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) },
): Promise<string | undefined> {
  const pollMs = Math.max(opts.pollMs ?? 5_000, opts.minPollMs ?? 5_000);
  const deadline = clock.now() + opts.timeoutMs;
  for (;;) {
    const code = pickNewestCode(await readRows(), opts);
    if (code) return code;
    if (clock.now() + pollMs > deadline) return undefined;
    await clock.sleep(pollMs);
  }
}
