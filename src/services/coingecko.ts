import { CoinPrice } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Simple cache to avoid hitting rate limits
const cache: Map<string, { data: unknown; timestamp: number }> = new Map();
const CACHE_DURATION = 60000; // 1 minute

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

export const coingeckoService = {
  // Get prices for multiple coins
  async getPrices(coinIds: string[], currency = 'usd'): Promise<Record<string, { usd: number; usd_24h_change: number }>> {
    const ids = coinIds.join(',');
    const url = `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=${currency}&include_24hr_change=true`;
    return fetchWithCache(url);
  },

  // Get detailed info for coins
  async getCoinsMarkets(coinIds: string[], currency = 'usd'): Promise<CoinPrice[]> {
    const ids = coinIds.join(',');
    const url = `${BASE_URL}/coins/markets?vs_currency=${currency}&ids=${ids}&order=market_cap_desc&sparkline=false`;
    return fetchWithCache(url);
  },

  // Search for coins
  async searchCoins(query: string): Promise<{ coins: { id: string; name: string; symbol: string; thumb: string }[] }> {
    const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
    return fetchWithCache(url);
  },

  // Get historical price
  async getHistoricalPrice(coinId: string, date: string, currency = 'usd'): Promise<number | null> {
    // Date format: dd-mm-yyyy
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    try {
      const url = `${BASE_URL}/coins/${coinId}/history?date=${formattedDate}`;
      const data = await fetchWithCache<{ market_data?: { current_price?: { [key: string]: number } } }>(url);
      return data.market_data?.current_price?.[currency] ?? null;
    } catch {
      return null;
    }
  },

  // Get price chart data
  async getPriceChart(coinId: string, days: number, currency = 'usd'): Promise<{ prices: [number, number][] }> {
    const url = `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`;
    return fetchWithCache(url);
  },

  // Get BTC and ETH prices (common reference)
  async getReferencePrices(): Promise<{ btc: number; eth: number }> {
    const prices = await this.getPrices(['bitcoin', 'ethereum']);
    return {
      btc: prices.bitcoin?.usd ?? 0,
      eth: prices.ethereum?.usd ?? 0
    };
  },

  // Clear cache
  clearCache() {
    cache.clear();
  }
};

// Popular coins list for search/selection
export const popularCoins = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
  { id: 'matic-network', name: 'Polygon', symbol: 'MATIC' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' }
];

// Supported chains for wallet addresses
export const supportedChains = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP' },
  { id: 'base', name: 'Base', symbol: 'BASE' }
];
