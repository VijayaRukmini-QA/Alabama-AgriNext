import type { Page } from '@playwright/test';

/**
 * Thrown when a third-party site shows a bot wall. The suite NEVER tries to solve or bypass it:
 * the caller (a test) should skip or fail with a clear message.
 */
export class ThirdPartyBlockedError extends Error {
  constructor(
    public readonly site: string,
    public readonly reason: string,
  ) {
    super(
      `${site} is blocked by a bot challenge (${reason}). Not attempting to bypass; use an allowlisted runner or an API-based inbox.`,
    );
    this.name = 'ThirdPartyBlockedError';
  }
}

const BLOCK_TEXT =
  /just a moment|performing security verification|confirm (that )?you(?:'|’)?re human|confirm you are human|verify you are human|checking your browser/i;

/** Returns a reason if the page (or one of its frames) shows a Cloudflare/Turnstile wall, else undefined. */
export async function detectBotWall(page: Page): Promise<string | undefined> {
  for (const frame of page.frames()) {
    if (/challenges\.cloudflare\.com|turnstile/i.test(frame.url())) return 'Cloudflare/Turnstile frame present';
  }
  const title = await page.title().catch(() => '');
  if (/just a moment/i.test(title)) return `page title "${title}"`;
  const body = await page.locator('body').innerText({ timeout: 2_000 }).catch(() => '');
  const m = body.match(BLOCK_TEXT);
  return m ? `page text "${m[0]}"` : undefined;
}

/** Throws ThirdPartyBlockedError when a bot wall is detected. */
export async function assertNotBlocked(page: Page, site: string): Promise<void> {
  const reason = await detectBotWall(page);
  if (reason) throw new ThirdPartyBlockedError(site, reason);
}
