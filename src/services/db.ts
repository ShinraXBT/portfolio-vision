import Dexie, { Table } from 'dexie';
import { Portfolio, Wallet, DailySnapshot, MonthlySnapshot, Settings, Goal, JournalEntry, MarketEvent } from '../types';

export class PortfolioDatabase extends Dexie {
  portfolios!: Table<Portfolio>;
  wallets!: Table<Wallet>;
  dailySnapshots!: Table<DailySnapshot>;
  monthlySnapshots!: Table<MonthlySnapshot>;
  settings!: Table<Settings>;
  goals!: Table<Goal>;
  journalEntries!: Table<JournalEntry>;
  marketEvents!: Table<MarketEvent>;

  constructor() {
    super('PortfolioVisionDB');

    this.version(1).stores({
      portfolios: 'id, name, createdAt',
      wallets: 'id, portfolioId, name, chain',
      dailySnapshots: 'id, portfolioId, date, [portfolioId+date]',
      monthlySnapshots: 'id, portfolioId, month, year, [portfolioId+month]',
      settings: 'id'
    });

    // Version 2: Add goals, journal, and market events
    this.version(2).stores({
      portfolios: 'id, name, createdAt',
      wallets: 'id, portfolioId, name, chain',
      dailySnapshots: 'id, portfolioId, date, [portfolioId+date]',
      monthlySnapshots: 'id, portfolioId, month, year, [portfolioId+month]',
      settings: 'id',
      goals: 'id, portfolioId, createdAt, completedAt',
      journalEntries: 'id, portfolioId, date, [portfolioId+date]',
      marketEvents: 'id, date, type'
    });
  }
}

export const db = new PortfolioDatabase();

// Initialize default settings if not exist
export async function initializeDatabase() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'default',
      currency: 'USD',
      referenceCoins: ['bitcoin', 'ethereum'],
      theme: 'dark'
    });
  }
}

// Portfolio operations
export const portfolioService = {
  async getAll(): Promise<Portfolio[]> {
    return db.portfolios.toArray();
  },

  async getById(id: string): Promise<Portfolio | undefined> {
    return db.portfolios.get(id);
  },

  async create(portfolio: Portfolio): Promise<string> {
    return db.portfolios.add(portfolio);
  },

  async update(id: string, changes: Partial<Portfolio>): Promise<number> {
    return db.portfolios.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.portfolios, db.wallets, db.dailySnapshots, db.monthlySnapshots], async () => {
      await db.wallets.where('portfolioId').equals(id).delete();
      await db.dailySnapshots.where('portfolioId').equals(id).delete();
      await db.monthlySnapshots.where('portfolioId').equals(id).delete();
      await db.portfolios.delete(id);
    });
  }
};

// Wallet operations
export const walletService = {
  async getAll(): Promise<Wallet[]> {
    return db.wallets.toArray();
  },

  async getByPortfolio(portfolioId: string): Promise<Wallet[]> {
    return db.wallets.where('portfolioId').equals(portfolioId).toArray();
  },

  async getById(id: string): Promise<Wallet | undefined> {
    return db.wallets.get(id);
  },

  async create(wallet: Wallet): Promise<string> {
    return db.wallets.add(wallet);
  },

  async update(id: string, changes: Partial<Wallet>): Promise<number> {
    return db.wallets.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.wallets.delete(id);
  }
};

