import { create } from 'zustand';
import { Portfolio, Wallet, DailySnapshot, MonthlySnapshot, Settings, Goal, JournalEntry, MarketEvent } from '../types';
import { portfolioService, walletService, snapshotService, settingsService, goalService, journalService, marketEventService, initializeDatabase } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  // Data
  portfolios: Portfolio[];
  wallets: Wallet[];
  snapshots: DailySnapshot[];
  monthlySnapshots: MonthlySnapshot[];
  goals: Goal[];
  journalEntries: JournalEntry[];
  marketEvents: MarketEvent[];
  settings: Settings | null;

  // UI State
  activePortfolioId: string | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  activePortfolio: Portfolio | null;
  activeWallets: Wallet[];
  activeSnapshots: DailySnapshot[];
  activeMonthlySnapshots: MonthlySnapshot[];
  activeGoals: Goal[];
  activeJournalEntries: JournalEntry[];

  // Actions
  initialize: () => Promise<void>;
  setActivePortfolio: (id: string | null) => void;

  // Portfolio actions
  createPortfolio: (name: string, color: string) => Promise<Portfolio>;
  updatePortfolio: (id: string, changes: Partial<Portfolio>) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;

  // Wallet actions
  createWallet: (data: Omit<Wallet, 'id'>) => Promise<Wallet>;
  updateWallet: (id: string, changes: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;

  // Daily Snapshot actions
  createSnapshot: (data: Omit<DailySnapshot, 'id'>) => Promise<DailySnapshot>;
  updateSnapshot: (id: string, changes: Partial<DailySnapshot>) => Promise<void>;
  deleteSnapshot: (id: string) => Promise<void>;

  // Monthly Snapshot actions
  createMonthlySnapshot: (data: Omit<MonthlySnapshot, 'id'>) => Promise<MonthlySnapshot>;
  updateMonthlySnapshot: (id: string, changes: Partial<MonthlySnapshot>) => Promise<void>;
  deleteMonthlySnapshot: (id: string) => Promise<void>;

  // Goal actions
  createGoal: (data: Omit<Goal, 'id' | 'createdAt'>) => Promise<Goal>;
  updateGoal: (id: string, changes: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;

  // Journal actions
  createJournalEntry: (data: Omit<JournalEntry, 'id' | 'createdAt'>) => Promise<JournalEntry>;
  updateJournalEntry: (id: string, changes: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // Market Event actions
  createMarketEvent: (data: Omit<MarketEvent, 'id' | 'createdAt'>) => Promise<MarketEvent>;
  updateMarketEvent: (id: string, changes: Partial<MarketEvent>) => Promise<void>;
  deleteMarketEvent: (id: string) => Promise<void>;

  // Settings actions
  updateSettings: (changes: Partial<Settings>) => Promise<void>;

  // Refresh data
  refreshData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  portfolios: [],
  wallets: [],
  snapshots: [],
  monthlySnapshots: [],
  goals: [],
  journalEntries: [],
  marketEvents: [],
  settings: null,
  activePortfolioId: null,
  isLoading: true,
  error: null,

  // Computed getters
  get activePortfolio() {
    const { portfolios, activePortfolioId } = get();
    return portfolios.find(p => p.id === activePortfolioId) ?? null;
  },

  get activeWallets() {
    const { wallets, activePortfolioId } = get();
    if (!activePortfolioId) return [];
    return wallets.filter(w => w.portfolioId === activePortfolioId);
  },

  get activeSnapshots() {
    const { snapshots, activePortfolioId } = get();
    if (!activePortfolioId) return [];
    return snapshots.filter(s => s.portfolioId === activePortfolioId);
  },

  get activeMonthlySnapshots() {
    const { monthlySnapshots, activePortfolioId } = get();
    if (!activePortfolioId) return [];
    return monthlySnapshots.filter(s => s.portfolioId === activePortfolioId);
  },

  get activeGoals() {
    const { goals, activePortfolioId } = get();
    if (!activePortfolioId) return [];
    return goals.filter(g => g.portfolioId === activePortfolioId);
  },

  get activeJournalEntries() {
    const { journalEntries, activePortfolioId } = get();
    if (!activePortfolioId) return [];
    return journalEntries.filter(e => e.portfolioId === activePortfolioId);
  },

  // Initialize app
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      await initializeDatabase();

      const [portfolios, wallets, settings, goals, journalEntries, marketEvents] = await Promise.all([
        portfolioService.getAll(),
        walletService.getAll(),
        settingsService.get(),
        goalService.getAll(),
        journalService.getAll(),
        marketEventService.getAll()
      ]);

      // Get all daily snapshots
      const allSnapshots: DailySnapshot[] = [];
      const allMonthlySnapshots: MonthlySnapshot[] = [];

      for (const portfolio of portfolios) {
        const pSnapshots = await snapshotService.getDailySnapshots(portfolio.id);
        allSnapshots.push(...pSnapshots);

        const mSnapshots = await snapshotService.getMonthlySnapshots(portfolio.id);
        allMonthlySnapshots.push(...mSnapshots);
      }

      // Set active portfolio to first one if exists
      const activePortfolioId = portfolios.length > 0 ? portfolios[0].id : null;

      set({
        portfolios,
        wallets,
        snapshots: allSnapshots,
        monthlySnapshots: allMonthlySnapshots,
        goals,
        journalEntries,
        marketEvents,
        settings: settings ?? null,
        activePortfolioId,
        isLoading: false
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setActivePortfolio: (id) => {
    set({ activePortfolioId: id });
  },

  // Portfolio actions
  createPortfolio: async (name, color) => {
    const portfolio: Portfolio = {
      id: uuidv4(),
      name,
      color,
      createdAt: new Date()
    };

    await portfolioService.create(portfolio);

    set(state => ({
      portfolios: [...state.portfolios, portfolio],
      activePortfolioId: state.activePortfolioId ?? portfolio.id
    }));

    return portfolio;
  },

  updatePortfolio: async (id, changes) => {
    await portfolioService.update(id, changes);

    set(state => ({
      portfolios: state.portfolios.map(p =>
        p.id === id ? { ...p, ...changes } : p
      )
    }));
  },

  deletePortfolio: async (id) => {
    await portfolioService.delete(id);

    set(state => {
      const newPortfolios = state.portfolios.filter(p => p.id !== id);
      const newWallets = state.wallets.filter(w => w.portfolioId !== id);
      const newSnapshots = state.snapshots.filter(s => s.portfolioId !== id);
      const newMonthlySnapshots = state.monthlySnapshots.filter(s => s.portfolioId !== id);
      const newGoals = state.goals.filter(g => g.portfolioId !== id);
      const newJournalEntries = state.journalEntries.filter(e => e.portfolioId !== id);

      return {
        portfolios: newPortfolios,
        wallets: newWallets,
        snapshots: newSnapshots,
        monthlySnapshots: newMonthlySnapshots,
        goals: newGoals,
        journalEntries: newJournalEntries,
        activePortfolioId: state.activePortfolioId === id
          ? (newPortfolios[0]?.id ?? null)
          : state.activePortfolioId
      };
    });
  },

  // Wallet actions
  createWallet: async (data) => {
    const wallet: Wallet = {
      ...data,
      id: uuidv4()
    };

    await walletService.create(wallet);

    set(state => ({
      wallets: [...state.wallets, wallet]
    }));

    return wallet;
  },

  updateWallet: async (id, changes) => {
    await walletService.update(id, changes);

    set(state => ({
      wallets: state.wallets.map(w =>
        w.id === id ? { ...w, ...changes } : w
      )
    }));
  },

  deleteWallet: async (id) => {
    await walletService.delete(id);

    set(state => ({
      wallets: state.wallets.filter(w => w.id !== id)
    }));
  },

  // Daily Snapshot actions
  createSnapshot: async (data) => {
    const snapshot: DailySnapshot = {
      ...data,
      id: uuidv4()
    };

    await snapshotService.createDailySnapshot(snapshot);

    set(state => {
      // Remove existing snapshot for same date if exists
      const filtered = state.snapshots.filter(
        s => !(s.portfolioId === snapshot.portfolioId && s.date === snapshot.date)
      );
      return {
        snapshots: [...filtered, snapshot]
      };
    });

    return snapshot;
  },

  updateSnapshot: async (id, changes) => {
    await snapshotService.updateDailySnapshot(id, changes);

    set(state => ({
      snapshots: state.snapshots.map(s =>
        s.id === id ? { ...s, ...changes } : s
      )
    }));
  },

  deleteSnapshot: async (id) => {
    await snapshotService.deleteDailySnapshot(id);

    set(state => ({
      snapshots: state.snapshots.filter(s => s.id !== id)
    }));
  },

  // Monthly Snapshot actions
  createMonthlySnapshot: async (data) => {
    const snapshot: MonthlySnapshot = {
      ...data,
      id: uuidv4()
    };

    await snapshotService.createMonthlySnapshot(snapshot);

    set(state => {
      // Remove existing snapshot for same month if exists
      const filtered = state.monthlySnapshots.filter(
        s => !(s.portfolioId === snapshot.portfolioId && s.month === snapshot.month)
      );
      return {
        monthlySnapshots: [...filtered, snapshot]
      };
    });

    return snapshot;
  },

  updateMonthlySnapshot: async (id, changes) => {
    await snapshotService.updateMonthlySnapshot(id, changes);

    set(state => ({
      monthlySnapshots: state.monthlySnapshots.map(s =>
        s.id === id ? { ...s, ...changes } : s
      )
    }));
  },

  deleteMonthlySnapshot: async (id) => {
    await snapshotService.deleteMonthlySnapshot(id);

    set(state => ({
      monthlySnapshots: state.monthlySnapshots.filter(s => s.id !== id)
    }));
  },

  // Goal actions
  createGoal: async (data) => {
    const goal: Goal = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    await goalService.create(goal);

    set(state => ({
      goals: [...state.goals, goal]
    }));

    return goal;
  },

  updateGoal: async (id, changes) => {
    await goalService.update(id, changes);

    set(state => ({
      goals: state.goals.map(g =>
        g.id === id ? { ...g, ...changes } : g
      )
    }));
  },

  deleteGoal: async (id) => {
    await goalService.delete(id);

    set(state => ({
      goals: state.goals.filter(g => g.id !== id)
    }));
  },

  completeGoal: async (id) => {
    const completedAt = new Date().toISOString();
    await goalService.markCompleted(id);

    set(state => ({
      goals: state.goals.map(g =>
        g.id === id ? { ...g, completedAt } : g
      )
    }));
  },

  // Journal actions
  createJournalEntry: async (data) => {
    const entry: JournalEntry = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    await journalService.create(entry);

    set(state => ({
      journalEntries: [...state.journalEntries, entry]
    }));

    return entry;
  },

  updateJournalEntry: async (id, changes) => {
    await journalService.update(id, changes);

    set(state => ({
      journalEntries: state.journalEntries.map(e =>
        e.id === id ? { ...e, ...changes, updatedAt: new Date().toISOString() } : e
      )
    }));
  },

  deleteJournalEntry: async (id) => {
    await journalService.delete(id);

    set(state => ({
      journalEntries: state.journalEntries.filter(e => e.id !== id)
    }));
  },

  // Market Event actions
  createMarketEvent: async (data) => {
    const event: MarketEvent = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    await marketEventService.create(event);

    set(state => ({
      marketEvents: [...state.marketEvents, event]
    }));

    return event;
  },

  updateMarketEvent: async (id, changes) => {
    await marketEventService.update(id, changes);

    set(state => ({
      marketEvents: state.marketEvents.map(e =>
        e.id === id ? { ...e, ...changes } : e
      )
    }));
  },

  deleteMarketEvent: async (id) => {
    await marketEventService.delete(id);

    set(state => ({
      marketEvents: state.marketEvents.filter(e => e.id !== id)
    }));
  },

  // Settings actions
  updateSettings: async (changes) => {
    await settingsService.update(changes);

    set(state => ({
      settings: state.settings ? { ...state.settings, ...changes } : null
    }));
  },

  // Refresh all data
  refreshData: async () => {
    const { initialize } = get();
    await initialize();
  }
}));
