import { tool } from 'ai';
import { z } from 'zod';

const BLOCKED_HOSTS_RE =
  /^(127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|0\.0\.0\.0|localhost|\[::1\]|\[::0?\])$/i;

function isSsrfBlocked(urlStr: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return true;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return true;
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  return BLOCKED_HOSTS_RE.test(hostname);
}

export const fetchUrl = tool({
  description:
    'Fetch the text content of a URL. Blocks private/internal network addresses for security.',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to fetch'),
  }),
  execute: async ({ url }) => {
    if (isSsrfBlocked(url)) {
      return { error: 'URL blocked: private or internal network address' };
    }
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Evee/1.0' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        return { error: `HTTP ${res.status} ${res.statusText}` };
      }
      const text = await res.text();
      // Truncate to avoid overwhelming the context
      return { content: text.slice(0, 20_000) };
    } catch (err) {
      return {
        error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});
