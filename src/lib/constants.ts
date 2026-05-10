/**
 * Site-wide constants for Early Thunder.
 * Single source of truth for URLs, brand copy, and configuration.
 */

export const SITE_URL = 'https://earlythunder.com' as const;
export const SITE_NAME = 'Early Thunder' as const;
export const SITE_TAGLINE = 'Hear the storm before anyone else' as const;

export const SITE_DESCRIPTION =
  'Tracks pre-mainstream asymmetric opportunities across crypto, deep tech, and emerging markets. 8-signal pattern filter scores what others miss.' as const;

export const OG_IMAGE_PATH = '/og-default.svg' as const;
export const OG_IMAGE_WIDTH = 1200 as const;
export const OG_IMAGE_HEIGHT = 630 as const;

export const TWITTER_HANDLE = '@earlythunder' as const;

export const STATIC_PAGES = [
  '/',
  '/opportunities',
  '/methodology',
  '/how-it-works',
  '/graveyard',
  '/pricing',
  '/performance',
  '/discoveries',
  '/blog',
  '/intelligence',
  '/research',
  '/terms',
  '/privacy',
  '/disclaimer',
] as const;

/** Research article slugs for sitemap and metadata generation. */
export const RESEARCH_SLUGS = [
  'kelp-exploit-analysis',
  'airdrop-performance-data',
  'tokenless-protocols-tvl-2026',
  'lqty-v2-value-break',
  'crypto-intelligence-brief-week-of-2026-05-09',
  'commonware-analysis-potential-1000x-2500x-roi-opportunity',
  'gains-network-analysis-smart-money-score-86-with-40-tvl-surge',
  'commonware-deep-alpha',
  'the-23-billion-divergence',
  'genius-act-countdown',
  'ai-crypto-convergence',
  'rwa-tokenization-tripled',
  'infrastructure-monopoly-map',
] as const;

/** Sitemap priority map by page path */
export const PRIORITY_MAP: Readonly<Record<string, number>> = {
  '/': 1.0,
  '/opportunities': 0.9,
  '/intelligence': 0.9,
  '/methodology': 0.5,
  '/how-it-works': 0.6,
  '/graveyard': 0.5,
  '/pricing': 0.5,
  '/performance': 0.6,
  '/discoveries': 0.7,
  '/blog': 0.7,
  '/research': 0.8,
  '/terms': 0.3,
  '/privacy': 0.3,
  '/disclaimer': 0.3,
} as const;

export const RESEARCH_ARTICLE_PRIORITY = 0.7 as const;

export const OPPORTUNITY_PRIORITY = 0.8 as const;
export const BLOG_POST_PRIORITY = 0.7 as const;

export const AUTHOR_NAME = 'Early Thunder Research' as const;
