import { supabase } from './supabase';
import { Portfolio, Wallet, DailySnapshot, MonthlySnapshot, Goal, JournalEntry, MarketEvent, WalletBalance } from '../types';

// Helper to get current user ID
const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
};

// Portfolio operations
export const portfolioService = {
  async getAll(): Promise<Portfolio[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      createdAt: new Date(p.created_at)
    }));
  },

  async create(portfolio: Omit<Portfolio, 'id' | 'createdAt'>): Promise<Portfolio> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: portfolio.name,
        color: portfolio.color
      })
      .select()
      .single();

    if (error) throw error;
    const p = data as any;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      createdAt: new Date(p.created_at)
    };
  },

  async update(id: string, changes: Partial<Portfolio>): Promise<void> {
    const { error } = await supabase
      .from('portfolios')
      .update({
        name: changes.name,
        color: changes.color
      })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Wallet operations
export const walletService = {
  async getAll(): Promise<Wallet[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((w: any) => ({
      id: w.id,
      portfolioId: w.portfolio_id,
      name: w.name,
      address: w.address || undefined,
      chain: w.chain || undefined,
      color: w.color
    }));
  },

  async create(wallet: Omit<Wallet, 'id'>): Promise<Wallet> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        portfolio_id: wallet.portfolioId,
        name: wallet.name,
        address: wallet.address || null,
        chain: wallet.chain || null,
        color: wallet.color
      })
      .select()
      .single();

    if (error) throw error;
    const w = data as any;
    return {
      id: w.id,
      portfolioId: w.portfolio_id,
      name: w.name,
      address: w.address || undefined,
      chain: w.chain || undefined,
      color: w.color
    };
  },

  async update(id: string, changes: Partial<Wallet>): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({
        name: changes.name,
        address: changes.address,
        chain: changes.chain,
        color: changes.color
      })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Daily Snapshot operations
