import { useState, useRef, useEffect } from 'react';
import { Download, Upload, Trash2, Database, AlertTriangle, Cloud, Copy, Check, Clock } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { GlassCard, Button, ConfirmModal } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import { exportService as dbExportService } from '../services/export';
import { exportService } from '../services/db';
import { parseCSV, parseJSON, validateImportedSnapshots } from '../utils/importParser';

export function Settings() {
  const { activePortfolioId, activePortfolio, wallets, refreshData } = useAppStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeWallets = wallets.filter(w => w.portfolioId === activePortfolioId);

  // Load last backup timestamp from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('portfolio-vision-last-backup');
    if (saved) setLastBackup(saved);
  }, []);

  // Save backup timestamp
  const saveBackupTimestamp = () => {
    const now = new Date().toISOString();
    localStorage.setItem('portfolio-vision-last-backup', now);
    setLastBackup(now);
  };

  // Export handlers
  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      await dbExportService.downloadAllAsJSON();
      saveBackupTimestamp();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy backup to clipboard
  const handleCopyBackup = async () => {
    try {
      const data = await exportService.exportAll();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      saveBackupTimestamp();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Open Google Drive
  const openGoogleDrive = () => {
    window.open('https://drive.google.com/drive/my-drive', '_blank');
  };

  // Open Dropbox
  const openDropbox = () => {
    window.open('https://www.dropbox.com/home', '_blank');
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
              variant="secondary"
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
              variant="secondary"
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

      {/* Cloud Backup Section */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Cloud Backup</h3>
            <p className="text-sm text-white/50">Sync your data to the cloud</p>
          </div>
        </div>

        {/* Last Backup Info */}
        {lastBackup && (
          <div className="glass-subtle p-3 rounded-xl mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/50" />
            <span className="text-sm text-white/70">
              Last backup: {new Date(lastBackup).toLocaleString()}
            </span>
          </div>
        )}

        <div className="space-y-3">
          {/* Copy to Clipboard */}
          <div className="flex items-center justify-between glass-subtle p-4 rounded-xl">
            <div>
              <p className="font-medium text-white">Copy Backup to Clipboard</p>
              <p className="text-sm text-white/50">Copy JSON data to paste anywhere</p>
            </div>
            <Button
              variant="secondary"
              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyBackup}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          {/* Google Drive */}
          <div className="flex items-center justify-between glass-subtle p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M7.71 3.5L1.15 15l3.45 6h13.8l3.45-6L15.29 3.5H7.71z" fill="#4285f4"/>
                  <path d="M15.29 3.5L7.71 3.5l6.57 11.5h9l-3.45-6L15.29 3.5z" fill="#0066da"/>
                  <path d="M1.15 15l3.45 6h9l-6.57-11.5L1.15 15z" fill="#00ac47"/>
                  <path d="M14.28 15l-6.57-11.5L1.15 15h13.13z" fill="#00832d"/>
                  <path d="M22.85 15l-3.45-6-6.57 11.5h9l.02-5.5z" fill="#2684fc"/>
                  <path d="M7.71 3.5l6.57 11.5H4.6l3.11-11.5z" fill="#ffba00"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Google Drive</p>
                <p className="text-sm text-white/50">Open Drive to upload your backup</p>
              </div>
            </div>
            <Button variant="secondary" onClick={openGoogleDrive}>
              Open
            </Button>
          </div>

          {/* Dropbox */}
          <div className="flex items-center justify-between glass-subtle p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#0061ff">
                  <path d="M6 2l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4zM18 2l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4zM12 10l6 4-6 4-6-4 6-4z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Dropbox</p>
                <p className="text-sm text-white/50">Open Dropbox to upload your backup</p>
              </div>
            </div>
            <Button variant="secondary" onClick={openDropbox}>
              Open
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300">
            <strong>How to backup:</strong> Export your data as JSON, then upload the file to Google Drive or Dropbox for cloud storage. To restore, download the file and import it.
          </p>
        </div>
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
