export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          name: string
          address: string | null
          chain: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id: string
          name: string
          address?: string | null
          chain?: string | null
          color: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string
          name?: string
          address?: string | null
          chain?: string | null
          color?: string
          created_at?: string
        }
      }
      daily_snapshots: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          date: string
          wallet_balances: Json
          total_usd: number
          variation_percent: number
          variation_usd: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id: string
          date: string
          wallet_balances: Json
          total_usd: number
          variation_percent?: number
          variation_usd?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string
          date?: string
          wallet_balances?: Json
          total_usd?: number
          variation_percent?: number
          variation_usd?: number
          created_at?: string
        }
      }
      monthly_snapshots: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          month: string
          year: number
          total_usd: number
          delta_usd: number
          delta_percent: number
          btc_price: number
          eth_price: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id: string
          month: string
          year: number
          total_usd: number
          delta_usd?: number
          delta_percent?: number
          btc_price?: number
          eth_price?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string
          month?: string
          year?: number
          total_usd?: number
          delta_usd?: number
          delta_percent?: number
          btc_price?: number
          eth_price?: number
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          name: string
          target_value: number
          deadline: string | null
          color: string
          icon: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id: string
          name: string
          target_value: number
          deadline?: string | null
          color: string
          icon?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string
          name?: string
          target_value?: number
          deadline?: string | null
          color?: string
          icon?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          date: string
          title: string
          content: string
          mood: string | null
          tags: string[] | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id: string
          date: string
          title: string
          content: string
          mood?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string
          date?: string
          title?: string
          content?: string
          mood?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
      }
      market_events: {
        Row: {
          id: string
          user_id: string
          date: string
          title: string
          description: string | null
          type: string
          impact: string
          coins: string[] | null
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          title: string
          description?: string | null
          type: string
          impact: string
          coins?: string[] | null
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          title?: string
          description?: string | null
          type?: string
          impact?: string
          coins?: string[] | null
          source?: string | null
          created_at?: string
        }
      }
    }
  }
}