export const snapshotService = {
  async getDailySnapshots(portfolioId: string): Promise<DailySnapshot[]> {
    const { data, error } = await supabase
      .from('daily_snapshots')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []).map((s: any) => ({
      id: s.id,
      portfolioId: s.portfolio_id,
      date: s.date,
      walletBalances: s.wallet_balances as WalletBalance[],
      totalUsd: Number(s.total_usd),
      variationPercent: Number(s.variation_percent),
      variationUsd: Number(s.variation_usd)
    }));
  },

  async createDailySnapshot(snapshot: Omit<DailySnapshot, 'id'>): Promise<DailySnapshot> {
    const userId = await getUserId();

    // Check if snapshot exists for this date
    const { data: existing } = await supabase
      .from('daily_snapshots')
      .select('id')
      .eq('portfolio_id', snapshot.portfolioId)
      .eq('date', snapshot.date)
      .single();

    if (existing) {
      // Update existing snapshot
      const { data, error } = await supabase
        .from('daily_snapshots')
        .update({
          wallet_balances: snapshot.walletBalances,
          total_usd: snapshot.totalUsd,
          variation_percent: snapshot.variationPercent,
          variation_usd: snapshot.variationUsd
        })
        .eq('id', (existing as any).id)
        .select()
        .single();

      if (error) throw error;
      const s = data as any;
      return {
        id: s.id,
        portfolioId: s.portfolio_id,
        date: s.date,
        walletBalances: s.wallet_balances as WalletBalance[],
        totalUsd: Number(s.total_usd),
        variationPercent: Number(s.variation_percent),
        variationUsd: Number(s.variation_usd)
      };
    }

    // Create new snapshot
    const { data, error } = await supabase
      .from('daily_snapshots')
      .insert({
        user_id: userId,
        portfolio_id: snapshot.portfolioId,
        date: snapshot.date,
        wallet_balances: snapshot.walletBalances,
        total_usd: snapshot.totalUsd,
        variation_percent: snapshot.variationPercent,
        variation_usd: snapshot.variationUsd
      })
      .select()
      .single();

    if (error) throw error;
    const s = data as any;
    return {
      id: s.id,
      portfolioId: s.portfolio_id,
      date: s.date,
      walletBalances: s.wallet_balances as WalletBalance[],
      totalUsd: Number(s.total_usd),
      variationPercent: Number(s.variation_percent),
      variationUsd: Number(s.variation_usd)
    };
  },

  async deleteDailySnapshot(id: string): Promise<void> {
    const { error } = await supabase
      .from('daily_snapshots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Monthly Snapshots
  async getMonthlySnapshots(portfolioId: string): Promise<MonthlySnapshot[]> {
    const { data, error } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('month', { ascending: true });

    if (error) throw error;
    return (data || []).map((s: any) => ({
      id: s.id,
      portfolioId: s.portfolio_id,
      month: s.month,
      year: s.year,
      totalUsd: Number(s.total_usd),
      deltaUsd: Number(s.delta_usd),
      deltaPercent: Number(s.delta_percent),
      btcPrice: Number(s.btc_price),
      ethPrice: Number(s.eth_price)
    }));
  },

  async createMonthlySnapshot(snapshot: Omit<MonthlySnapshot, 'id'>): Promise<MonthlySnapshot> {
    const userId = await getUserId();

    // Check if snapshot exists for this month
    const { data: existing } = await supabase
      .from('monthly_snapshots')
      .select('id')
      .eq('portfolio_id', snapshot.portfolioId)
      .eq('month', snapshot.month)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('monthly_snapshots')
        .update({
          total_usd: snapshot.totalUsd,
          delta_usd: snapshot.deltaUsd,
          delta_percent: snapshot.deltaPercent,
          btc_price: snapshot.btcPrice,
          eth_price: snapshot.ethPrice
        })
        .eq('id', (existing as any).id)
        .select()
        .single();

      if (error) throw error;
      const s = data as any;
      return {
        id: s.id,
        portfolioId: s.portfolio_id,
        month: s.month,
        year: s.year,
        totalUsd: Number(s.total_usd),
        deltaUsd: Number(s.delta_usd),
        deltaPercent: Number(s.delta_percent),
        btcPrice: Number(s.btc_price),
        ethPrice: Number(s.eth_price)
      };
    }

    const { data, error } = await supabase
      .from('monthly_snapshots')
      .insert({
        user_id: userId,
        portfolio_id: snapshot.portfolioId,
        month: snapshot.month,
        year: snapshot.year,
        total_usd: snapshot.totalUsd,
        delta_usd: snapshot.deltaUsd,
        delta_percent: snapshot.deltaPercent,
        btc_price: snapshot.btcPrice,
        eth_price: snapshot.ethPrice
      })
      .select()
      .single();

    if (error) throw error;
    const s = data as any;
    return {
      id: s.id,
      portfolioId: s.portfolio_id,
      month: s.month,
      year: s.year,
      totalUsd: Number(s.total_usd),
      deltaUsd: Number(s.delta_usd),
      deltaPercent: Number(s.delta_percent),
      btcPrice: Number(s.btc_price),
      ethPrice: Number(s.eth_price)
    };
  },

  async updateMonthlySnapshot(id: string, changes: Partial<MonthlySnapshot>): Promise<void> {
    const { error } = await supabase
      .from('monthly_snapshots')
      .update({
        total_usd: changes.totalUsd,
        delta_usd: changes.deltaUsd,
        delta_percent: changes.deltaPercent,
        btc_price: changes.btcPrice,
        eth_price: changes.ethPrice
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMonthlySnapshot(id: string): Promise<void> {
    const { error } = await supabase
      .from('monthly_snapshots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Goal operations
export const goalService = {
  async getAll(): Promise<Goal[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((g: any) => ({
      id: g.id,
      portfolioId: g.portfolio_id,
      name: g.name,
      targetValue: Number(g.target_value),
      deadline: g.deadline || undefined,
      color: g.color,
      icon: g.icon || undefined,
      completedAt: g.completed_at || undefined,
      createdAt: g.created_at
    }));
  },

  async create(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        portfolio_id: goal.portfolioId,
        name: goal.name,
        target_value: goal.targetValue,
        deadline: goal.deadline || null,
        color: goal.color,
        icon: goal.icon || null
      })
      .select()
      .single();

    if (error) throw error;
    const g = data as any;
    return {
      id: g.id,
      portfolioId: g.portfolio_id,
      name: g.name,
      targetValue: Number(g.target_value),
      deadline: g.deadline || undefined,
      color: g.color,
      icon: g.icon || undefined,
      createdAt: g.created_at
    };
  },

  async update(id: string, changes: Partial<Goal>): Promise<void> {
    const updateData: any = {};
    if (changes.name !== undefined) updateData.name = changes.name;
    if (changes.targetValue !== undefined) updateData.target_value = changes.targetValue;
    if (changes.deadline !== undefined) updateData.deadline = changes.deadline;
    if (changes.color !== undefined) updateData.color = changes.color;
    if (changes.icon !== undefined) updateData.icon = changes.icon;
    if (changes.completedAt !== undefined) updateData.completed_at = changes.completedAt;

    const { error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Journal operations
export const journalService = {
  async getAll(): Promise<JournalEntry[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map((e: any) => ({
      id: e.id,
      portfolioId: e.portfolio_id,
      date: e.date,
      title: e.title,
      content: e.content,
      mood: e.mood as JournalEntry['mood'],
      tags: e.tags || undefined,
      createdAt: e.created_at,
      updatedAt: e.updated_at || undefined
    }));
  },

  async create(entry: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<JournalEntry> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        portfolio_id: entry.portfolioId,
        date: entry.date,
        title: entry.title,
        content: entry.content,
        mood: entry.mood || null,
        tags: entry.tags || null
      })
      .select()
      .single();

    if (error) throw error;
    const e = data as any;
    return {
      id: e.id,
      portfolioId: e.portfolio_id,
      date: e.date,
      title: e.title,
      content: e.content,
      mood: e.mood as JournalEntry['mood'],
      tags: e.tags || undefined,
      createdAt: e.created_at
    };
  },

  async update(id: string, changes: Partial<JournalEntry>): Promise<void> {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (changes.title !== undefined) updateData.title = changes.title;
    if (changes.content !== undefined) updateData.content = changes.content;
    if (changes.mood !== undefined) updateData.mood = changes.mood;
    if (changes.tags !== undefined) updateData.tags = changes.tags;

    const { error } = await supabase
      .from('journal_entries')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Market Event operations
export const marketEventService = {
  async getAll(): Promise<MarketEvent[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('market_events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map((e: any) => ({
      id: e.id,
      date: e.date,
      title: e.title,
      description: e.description || undefined,
      type: e.type as MarketEvent['type'],
      impact: e.impact as MarketEvent['impact'],
      coins: e.coins || undefined,
      source: e.source || undefined,
      createdAt: e.created_at
    }));
  },

  async create(event: Omit<MarketEvent, 'id' | 'createdAt'>): Promise<MarketEvent> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('market_events')
      .insert({
        user_id: userId,
        date: event.date,
        title: event.title,
        description: event.description || null,
        type: event.type,
        impact: event.impact,
        coins: event.coins || null,
        source: event.source || null
      })
      .select()
      .single();

    if (error) throw error;
    const e = data as any;
    return {
      id: e.id,
      date: e.date,
      title: e.title,
      description: e.description || undefined,
      type: e.type as MarketEvent['type'],
      impact: e.impact as MarketEvent['impact'],
      coins: e.coins || undefined,
      source: e.source || undefined,
      createdAt: e.created_at
    };
  },

  async update(id: string, changes: Partial<MarketEvent>): Promise<void> {
    const updateData: any = {};
    if (changes.date !== undefined) updateData.date = changes.date;
    if (changes.title !== undefined) updateData.title = changes.title;
    if (changes.description !== undefined) updateData.description = changes.description;
    if (changes.type !== undefined) updateData.type = changes.type;
    if (changes.impact !== undefined) updateData.impact = changes.impact;
    if (changes.coins !== undefined) updateData.coins = changes.coins;
    if (changes.source !== undefined) updateData.source = changes.source;

    const { error } = await supabase
      .from('market_events')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('market_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
