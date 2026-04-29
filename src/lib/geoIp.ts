type GeoLookupResult = {
  countryCode: string;
  countryName: string;
};

type CacheEntry = GeoLookupResult | null;

const lookupCache = new Map<string, { expiresAt: number; value: CacheEntry }>();
const LOOKUP_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const GEOIP_LOOKUP_TIMEOUT_MS = 3000;

function normalizeIp(rawIp: string) {
  return rawIp
    .trim()
    .toLowerCase()
    .replace(/^::ffff:/, '')
    .replace(/^\[(.*)\]$/, '$1');
}

function isPrivateIpv4(ip: string) {
  return ip.startsWith('10.')
    || ip.startsWith('127.')
    || ip.startsWith('192.168.')
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
    || ip === '0.0.0.0';
}

function isPrivateIpv6(ip: string) {
  return ip === '::1'
    || ip === '::'
    || ip.startsWith('fc')
    || ip.startsWith('fd')
    || ip.startsWith('fe80:');
}

function isLookupEligible(ip: string) {
  if (!ip || ip === 'unknown') return false;
  if (ip.includes('.')) return !isPrivateIpv4(ip);
  if (ip.includes(':')) return !isPrivateIpv6(ip);
  return false;
}

function getLookupUrl(ip: string) {
  const template = process.env.GEOIP_LOOKUP_URL || 'https://ipwho.is/{ip}';
  return template.includes('{ip}') ? template.replace('{ip}', encodeURIComponent(ip)) : `${template}${encodeURIComponent(ip)}`;
}

export async function resolveCountryFromIp(rawIp: string): Promise<GeoLookupResult | null> {
  const ip = normalizeIp(rawIp);
  if (!isLookupEligible(ip)) {
    return null;
  }

  const cached = lookupCache.get(ip);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOIP_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(getLookupUrl(ip), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      lookupCache.set(ip, { expiresAt: now + LOOKUP_CACHE_TTL_MS, value: null });
      return null;
    }

    const payload = await response.json() as {
      success?: boolean;
      country?: string;
      country_code?: string;
      countryCode?: string;
      country_name?: string;
      countryName?: string;
    };

    if (payload.success === false) {
      lookupCache.set(ip, { expiresAt: now + LOOKUP_CACHE_TTL_MS, value: null });
      return null;
    }

    const countryCode = String(payload.country_code || payload.countryCode || '').trim().toUpperCase();
    const countryName = String(payload.country || payload.country_name || payload.countryName || '').trim();
    const result = countryCode && countryName ? { countryCode, countryName } : null;

    lookupCache.set(ip, {
      expiresAt: now + LOOKUP_CACHE_TTL_MS,
      value: result,
    });

    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}