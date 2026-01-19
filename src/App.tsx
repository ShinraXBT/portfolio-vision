import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard, DailyView, MonthlyView, Goals, Journal, MarketEvents, WalletManager, Portfolios, Settings, Auth } from './pages';
import { useAppStore } from './stores/appStore';
import { useAuthStore } from './stores/authStore';
import { isSupabaseConfigured } from './services/supabase';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isConfigured } = useAuthStore();

  // If Supabase is not configured, allow access (local mode)
  if (!isConfigured) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="h-screen mesh-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-white/50">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { initialize, isLoading: appLoading } = useAppStore();
  const { initialize: initAuth, isLoading: authLoading, user, isConfigured } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  // Initialize auth first
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Then initialize app data based on auth state
  useEffect(() => {
    if (authLoading) return;

    // If Supabase is configured and user is logged in, use cloud storage
    // Otherwise, use local storage
    const useCloud = isConfigured && !!user;
    initialize(useCloud).then(() => setInitialized(true));
  }, [authLoading, user, isConfigured, initialize]);

  if (authLoading || !initialized || appLoading) {
    return (
      <div className="h-screen mesh-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-white/50">Loading Portfolio Vision...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth route - accessible without login */}
        <Route path="/auth" element={
          isConfigured && user ? <Navigate to="/" replace /> : <Auth />
        } />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/daily" element={
          <ProtectedRoute>
            <Layout><DailyView /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/monthly" element={
          <ProtectedRoute>
            <Layout><MonthlyView /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/goals" element={
          <ProtectedRoute>
            <Layout><Goals /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/journal" element={
          <ProtectedRoute>
            <Layout><Journal /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute>
            <Layout><MarketEvents /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/wallets" element={
          <ProtectedRoute>
            <Layout><WalletManager /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/portfolios" element={
          <ProtectedRoute>
            <Layout><Portfolios /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
