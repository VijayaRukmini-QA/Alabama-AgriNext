import { expect } from '@playwright/test';
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
  /just a moment|performing security verification|verify you are human|confirm (?:that )?you(?:'|’)?re human|confirm you are human|checking your browser|cf-chl|attention required/i;

export type BotWallOptions = {
  /** Bounded re-check window in ms (0 = a single pass). Use ~6000 right after a navigation. */
  windowMs?: number;
  /** The navigation response, when available (403/503 + cf-mitigated header = challenge). */
  response?: Response | null;
};
type Response = import('@playwright/test').Response;

async function checkOnce(page: Page, response?: Response | null): Promise<string | undefined> {
  if (response) {
    const h = response.headers();
    if (h['cf-mitigated']) return `cf-mitigated header "${h['cf-mitigated']}" (HTTP ${response.status()})`;
  }
  for (const frame of page.frames()) {
    if (/challenges\.cloudflare\.com|turnstile/i.test(frame.url())) return 'Cloudflare/Turnstile frame present';
  }
  const title = await page.title().catch(() => '');
  if (/just a moment/i.test(title)) return `page title "${title}"`;
  const dom = await page
    .evaluate(() => {
      const el = document.querySelector('#challenge-form, [name="cf-turnstile-response"], .cf-turnstile, #challenge-running');
      return { el: el ? (el.id ? `#${el.id}` : el.getAttribute('name') || el.className || el.tagName) : '', text: document.body?.innerText ?? '' };
    })
    .catch(() => ({ el: '', text: '' }));
  if (dom.el) return `challenge element ${dom.el}`;
  const m = dom.text.match(BLOCK_TEXT);
  if (m) return `page text "${m[0]}"`;
  if (response && [403, 503].includes(response.status()) && /cloudflare/i.test(response.headers()['server'] ?? ''))
    return `HTTP ${response.status()} from Cloudflare`;
  return undefined;
}

/**
 * Returns a reason if the page (or one of its frames) shows a Cloudflare/Turnstile wall, else undefined.
 * Waits for load, then re-evaluates over a bounded window (the interstitial title/text/iframe render late)
 * and returns as soon as anything matches. Detection only: never attempts to solve or bypass.
 */
export async function detectBotWall(page: Page, opts: BotWallOptions = {}): Promise<string | undefined> {
  const { windowMs = 0, response } = opts;
  await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => undefined);
  if (windowMs <= 0) return checkOnce(page, response);
  // Bounded web-first re-check (no fixed sleeps): stop as soon as a wall is seen, give up after windowMs.
  let reason: string | undefined;
  await expect
    .poll(async () => (reason = await checkOnce(page, response)) ?? '', { timeout: windowMs, intervals: [500] })
    .not.toBe('')
    .catch(() => undefined);
  return reason;
}

/** Throws ThirdPartyBlockedError when a bot wall is detected. */
export async function assertNotBlocked(page: Page, site: string, opts: BotWallOptions = {}): Promise<void> {
  const reason = await detectBotWall(page, opts);
  if (reason) throw new ThirdPartyBlockedError(site, reason);
}

export const NAV_WINDOW_MS = 6_000;
