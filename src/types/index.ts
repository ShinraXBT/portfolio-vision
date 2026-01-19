// Portfolio
export interface Portfolio {
  id: string;
  name: string;
  createdAt: Date;
  color: string;
}

// Wallet
export interface Wallet {
  id: string;
  portfolioId: string;
  name: string;
  address?: string;
  chain?: string;
  color: string;
}

// Wallet balance in a snapshot
export interface WalletBalance {
  walletId: string;
  valueUsd: number;
}

// Daily Snapshot
export interface DailySnapshot {
  id: string;
  portfolioId: string;
  date: string; // Format: "YYYY-MM-DD"
  walletBalances: WalletBalance[];
  totalUsd: number;
  variationPercent: number;
  variationUsd: number;
}

// Monthly Snapshot (aggregated)
export interface MonthlySnapshot {
  id: string;
  portfolioId: string;
  month: string; // Format: "YYYY-MM"
  year: number;
  totalUsd: number;
  deltaUsd: number;
  deltaPercent: number;
  btcPrice: number;
  ethPrice: number;
  customRefPrice?: number;
}

// Settings
export interface Settings {
  id: string;
  currency: string;
  referenceCoins: string[];
  theme: 'dark';
}

// Price data from CoinGecko
export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
}

// Chart data point
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Performance metrics
export interface PerformanceMetrics {
  total: number;
  change24h: number;
  change24hPercent: number;
  change7d: number;
  change7dPercent: number;
  change30d: number;
  change30dPercent: number;
  ath: number;
  athDate: string;
}

// Wallet allocation for pie chart
export interface WalletAllocation {
  walletId: string;
  walletName: string;
  value: number;
  percentage: number;
  color: string;
}

// Import data format
export interface ImportedSnapshot {
  date: string;
  wallets: { [walletName: string]: number };
  total?: number;
}

// Export data format
export interface ExportData {
  portfolios: Portfolio[];
  wallets: Wallet[];
  snapshots: DailySnapshot[];
  exportedAt: string;
  version: string;
}
