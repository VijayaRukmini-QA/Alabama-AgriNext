import { test, expect } from '../../../fixtures/customer.fixture';
import { pickNewestCode, pollForCode, type SmsRow } from '../../../utils/smsCodePicker';
import { ThirdPartyBlockedError } from '../../../utils/thirdPartyGuard';
import { smsSender } from '../../../test-data/customer.data';
import { observe } from './signin.helpers';

const SENDER = smsSender; // 'Alabama Ag Credit'
const at = (iso: string) => new Date(iso);
const row = (code: string, time: string, sender = SENDER): SmsRow => ({
  text: `${sender} Your verification code is ${code}. Do not share it.`,
  receivedAt: at(time),
});

test.describe('Customer Sign in - third-party SMS inbox', () => {
  test('TC-S-37 @customer @signin @regression a Cloudflare challenge on the SMS inbox is reported as BLOCKED, never bypassed', async ({ smsInbox }) => {
    const url = process.env.SMS_INBOX_URL;
    test.skip(!url, 'SMS_INBOX_URL is not set');
    let blocked: ThirdPartyBlockedError | undefined;
    try {
      await smsInbox.open(url!);
    } catch (e) {
      if (!(e instanceof ThirdPartyBlockedError)) throw e;
      blocked = e;
    }
    if (blocked) {
      // A challenge is present: the guard threw ThirdPartyBlockedError; report BLOCKED, do nothing else on the site.
      expect(blocked.message).toMatch(/blocked by a bot challenge/i);
      test.skip(true, `BLOCKED: receive-smss Cloudflare (F-02) - not bypassed [${blocked.reason}]`);
      return;
    }
    // No challenge: the inbox must really be readable (not merely "guard returned"). UNVERIFIED control, see page object.
    await expect(smsInbox.updateMessageControl, 'inbox is readable: Update Message control visible').toBeVisible({ timeout: 10_000 });
    observe('No bot challenge detected and the inbox is readable (AC-43).');
  });

  // Unit tests of the pure selection logic (no browser page): TC-S-38 and TC-S-39.
  test('TC-S-38 @customer @signin @regression the newest Alabama Ag Credit message after the request time is chosen', () => {
    const rows = [row('222222', '2026-11-09T10:05:00Z'), row('333333', '2026-11-09T10:03:00Z'), row('111111', '2026-11-09T09:50:00Z')];
    const requestedAt = at('2026-11-09T10:00:00Z');
    expect(pickNewestCode(rows, { sender: SENDER, notBefore: requestedAt })).toBe('222222');
    // Inbox order does not matter when timestamps exist: the newest timestamp wins (EDGE-23).
    expect(pickNewestCode([...rows].reverse(), { sender: SENDER, notBefore: requestedAt })).toBe('222222');
    // Older messages are ignored.
    expect(pickNewestCode([row('111111', '2026-11-09T09:50:00Z')], { sender: SENDER, notBefore: requestedAt })).toBeUndefined();
    // Plain text rows (as read from the page): top row is newest and the code is exactly six digits.
    expect(pickNewestCode([`${SENDER} code 654321 now`, `${SENDER} code 123456 earlier`], { sender: SENDER })).toBe('654321');
    // Already-seen codes are never returned.
    expect(pickNewestCode(rows, { sender: SENDER, notBefore: requestedAt, excludeCodes: new Set(['222222']) })).toBe('333333');
    // Only six-digit codes are extracted.
    expect(pickNewestCode([`${SENDER} code 12345 and 1234567`], { sender: SENDER })).toBeUndefined();
  });

  test('TC-S-39 @customer @signin @regression @negative other senders and older messages are ignored, and the bounded poll stops at the timeout', async () => {
    const requestedAt = at('2026-11-09T10:00:00Z');
    expect(pickNewestCode([row('999999', '2026-11-09T10:05:00Z', 'SomeoneElse')], { sender: SENDER, notBefore: requestedAt })).toBeUndefined();
    expect(pickNewestCode([row('888888', '2026-11-09T09:00:00Z')], { sender: SENDER, notBefore: requestedAt })).toBeUndefined();
    expect(pickNewestCode([], { sender: SENDER, notBefore: requestedAt })).toBeUndefined();

    // Bounded poll with a fake clock: never a wrong code, and it stops once the next poll would pass the deadline.
    let now = 0;
    let reads = 0;
    const clock = {
      now: () => now,
      sleep: async (ms: number) => {
        now += ms;
      },
    };
    const code = await pollForCode(
      async () => {
        reads += 1;
        return [row('999999', '2026-11-09T10:05:00Z', 'SomeoneElse')];
      },
      { sender: SENDER, notBefore: requestedAt, timeoutMs: 30_000, pollMs: 5_000 },
      clock,
    );
    expect(code).toBeUndefined();
    expect(now).toBeLessThanOrEqual(30_000);
    expect(reads).toBe(7); // reads at 0, 5, ..., 30 s

    // The poll never goes faster than 5 s even when asked to.
    let fastNow = 0;
    await pollForCode(async () => [], { sender: SENDER, timeoutMs: 10_000, pollMs: 100 }, { now: () => fastNow, sleep: async (ms) => void (fastNow += ms) });
    expect(fastNow).toBeGreaterThanOrEqual(5_000);

    // A message that arrives mid-poll is returned.
    let n = 0;
    now = 0;
    const late = await pollForCode(async () => (++n < 3 ? [] : [row('424242', '2026-11-09T10:05:00Z')]), { sender: SENDER, notBefore: requestedAt, timeoutMs: 60_000 }, clock);
    expect(late).toBe('424242');
  });
});
