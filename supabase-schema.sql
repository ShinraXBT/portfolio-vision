-- Portfolio Vision - Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Portfolios table
CREATE TABLE portfolios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#a855f7',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets table
CREATE TABLE wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  chain TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily snapshots table
CREATE TABLE daily_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  wallet_balances JSONB NOT NULL DEFAULT '[]',
  total_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
  variation_percent DECIMAL(10, 4) DEFAULT 0,
  variation_usd DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, date)
);

-- Monthly snapshots table
CREATE TABLE monthly_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- Format: "YYYY-MM"
  year INTEGER NOT NULL,
  total_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
  delta_usd DECIMAL(20, 2) DEFAULT 0,
  delta_percent DECIMAL(10, 4) DEFAULT 0,
  btc_price DECIMAL(20, 2) DEFAULT 0,
  eth_price DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, month)
);

-- Goals table
CREATE TABLE goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_value DECIMAL(20, 2) NOT NULL,
  deadline DATE,
  color TEXT NOT NULL DEFAULT '#a855f7',
  icon TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('bullish', 'bearish', 'neutral')),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Market events table
CREATE TABLE market_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('news', 'halving', 'crash', 'ath', 'regulation', 'hack', 'launch', 'other')),
  impact TEXT NOT NULL CHECK (impact IN ('positive', 'negative', 'neutral')),
  coins TEXT[],
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_wallets_portfolio_id ON wallets(portfolio_id);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_daily_snapshots_portfolio_id ON daily_snapshots(portfolio_id);
CREATE INDEX idx_daily_snapshots_date ON daily_snapshots(date);
CREATE INDEX idx_monthly_snapshots_portfolio_id ON monthly_snapshots(portfolio_id);
CREATE INDEX idx_monthly_snapshots_year ON monthly_snapshots(year);
CREATE INDEX idx_goals_portfolio_id ON goals(portfolio_id);
CREATE INDEX idx_journal_entries_portfolio_id ON journal_entries(portfolio_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(date);
CREATE INDEX idx_market_events_date ON market_events(date);
CREATE INDEX idx_market_events_type ON market_events(type);

-- Row Level Security (RLS) Policies
-- Users can only see their own data

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;

-- Portfolios policies
CREATE POLICY "Users can view their own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- Wallets policies
CREATE POLICY "Users can view their own wallets"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallets"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets"
  ON wallets FOR DELETE
  USING (auth.uid() = user_id);

-- Daily snapshots policies
CREATE POLICY "Users can view their own daily snapshots"
  ON daily_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily snapshots"
  ON daily_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily snapshots"
  ON daily_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily snapshots"
  ON daily_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- Monthly snapshots policies
CREATE POLICY "Users can view their own monthly snapshots"
  ON monthly_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monthly snapshots"
  ON monthly_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly snapshots"
  ON monthly_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly snapshots"
  ON monthly_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can view their own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Market events policies
CREATE POLICY "Users can view their own market events"
  ON market_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own market events"
  ON market_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own market events"
  ON market_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own market events"
  ON market_events FOR DELETE
  USING (auth.uid() = user_id);
