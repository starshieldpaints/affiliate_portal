const FALLBACK_BASE_URL = 'https://starshield.io';

type UTMParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
};

export type AffiliateLinkOptions = {
  landingUrl: string;
  affiliateCode: string;
  utm?: UTMParams;
  extraParams?: Record<string, string | number | undefined | null>;
};

export function buildAffiliateLink({
  landingUrl,
  affiliateCode,
  utm,
  extraParams
}: AffiliateLinkOptions): string {
  if (!landingUrl) {
    throw new Error('landingUrl is required');
  }

  if (!affiliateCode) {
    throw new Error('affiliateCode is required');
  }

  const url = createUrl(landingUrl);

  url.searchParams.set('aff', affiliateCode);

  if (utm) {
    Object.entries(utm).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(`utm_${key}`, value);
      }
    });
  }

  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function createUrl(pathOrUrl: string) {
  try {
    return new URL(pathOrUrl);
  } catch {
    return new URL(pathOrUrl, FALLBACK_BASE_URL);
  }
}