// Snapshot operations
export const snapshotService = {
  async getDailySnapshots(portfolioId: string): Promise<DailySnapshot[]> {
    return db.dailySnapshots
      .where('portfolioId')
      .equals(portfolioId)
      .sortBy('date');
  },

  async getDailySnapshotByDate(portfolioId: string, date: string): Promise<DailySnapshot | undefined> {
    return db.dailySnapshots
      .where('[portfolioId+date]')
      .equals([portfolioId, date])
      .first();
  },

  async getLatestSnapshot(portfolioId: string): Promise<DailySnapshot | undefined> {
    const snapshots = await db.dailySnapshots
      .where('portfolioId')
      .equals(portfolioId)
      .reverse()
      .sortBy('date');
    return snapshots[0];
  },

  async getSnapshotsInRange(portfolioId: string, startDate: string, endDate: string): Promise<DailySnapshot[]> {
    return db.dailySnapshots
      .where('portfolioId')
      .equals(portfolioId)
      .filter(s => s.date >= startDate && s.date <= endDate)
      .sortBy('date');
  },

  async createDailySnapshot(snapshot: DailySnapshot): Promise<string> {
    const existing = await this.getDailySnapshotByDate(snapshot.portfolioId, snapshot.date);
    if (existing) {
      // Use put to replace the entire record
      await db.dailySnapshots.put({ ...snapshot, id: existing.id });
      return existing.id;
    }
    return db.dailySnapshots.add(snapshot);
  },

  async updateDailySnapshot(id: string, changes: Partial<DailySnapshot>): Promise<number> {
    return db.dailySnapshots.update(id, changes);
  },

  async deleteDailySnapshot(id: string): Promise<void> {
    await db.dailySnapshots.delete(id);
  },

  // Monthly snapshots
  async getMonthlySnapshots(portfolioId: string): Promise<MonthlySnapshot[]> {
    return db.monthlySnapshots
      .where('portfolioId')
      .equals(portfolioId)
      .sortBy('month');
  },

  async getMonthlySnapshotsByYear(portfolioId: string, year: number): Promise<MonthlySnapshot[]> {
    return db.monthlySnapshots
      .where('portfolioId')
      .equals(portfolioId)
      .filter(s => s.year === year)
      .sortBy('month');
  },

  async createMonthlySnapshot(snapshot: MonthlySnapshot): Promise<string> {
    const existing = await db.monthlySnapshots
      .where('[portfolioId+month]')
      .equals([snapshot.portfolioId, snapshot.month])
      .first();
    if (existing) {
      await db.monthlySnapshots.put({ ...snapshot, id: existing.id });
      return existing.id;
    }
    return db.monthlySnapshots.add(snapshot);
  },

  async updateMonthlySnapshot(id: string, changes: Partial<MonthlySnapshot>): Promise<number> {
    return db.monthlySnapshots.update(id, changes);
  },

  async deleteMonthlySnapshot(id: string): Promise<void> {
    await db.monthlySnapshots.delete(id);
  }
};

// Settings operations
export const settingsService = {
  async get(): Promise<Settings | undefined> {
    return db.settings.get('default');
  },

  async update(changes: Partial<Settings>): Promise<number> {
    return db.settings.update('default', changes);
  }
};

// Goal operations
export const goalService = {
  async getAll(): Promise<Goal[]> {
    return db.goals.toArray();
  },

  async getByPortfolio(portfolioId: string): Promise<Goal[]> {
    return db.goals.where('portfolioId').equals(portfolioId).toArray();
  },

  async getById(id: string): Promise<Goal | undefined> {
    return db.goals.get(id);
  },

  async create(goal: Goal): Promise<string> {
    return db.goals.add(goal);
  },

  async update(id: string, changes: Partial<Goal>): Promise<number> {
    return db.goals.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.goals.delete(id);
  },

  async markCompleted(id: string): Promise<number> {
    return db.goals.update(id, { completedAt: new Date().toISOString() });
  }
};

