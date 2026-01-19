import { create } from 'zustand';
import { Portfolio, Wallet, DailySnapshot, Settings } from '../types';
import { portfolioService, walletService, snapshotService, settingsService, initializeDatabase } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  // Data
  portfolios: Portfolio[];
  wallets: Wallet[];
  snapshots: DailySnapshot[];
  settings: Settings | null;

  // UI State
  activePortfolioId: string | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  activePortfolio: Portfolio | null;
  activeWallets: Wallet[];
  activeSnapshots: DailySnapshot[];

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

  // Snapshot actions
  createSnapshot: (data: Omit<DailySnapshot, 'id'>) => Promise<DailySnapshot>;
  updateSnapshot: (id: string, changes: Partial<DailySnapshot>) => Promise<void>;
  deleteSnapshot: (id: string) => Promise<void>;

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

  // Initialize app
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      await initializeDatabase();

      const [portfolios, wallets, snapshots, settings] = await Promise.all([
        portfolioService.getAll(),
        walletService.getAll(),
        snapshotService.getDailySnapshots(''),
        settingsService.get()
      ]);

      // Get all snapshots
      const allSnapshots: DailySnapshot[] = [];
      for (const portfolio of portfolios) {
        const pSnapshots = await snapshotService.getDailySnapshots(portfolio.id);
        allSnapshots.push(...pSnapshots);
      }

      // Set active portfolio to first one if exists
      const activePortfolioId = portfolios.length > 0 ? portfolios[0].id : null;

      set({
        portfolios,
        wallets,
        snapshots: allSnapshots,
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

      return {
        portfolios: newPortfolios,
        wallets: newWallets,
        snapshots: newSnapshots,
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

  // Snapshot actions
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
