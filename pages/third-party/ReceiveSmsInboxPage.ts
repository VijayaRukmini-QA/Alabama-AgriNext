import { expect, type Locator, type Page } from '@playwright/test';
import { assertNotBlocked, ThirdPartyBlockedError } from '../../utils/thirdPartyGuard';

export type SmsCodeOptions = {
  /** Sender name shown in the inbox row. */
  sender: string;
  /** Codes already used/seen; never returned. */
  excludeCodes?: ReadonlySet<string>;
  timeoutMs?: number;
  /** Pause between "Update Message" clicks; clamped to at least 5000 to be polite to the public site. */
  pollMs?: number;
};

const SITE = 'receive-smss.com';
const MIN_POLL_MS = 5_000;
const CODE_REGEX = /\b(\d{6})\b/;

/**
 * Public SMS inbox (SMS_INBOX_URL). Use a SEPARATE page, not the app page.
 *
 * UNVERIFIED: the whole page was behind a Cloudflare managed challenge during exploration, so the "Update Message"
 * control and the row structure below are ASSUMPTIONS (role-based first, text fallback; rows located by their
 * sender text). Confirm on an allowlisted runner. Nothing here attempts to solve or bypass the challenge: a
 * ThirdPartyBlockedError is thrown instead.
 */
export class ReceiveSmsInboxPage {
  constructor(protected readonly page: Page) {}

  /** UNVERIFIED: button/link by role, then plain text. */
  readonly updateMessageControl = this.page
    .getByRole('button', { name: /update message/i })
    .or(this.page.getByRole('link', { name: /update message/i }))
    .or(this.page.getByText(/update message/i))
    .first();

  async open(inboxUrl: string): Promise<void> {
    await this.page.goto(inboxUrl, { waitUntil: 'domcontentloaded' });
    await assertNotBlocked(this.page, SITE);
  }

  /** Clicks "Update Message" and guards against a bot wall. */
  async updateMessages(): Promise<void> {
    await assertNotBlocked(this.page, SITE);
    await this.updateMessageControl.click({ timeout: 10_000 });
    await assertNotBlocked(this.page, SITE);
  }

  /** UNVERIFIED: innermost elements carrying the sender text (a row holds sender, text and time). */
  private rowsFor(sender: string): Locator {
    return this.page.locator('div, tr, li').filter({ hasText: sender }).filter({
      hasNot: this.page.locator('div, tr, li').filter({ hasText: sender }),
    });
  }

  /** Query: texts of all rows currently shown for `sender` (top row = newest, assumed). */
  async rowTexts(sender: string): Promise<string[]> {
    await assertNotBlocked(this.page, SITE);
    const texts = await this.rowsFor(sender).allInnerTexts();
    return texts.map((t) => t.replace(/\s+/g, ' ').trim());
  }

  /**
   * Returns a 6-digit code from a message that was NOT present before this call (snapshot taken first),
   * newest first, ignoring excludeCodes. Bounded by timeoutMs. Throws ThirdPartyBlockedError on a bot wall.
   */
  async getNewCode(opts: SmsCodeOptions): Promise<string> {
    const { sender, excludeCodes = new Set<string>(), timeoutMs = 120_000 } = opts;
    const pollMs = Math.max(opts.pollMs ?? MIN_POLL_MS, MIN_POLL_MS);
    const snapshot = new Set(await this.rowTexts(sender));
    let found: string | undefined;
    let blocked: ThirdPartyBlockedError | undefined;
    try {
      // Each round: click "Update Message", read the re-rendered list, retry every pollMs (>= 5 s) until timeoutMs.
      // A bot wall is captured (not thrown) so toPass does not retry it, then rethrown immediately below.
      await expect(async () => {
        try {
          await this.updateMessages();
          for (const row of await this.rowTexts(sender)) {
            if (snapshot.has(row)) continue;
            const code = row.match(CODE_REGEX)?.[1];
            if (code && !excludeCodes.has(code)) {
              found = code;
              return;
            }
          }
        } catch (e) {
          if (e instanceof ThirdPartyBlockedError) {
            blocked = e;
            return;
          }
          throw e;
        }
        throw new Error('no new code yet');
      }).toPass({ timeout: timeoutMs, intervals: [pollMs] });
    } catch {
      // fall through to the bounded-timeout error below
    }
    if (blocked) throw blocked;
    if (found) return found;
    throw new Error(`No new SMS from "${sender}" arrived within ${timeoutMs} ms.`);
  }
}