// Journal operations
export const journalService = {
  async getAll(): Promise<JournalEntry[]> {
    return db.journalEntries.toArray();
  },

  async getByPortfolio(portfolioId: string): Promise<JournalEntry[]> {
    return db.journalEntries.where('portfolioId').equals(portfolioId).sortBy('date');
  },

  async getByDate(portfolioId: string, date: string): Promise<JournalEntry | undefined> {
    return db.journalEntries
      .where('[portfolioId+date]')
      .equals([portfolioId, date])
      .first();
  },

  async getByDateRange(portfolioId: string, startDate: string, endDate: string): Promise<JournalEntry[]> {
    return db.journalEntries
      .where('portfolioId')
      .equals(portfolioId)
      .filter(e => e.date >= startDate && e.date <= endDate)
      .sortBy('date');
  },

  async create(entry: JournalEntry): Promise<string> {
    return db.journalEntries.add(entry);
  },

  async update(id: string, changes: Partial<JournalEntry>): Promise<number> {
    return db.journalEntries.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async delete(id: string): Promise<void> {
    await db.journalEntries.delete(id);
  }
};

// Market Event operations
export const marketEventService = {
  async getAll(): Promise<MarketEvent[]> {
    return db.marketEvents.orderBy('date').reverse().toArray();
  },

  async getByDateRange(startDate: string, endDate: string): Promise<MarketEvent[]> {
    return db.marketEvents
      .filter(e => e.date >= startDate && e.date <= endDate)
      .sortBy('date');
  },

  async getByType(type: MarketEvent['type']): Promise<MarketEvent[]> {
    return db.marketEvents.where('type').equals(type).sortBy('date');
  },

  async getById(id: string): Promise<MarketEvent | undefined> {
    return db.marketEvents.get(id);
  },

  async create(event: MarketEvent): Promise<string> {
    return db.marketEvents.add(event);
  },

  async update(id: string, changes: Partial<MarketEvent>): Promise<number> {
    return db.marketEvents.update(id, changes);
  },

  async delete(id: string): Promise<void> {
    await db.marketEvents.delete(id);
  }
};

// Export/Import operations
export const exportService = {
  async exportAll() {
    const [portfolios, wallets, snapshots, monthlySnapshots, goals, journalEntries, marketEvents] = await Promise.all([
      db.portfolios.toArray(),
      db.wallets.toArray(),
      db.dailySnapshots.toArray(),
      db.monthlySnapshots.toArray(),
      db.goals.toArray(),
      db.journalEntries.toArray(),
      db.marketEvents.toArray()
    ]);

    return {
      portfolios,
      wallets,
      snapshots,
      monthlySnapshots,
      goals,
      journalEntries,
      marketEvents,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    };
  },

  async importData(data: {
    portfolios: Portfolio[];
    wallets: Wallet[];
    snapshots: DailySnapshot[];
    monthlySnapshots?: MonthlySnapshot[];
    goals?: Goal[];
    journalEntries?: JournalEntry[];
    marketEvents?: MarketEvent[];
  }) {
    await db.transaction('rw', [db.portfolios, db.wallets, db.dailySnapshots, db.monthlySnapshots, db.goals, db.journalEntries, db.marketEvents], async () => {
      for (const portfolio of data.portfolios) {
        const existing = await db.portfolios.get(portfolio.id);
        if (!existing) {
          await db.portfolios.add(portfolio);
        }
      }

      for (const wallet of data.wallets) {
        const existing = await db.wallets.get(wallet.id);
        if (!existing) {
          await db.wallets.add(wallet);
        }
      }

      for (const snapshot of data.snapshots) {
        const existing = await db.dailySnapshots.get(snapshot.id);
        if (!existing) {
          await db.dailySnapshots.add(snapshot);
        }
      }

      if (data.monthlySnapshots) {
        for (const snapshot of data.monthlySnapshots) {
          const existing = await db.monthlySnapshots.get(snapshot.id);
          if (!existing) {
            await db.monthlySnapshots.add(snapshot);
          }
        }
      }

      if (data.goals) {
        for (const goal of data.goals) {
          const existing = await db.goals.get(goal.id);
          if (!existing) {
            await db.goals.add(goal);
          }
        }
      }

      if (data.journalEntries) {
        for (const entry of data.journalEntries) {
          const existing = await db.journalEntries.get(entry.id);
          if (!existing) {
            await db.journalEntries.add(entry);
          }
        }
      }

      if (data.marketEvents) {
        for (const event of data.marketEvents) {
          const existing = await db.marketEvents.get(event.id);
          if (!existing) {
            await db.marketEvents.add(event);
          }
        }
      }
    });
  },

  async clearAll() {
    await db.transaction('rw', [db.portfolios, db.wallets, db.dailySnapshots, db.monthlySnapshots, db.goals, db.journalEntries, db.marketEvents], async () => {
      await db.portfolios.clear();
      await db.wallets.clear();
      await db.dailySnapshots.clear();
      await db.monthlySnapshots.clear();
      await db.goals.clear();
      await db.journalEntries.clear();
      await db.marketEvents.clear();
    });
  }
};
