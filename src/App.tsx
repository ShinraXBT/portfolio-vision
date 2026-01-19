import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard, DailyView, MonthlyView, WalletManager, Portfolios, Settings } from './pages';
import { useAppStore } from './stores/appStore';

function App() {
  const { initialize, isLoading } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
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
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily" element={<DailyView />} />
          <Route path="/monthly" element={<MonthlyView />} />
          <Route path="/wallets" element={<WalletManager />} />
          <Route path="/portfolios" element={<Portfolios />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
