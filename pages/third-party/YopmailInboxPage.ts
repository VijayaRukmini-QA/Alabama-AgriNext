import { expect, type FrameLocator, type Page } from '@playwright/test';
import { assertNotBlocked, NAV_WINDOW_MS, ThirdPartyBlockedError } from '../../utils/thirdPartyGuard';
import { inboxName } from '../../utils/customerEmail';

export type YopmailCodeOptions = {
  /** Total time budget for polling. */
  timeoutMs?: number;
  /** Pause between refreshes. */
  pollMs?: number;
  /** Codes that must be ignored (for example an earlier code from the same inbox). */
  excludeCodes?: ReadonlySet<string>;
};

const SITE = 'yopmail.com';
const CODE_REGEX = /\b(\d{8})\b/;

/**
 * Public Yopmail inbox. Use a SEPARATE page (context.newPage()), not the app page.
 *
 * VERIFIED (exploration): home page /en/ loads without a challenge and has a textbox named "Login".
 * UNVERIFIED (inbox /en/wm was behind a Cloudflare Turnstile): everything about the inbox DOM below,
 * taken from Yopmail's known markup, not from our own observation:
 *   iframe `ifinbox` (mail list, newest first), mail entries `.m`, refresh button `#refresh`,
 *   iframe `ifmail` (opened mail) with body `#mail`.
 * The page is checked for a bot wall after every navigation/refresh and ThirdPartyBlockedError is thrown;
 * nothing here attempts to solve or bypass it.
 */
export class YopmailInboxPage {
  constructor(protected readonly page: Page) {}

  readonly loginBox = this.page.getByRole('textbox', { name: 'Login' }); // verified on /en/
  readonly refreshButton = this.page.locator('#refresh'); // UNVERIFIED
  private get inboxFrame(): FrameLocator {
    return this.page.frameLocator('#ifinbox'); // UNVERIFIED
  }
  private get mailFrame(): FrameLocator {
    return this.page.frameLocator('#ifmail'); // UNVERIFIED
  }

  /** Opens the inbox of `email` via the login URL. Throws ThirdPartyBlockedError on a bot wall. */
  async openInbox(email: string): Promise<void> {
    const response = await this.page.goto(`https://yopmail.com/en/?login=${encodeURIComponent(inboxName(email))}`, {
      waitUntil: 'domcontentloaded',
    });
    await assertNotBlocked(this.page, SITE, { windowMs: NAV_WINDOW_MS, response });
  }

  /** Alternative to openInbox: type the name into the Login box (home page). */
  async openInboxViaLoginBox(email: string): Promise<void> {
    const response = await this.page.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded' });
    await assertNotBlocked(this.page, SITE, { windowMs: NAV_WINDOW_MS, response });
    await this.loginBox.fill(inboxName(email));
    await this.loginBox.press('Enter');
    await assertNotBlocked(this.page, SITE);
  }

  /** Clicks refresh (if present), then guards against a bot wall. */
  async refresh(): Promise<void> {
    await assertNotBlocked(this.page, SITE);
    if (await this.refreshButton.isVisible().catch(() => false)) await this.refreshButton.click();
    else await this.page.reload({ waitUntil: 'domcontentloaded' });
    await assertNotBlocked(this.page, SITE);
  }

  /**
   * Polls the inbox (refresh each round) until a mail contains an 8-digit code, bounded by timeoutMs.
   * Opens the newest mail only. Throws ThirdPartyBlockedError on a bot wall, Error on timeout.
   */
  async waitForVerificationCode(email: string, opts: YopmailCodeOptions = {}): Promise<string> {
    const { timeoutMs = 120_000, pollMs = 5_000, excludeCodes = new Set<string>() } = opts;
    await this.openInbox(email);
    let found: string | undefined;
    let blocked: ThirdPartyBlockedError | undefined;
    let round = 0;
    try {
      // Refresh before every round except the first; retry every pollMs until timeoutMs.
      // A bot wall is captured (not thrown) so toPass does not retry it, then rethrown immediately below.
      await expect(async () => {
        try {
          if (round++ > 0) await this.refresh();
          const code = await this.readNewestCode(excludeCodes);
          if (code) {
            found = code;
            return;
          }
        } catch (e) {
          if (e instanceof ThirdPartyBlockedError) {
            blocked = e;
            return;
          }
          throw e;
        }
        throw new Error('no code yet');
      }).toPass({ timeout: timeoutMs, intervals: [pollMs] });
    } catch {
      // fall through to the bounded-timeout error below
    }
    if (blocked) throw blocked;
    if (found) return found;
    throw new Error(`No 8-digit code arrived in the Yopmail inbox within ${timeoutMs} ms.`);
  }

  /** Query: newest mail's code, or undefined if the inbox is empty or the code is excluded. */
  async readNewestCode(excludeCodes: ReadonlySet<string> = new Set()): Promise<string | undefined> {
    await assertNotBlocked(this.page, SITE);
    const newest = this.inboxFrame.locator('.m').first(); // UNVERIFIED
    if (!(await newest.isVisible({ timeout: 3_000 }).catch(() => false))) return undefined;
    await newest.click();
    const text = await this.mailFrame.locator('#mail').innerText({ timeout: 10_000 }).catch(() => '');
    const code = text.match(CODE_REGEX)?.[1];
    return code && !excludeCodes.has(code) ? code : undefined;
  }
}
