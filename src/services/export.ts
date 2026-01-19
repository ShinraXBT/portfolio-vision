import { db } from './db';
import { generateCSV, generateJSON } from '../utils/importParser';

export const exportService = {
  // Export all data as JSON
  async exportAsJSON(): Promise<string> {
    const [portfolios, wallets, snapshots] = await Promise.all([
      db.portfolios.toArray(),
      db.wallets.toArray(),
      db.dailySnapshots.toArray()
    ]);

    return generateJSON({ portfolios, wallets, snapshots });
  },

  // Export snapshots as CSV for a specific portfolio
  async exportAsCSV(portfolioId: string): Promise<string> {
    const [wallets, snapshots] = await Promise.all([
      db.wallets.where('portfolioId').equals(portfolioId).toArray(),
      db.dailySnapshots.where('portfolioId').equals(portfolioId).sortBy('date')
    ]);

    const csvData = snapshots.map(snapshot => ({
      date: snapshot.date,
      wallets: snapshot.walletBalances.map(balance => {
        const wallet = wallets.find(w => w.id === balance.walletId);
        return {
          name: wallet?.name ?? 'Unknown',
          value: balance.valueUsd
        };
      }),
      total: snapshot.totalUsd
    }));

    return generateCSV(csvData);
  },

  // Download file
  downloadFile(content: string, filename: string, type: 'json' | 'csv') {
    const mimeType = type === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Quick export functions
  async downloadAllAsJSON() {
    const content = await this.exportAsJSON();
    const date = new Date().toISOString().split('T')[0];
    this.downloadFile(content, `portfolio-vision-backup-${date}.json`, 'json');
  },

  async downloadPortfolioAsCSV(portfolioId: string, portfolioName: string) {
    const content = await this.exportAsCSV(portfolioId);
    const date = new Date().toISOString().split('T')[0];
    const safeName = portfolioName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    this.downloadFile(content, `${safeName}-export-${date}.csv`, 'csv');
  }
};
