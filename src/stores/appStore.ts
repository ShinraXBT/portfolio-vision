import { create } from 'zustand';
import { Portfolio, Wallet, DailySnapshot, MonthlySnapshot, Settings, Goal, JournalEntry, MarketEvent } from '../types';
import { isSupabaseConfigured } from '../services/supabase';
import * as supabaseData from '../services/supabaseData';
import * as localDb from '../services/db';

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
  useCloud: boolean;

  // Computed
  activePortfolio: Portfolio | null;
  activeWallets: Wallet[];
  activeSnapshots: DailySnapshot[];
  activeMonthlySnapshots: MonthlySnapshot[];
  activeGoals: Goal[];
  activeJournalEntries: JournalEntry[];

  // Actions
  initialize: (useCloud?: boolean) => Promise<void>;
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
  useCloud: false,

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
  initialize: async (useCloud = false) => {
    try {
      set({ isLoading: true, error: null, useCloud });

      let portfolios: Portfolio[] = [];
      let wallets: Wallet[] = [];
      let allSnapshots: DailySnapshot[] = [];
      let allMonthlySnapshots: MonthlySnapshot[] = [];
      let goals: Goal[] = [];
      let journalEntries: JournalEntry[] = [];
      let marketEvents: MarketEvent[] = [];

      if (useCloud && isSupabaseConfigured()) {
        // Load from Supabase
        [portfolios, wallets, goals, journalEntries, marketEvents] = await Promise.all([
          supabaseData.portfolioService.getAll(),
          supabaseData.walletService.getAll(),
          supabaseData.goalService.getAll(),
          supabaseData.journalService.getAll(),
          supabaseData.marketEventService.getAll()
        ]);

        // Load snapshots for each portfolio
        for (const portfolio of portfolios) {
          const [dailySnaps, monthlySnaps] = await Promise.all([
            supabaseData.snapshotService.getDailySnapshots(portfolio.id),
            supabaseData.snapshotService.getMonthlySnapshots(portfolio.id)
          ]);
          allSnapshots.push(...dailySnaps);
          allMonthlySnapshots.push(...monthlySnaps);
        }
      } else {
        // Load from local IndexedDB
        await localDb.initializeDatabase();

        [portfolios, wallets, goals, journalEntries, marketEvents] = await Promise.all([
          localDb.portfolioService.getAll(),
          localDb.walletService.getAll(),
          localDb.goalService.getAll(),
          localDb.journalService.getAll(),
          localDb.marketEventService.getAll()
        ]);

        // Load snapshots for each portfolio
        for (const portfolio of portfolios) {
          const [dailySnaps, monthlySnaps] = await Promise.all([
            localDb.snapshotService.getDailySnapshots(portfolio.id),
            localDb.snapshotService.getMonthlySnapshots(portfolio.id)
          ]);
          allSnapshots.push(...dailySnaps);
          allMonthlySnapshots.push(...monthlySnaps);
        }
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
        settings: null,
        activePortfolioId,
        isLoading: false,
        useCloud
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
    const { useCloud } = get();

    let portfolio: Portfolio;

    if (useCloud && isSupabaseConfigured()) {
      portfolio = await supabaseData.portfolioService.create({ name, color });
    } else {
      portfolio = {
        id: crypto.randomUUID(),
        name,
        color,
        createdAt: new Date()
      };
      await localDb.portfolioService.create(portfolio);
    }

    set(state => ({
      portfolios: [...state.portfolios, portfolio],
      activePortfolioId: state.activePortfolioId ?? portfolio.id
    }));

    return portfolio;
  },

  updatePortfolio: async (id, changes) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.portfolioService.update(id, changes);
    } else {
      await localDb.portfolioService.update(id, changes);
    }

    set(state => ({
      portfolios: state.portfolios.map(p =>
        p.id === id ? { ...p, ...changes } : p
      )
    }));
  },

  deletePortfolio: async (id) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.portfolioService.delete(id);
    } else {
      await localDb.portfolioService.delete(id);
    }

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
    const { useCloud } = get();

    let wallet: Wallet;

    if (useCloud && isSupabaseConfigured()) {
      wallet = await supabaseData.walletService.create(data);
    } else {
      wallet = { ...data, id: crypto.randomUUID() };
      await localDb.walletService.create(wallet);
    }

    set(state => ({
      wallets: [...state.wallets, wallet]
    }));

    return wallet;
  },

  updateWallet: async (id, changes) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.walletService.update(id, changes);
    } else {
      await localDb.walletService.update(id, changes);
    }

    set(state => ({
      wallets: state.wallets.map(w =>
        w.id === id ? { ...w, ...changes } : w
      )
    }));
  },

  deleteWallet: async (id) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.walletService.delete(id);
    } else {
      await localDb.walletService.delete(id);
    }

    set(state => ({
      wallets: state.wallets.filter(w => w.id !== id)
    }));
  },

  // Daily Snapshot actions
  createSnapshot: async (data) => {
    const { useCloud } = get();

    let snapshot: DailySnapshot;

    if (useCloud && isSupabaseConfigured()) {
      snapshot = await supabaseData.snapshotService.createDailySnapshot(data);
    } else {
      snapshot = { ...data, id: crypto.randomUUID() };
      await localDb.snapshotService.createDailySnapshot(snapshot);
    }

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
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      // For Supabase, we'd need to add an update method
    } else {
      await localDb.snapshotService.updateDailySnapshot(id, changes);
    }

    set(state => ({
      snapshots: state.snapshots.map(s =>
        s.id === id ? { ...s, ...changes } : s
      )
    }));
  },

  deleteSnapshot: async (id) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.snapshotService.deleteDailySnapshot(id);
    } else {
      await localDb.snapshotService.deleteDailySnapshot(id);
    }

    set(state => ({
      snapshots: state.snapshots.filter(s => s.id !== id)
    }));
  },

  // Monthly Snapshot actions
  createMonthlySnapshot: async (data) => {
    const { useCloud } = get();

    let snapshot: MonthlySnapshot;

    if (useCloud && isSupabaseConfigured()) {
      snapshot = await supabaseData.snapshotService.createMonthlySnapshot(data);
    } else {
      snapshot = { ...data, id: crypto.randomUUID() };
      await localDb.snapshotService.createMonthlySnapshot(snapshot);
    }

    set(state => {
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
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.snapshotService.updateMonthlySnapshot(id, changes);
    } else {
      await localDb.snapshotService.updateMonthlySnapshot(id, changes);
    }

    set(state => ({
      monthlySnapshots: state.monthlySnapshots.map(s =>
        s.id === id ? { ...s, ...changes } : s
      )
    }));
  },

  deleteMonthlySnapshot: async (id) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.snapshotService.deleteMonthlySnapshot(id);
    } else {
      await localDb.snapshotService.deleteMonthlySnapshot(id);
    }

    set(state => ({
      monthlySnapshots: state.monthlySnapshots.filter(s => s.id !== id)
    }));
  },

  // Goal actions
  createGoal: async (data) => {
    const { useCloud } = get();

    let goal: Goal;

    if (useCloud && isSupabaseConfigured()) {
      goal = await supabaseData.goalService.create(data);
    } else {
      goal = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      await localDb.goalService.create(goal);
    }

    set(state => ({
      goals: [...state.goals, goal]
    }));

    return goal;
  },

  updateGoal: async (id, changes) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.goalService.update(id, changes);
    } else {
      await localDb.goalService.update(id, changes);
    }

    set(state => ({
      goals: state.goals.map(g =>
        g.id === id ? { ...g, ...changes } : g
      )
    }));
  },

  deleteGoal: async (id) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.goalService.delete(id);
    } else {
      await localDb.goalService.delete(id);
    }

    set(state => ({
      goals: state.goals.filter(g => g.id !== id)
    }));
  },

  completeGoal: async (id) => {
    const completedAt = new Date().toISOString();
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.goalService.update(id, { completedAt });
    } else {
      await localDb.goalService.markCompleted(id);
    }

    set(state => ({
      goals: state.goals.map(g =>
        g.id === id ? { ...g, completedAt } : g
      )
    }));
  },

  // Journal actions
  createJournalEntry: async (data) => {
    const { useCloud } = get();

    let entry: JournalEntry;

    if (useCloud && isSupabaseConfigured()) {
      entry = await supabaseData.journalService.create(data);
    } else {
      entry = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      await localDb.journalService.create(entry);
    }

    set(state => ({
      journalEntries: [...state.journalEntries, entry]
    }));

    return entry;
  },

  updateJournalEntry: async (id, changes) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.journalService.update(id, changes);
    } else {
      await localDb.journalService.update(id, changes);
    }

    set(state => ({
      journalEntries: state.journalEntries.map(e =>
        e.id === id ? { ...e, ...changes, updatedAt: new Date().toISOString() } : e
      )
    }));
  },

  deleteJournalEntry: async (id) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.journalService.delete(id);
    } else {
      await localDb.journalService.delete(id);
    }

    set(state => ({
      journalEntries: state.journalEntries.filter(e => e.id !== id)
    }));
  },

  // Market Event actions
  createMarketEvent: async (data) => {
    const { useCloud } = get();

    let event: MarketEvent;

    if (useCloud && isSupabaseConfigured()) {
      event = await supabaseData.marketEventService.create(data);
    } else {
      event = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      await localDb.marketEventService.create(event);
    }

    set(state => ({
      marketEvents: [...state.marketEvents, event]
    }));

    return event;
  },

  updateMarketEvent: async (id, changes) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.marketEventService.update(id, changes);
    } else {
      await localDb.marketEventService.update(id, changes);
    }

    set(state => ({
      marketEvents: state.marketEvents.map(e =>
        e.id === id ? { ...e, ...changes } : e
      )
    }));
  },

  deleteMarketEvent: async (id) => {
    const { useCloud } = get();

    if (useCloud && isSupabaseConfigured()) {
      await supabaseData.marketEventService.delete(id);
    } else {
      await localDb.marketEventService.delete(id);
    }

    set(state => ({
      marketEvents: state.marketEvents.filter(e => e.id !== id)
    }));
  },

  // Settings actions
  updateSettings: async (changes) => {
    await localDb.settingsService.update(changes);

    set(state => ({
      settings: state.settings ? { ...state.settings, ...changes } : null
    }));
  },

  // Refresh all data
  refreshData: async () => {
    const { initialize, useCloud } = get();
    await initialize(useCloud);
  }
}));
