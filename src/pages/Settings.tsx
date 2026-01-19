import { useState, useRef } from 'react';
import { Download, Upload, Trash2, Database, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, ConfirmModal } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import { exportService as dbExportService } from '../services/export';
import { exportService } from '../services/db';
import { parseCSV, parseJSON, validateImportedSnapshots } from '../utils/importParser';
import { v4 as uuidv4 } from 'uuid';

export function Settings() {
  const { activePortfolioId, activePortfolio, wallets, refreshData } = useAppStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeWallets = wallets.filter(w => w.portfolioId === activePortfolioId);

  // Export handlers
  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      await dbExportService.downloadAllAsJSON();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!activePortfolioId || !activePortfolio) return;

    setIsExporting(true);
    try {
      await dbExportService.downloadPortfolioAsCSV(activePortfolioId, activePortfolio.name);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Import handlers
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);
    setIsImporting(true);

    try {
      const content = await file.text();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        const result = parseJSON(content);

        if (result.type === 'full') {
          await exportService.importData(result.data);
          await refreshData();
          setImportSuccess(`Imported ${result.data.portfolios.length} portfolios, ${result.data.wallets.length} wallets, and ${result.data.snapshots.length} snapshots`);
        } else {
          // Import as snapshots
          const { valid, errors } = validateImportedSnapshots(result.data);
          if (errors.length > 0) {
            setImportError(`Import warnings: ${errors.join(', ')}`);
          }
          setImportSuccess(`Successfully validated ${valid.length} snapshots. Use CSV import for snapshot data.`);
        }
      } else if (fileName.endsWith('.csv')) {
        if (!activePortfolioId) {
          setImportError('Select a portfolio before importing CSV data');
          return;
        }

        const snapshots = parseCSV(content);
        const { valid, errors } = validateImportedSnapshots(snapshots);

        if (errors.length > 0 && valid.length === 0) {
          setImportError(`Import failed: ${errors.join(', ')}`);
          return;
        }

        // Get or create wallets from CSV
        const { createWallet, createSnapshot } = useAppStore.getState();
        const walletMap = new Map<string, string>();

        // Map existing wallets
        activeWallets.forEach(w => {
          walletMap.set(w.name.toLowerCase(), w.id);
        });

        // Create missing wallets
        for (const snapshot of valid) {
          for (const walletName of Object.keys(snapshot.wallets)) {
            if (!walletMap.has(walletName.toLowerCase())) {
              const newWallet = await createWallet({
                portfolioId: activePortfolioId,
                name: walletName,
                color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
              });
              walletMap.set(walletName.toLowerCase(), newWallet.id);
            }
          }
        }

        // Create snapshots
        let importedCount = 0;
        for (const snapshot of valid) {
          const walletBalances = Object.entries(snapshot.wallets).map(([name, value]) => ({
            walletId: walletMap.get(name.toLowerCase())!,
            valueUsd: value
          }));

          const total = walletBalances.reduce((sum, b) => sum + b.valueUsd, 0);

          await createSnapshot({
            portfolioId: activePortfolioId,
            date: snapshot.date,
            walletBalances,
            totalUsd: total,
            variationPercent: 0,
            variationUsd: 0
          });
          importedCount++;
        }

        setImportSuccess(`Successfully imported ${importedCount} snapshots${errors.length > 0 ? ` (${errors.length} warnings)` : ''}`);
      } else {
        setImportError('Unsupported file format. Please use .json or .csv files.');
      }
    } catch (error) {
      setImportError(`Import failed: ${(error as Error).message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear all data
  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await exportService.clearAll();
      await refreshData();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        subtitle="Manage your data and preferences"
      />

      {/* Export Section */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Export Data</h3>
            <p className="text-sm text-white/50">Download your portfolio data</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between glass-subtle p-4 rounded-xl">
            <div>
              <p className="font-medium text-white">Full Backup (JSON)</p>
              <p className="text-sm text-white/50">All portfolios, wallets, and snapshots</p>
            </div>
            <Button
              variant="glass"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportJSON}
              loading={isExporting}
            >
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between glass-subtle p-4 rounded-xl">
            <div>
              <p className="font-medium text-white">Current Portfolio (CSV)</p>
              <p className="text-sm text-white/50">
                {activePortfolio ? activePortfolio.name : 'No portfolio selected'}
              </p>
            </div>
            <Button
              variant="glass"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
              loading={isExporting}
              disabled={!activePortfolioId}
            >
              Export
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Import Section */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Upload className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Import Data</h3>
            <p className="text-sm text-white/50">Restore from backup or import CSV</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="glass-subtle p-4 rounded-xl mb-4">
          <p className="text-sm text-white/70 mb-3">Supported formats:</p>
          <ul className="text-sm text-white/50 space-y-1">
            <li>• <strong className="text-white/70">JSON</strong>: Full backup restore (portfolios, wallets, snapshots)</li>
            <li>• <strong className="text-white/70">CSV</strong>: Import snapshots with columns: Date, Wallet1, Wallet2, ...</li>
          </ul>
        </div>

        <Button
          variant="primary"
          icon={<Upload className="w-4 h-4" />}
          onClick={handleImportClick}
          loading={isImporting}
          fullWidth
        >
          Select File to Import
        </Button>

        {importError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-sm text-red-400">{importError}</p>
          </div>
        )}

        {importSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30">
            <p className="text-sm text-green-400">{importSuccess}</p>
          </div>
        )}
      </GlassCard>

      {/* Data Management */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Data Storage</h3>
            <p className="text-sm text-white/50">Your data is stored locally in IndexedDB</p>
          </div>
        </div>

        <div className="glass-subtle p-4 rounded-xl mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white/70">
                All your data is stored locally in your browser. Clearing your browser data will delete your portfolios.
                Make sure to export backups regularly.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="danger"
          icon={<Trash2 className="w-4 h-4" />}
          onClick={() => setShowClearConfirm(true)}
        >
          Clear All Data
        </Button>
      </GlassCard>

      {/* About Section */}
      <GlassCard>
        <h3 className="font-semibold text-white mb-4">About Portfolio Vision</h3>
        <div className="space-y-2 text-sm text-white/50">
          <p>Version 1.0.0</p>
          <p>A privacy-first crypto portfolio tracker with 100% local storage.</p>
          <p>Built with React, Tailwind CSS, and IndexedDB.</p>
        </div>
      </GlassCard>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Clear All Data"
        message="This will permanently delete all your portfolios, wallets, and snapshots. This action cannot be undone. Are you sure?"
        confirmText="Clear All"
        variant="danger"
        loading={isClearing}
      />
    </div>
  );
}
