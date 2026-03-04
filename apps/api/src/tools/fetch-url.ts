import { tool } from 'ai';
import { dns } from 'bun';
import { z } from 'zod';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254',
]);

/**
 * Check if an IP address falls within private/internal/reserved ranges.
 * Covers: loopback, private RFC1918, link-local, IPv6 loopback,
 * IPv4-mapped IPv6 loopback, unique local (fc00::/7), link-local IPv6.
 */
function isPrivateIp(ip: string): boolean {
  // IPv4-mapped IPv6 (::ffff:x.x.x.x) — extract the IPv4 part and check it
  const v4MappedMatch = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4MappedMatch) {
    return isPrivateIp(v4MappedMatch[1]);
  }

  // IPv6 checks
  if (ip.includes(':')) {
    const normalized = ip.toLowerCase();
    // ::1 loopback
    if (normalized === '::1' || normalized === '::0' || normalized === '::') {
      return true;
    }
    // fc00::/7 — unique local addresses (fc or fd prefix)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return true;
    }
    // fe80::/10 — link-local
    if (normalized.startsWith('fe80')) {
      return true;
    }
    return false;
  }

  // IPv4 checks
  const parts = ip.split('.');
  if (parts.length !== 4) return true; // malformed, block it
  const octets = parts.map(Number);
  if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) return true;

  const [a, b] = octets;

  // 0.0.0.0/8 — current network
  if (a === 0) return true;
  // 127.0.0.0/8 — loopback
  if (a === 127) return true;
  // 10.0.0.0/8 — private
  if (a === 10) return true;
  // 172.16.0.0/12 — private
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 — private
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 — link-local
  if (a === 169 && b === 254) return true;

  return false;
}

/**
 * Validate a URL is safe to fetch: protocol, hostname blocklist, DNS resolution, IP check.
 * Returns the resolved URL string on success, or an error message on failure.
 */
async function validateUrl(
  urlStr: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs are allowed' };
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');

  // Check hostname blocklist
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    return {
      ok: false,
      error: 'URL blocked: private or internal network address',
    };
  }

  // Resolve DNS to get actual IP addresses before connecting
  let results: Awaited<ReturnType<typeof dns.lookup>>;
  try {
    results = await dns.lookup(hostname);
  } catch {
    return { ok: false, error: `DNS resolution failed for ${hostname}` };
  }

  if (results.length === 0) {
    return { ok: false, error: `No DNS records found for ${hostname}` };
  }

  // Check every resolved IP against private ranges
  for (const { address } of results) {
    if (isPrivateIp(address)) {
      return {
        ok: false,
        error: 'URL blocked: private or internal network address',
      };
    }
  }

  return { ok: true, url: parsed.toString() };
}

const FETCH_OPTIONS: RequestInit = {
  headers: { 'User-Agent': 'Evee/1.0' },
  signal: AbortSignal.timeout(10_000),
  redirect: 'manual',
};

const MAX_BODY_LENGTH = 20_000;

/**
 * Validate a URL then fetch it with redirect: manual.
 */
async function safeFetch(
  urlStr: string,
): Promise<{ ok: true; res: Response } | { ok: false; error: string }> {
  const validation = await validateUrl(urlStr);
  if (!validation.ok) {
    return validation;
  }
  const res = await fetch(validation.url, FETCH_OPTIONS);
  return { ok: true, res };
}

export const fetchUrl = tool({
  description:
    'Fetch the text content of a URL. Blocks private/internal network addresses for security.',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to fetch'),
  }),
  execute: async ({ url }) => {
    try {
      let result = await safeFetch(url);
      if (!result.ok) {
        return { error: result.error };
      }

      // Handle redirects: validate the target before following
      if (result.res.status >= 300 && result.res.status < 400) {
        const location = result.res.headers.get('location');
        if (!location) {
          return {
            error: `Redirect ${result.res.status} with no Location header`,
          };
        }

        const redirectUrl = new URL(location, url).toString();
        result = await safeFetch(redirectUrl);
        if (!result.ok) {
          return { error: `Redirect blocked: ${result.error}` };
        }
      }

      if (!result.res.ok) {
        return {
          error: `HTTP ${result.res.status} ${result.res.statusText}`,
        };
      }

      const text = await result.res.text();
      return { content: text.slice(0, MAX_BODY_LENGTH) };
    } catch (err) {
      return {
        error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});
