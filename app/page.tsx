'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering to avoid build-time errors with Supabase
export const dynamic = 'force-dynamic';
import { Portfolio, Asset } from '@/types/assets';
import { WealthOverview } from '@/components/WealthOverview';
import { AssetList } from '@/components/AssetList';
import { AddAssetModal } from '@/components/AddAssetModal';
import { AuthModal } from '@/components/AuthModal';
import { DeleteAllModal } from '@/components/DeleteAllModal';
import { Toast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { WealthTrackingGraph } from '@/components/WealthTrackingGraph';
import { useTheme } from '@/hooks/useTheme';
import { createClient } from '@/lib/supabase/client';
import { fetchUserPortfolio, createAsset as createAssetInDb, updateAsset, deleteAsset } from '@/lib/db/assets';
import type { User } from '@supabase/supabase-js';
import { convertCashAssetsToUSD } from '@/services/currencyService';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    crypto: [],
    stocks: [],
    realEstate: [],
    cash: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'crypto' | 'stocks' | 'real-estate' | 'cash'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [wealthTrackingEnabled, setWealthTrackingEnabled] = useState(false);
  const [lastSnapshotDate, setLastSnapshotDate] = useState<string | null>(null);

  const supabase = createClient();

  // Check auth state and load portfolio
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        loadPortfolio();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        loadPortfolio();
      } else {
        // Clear portfolio when logged out
        setPortfolio({
          crypto: [],
          stocks: [],
          realEstate: [],
          cash: [],
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh prices every 20 seconds
  useEffect(() => {
    if (!user) return;

    const refreshPrices = async () => {
      try {
        setRefreshingPrices(true);
        await fetch('/api/refresh-prices', { method: 'POST' });
        await loadPortfolio(); // Reload portfolio with updated prices
      } catch (error) {
        console.error('Error refreshing prices:', error);
      } finally {
        setRefreshingPrices(false);
      }
    };

    // Initial refresh
    refreshPrices();

    // Set up interval for every 20 seconds
    const intervalId = setInterval(refreshPrices, 20000);

    return () => clearInterval(intervalId);
  }, [user]);

  const loadPortfolio = async () => {
    try {
      const data = await fetchUserPortfolio();
      setPortfolio(data);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  };

  const loadWealthTrackingSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setWealthTrackingEnabled(data.wealthTrackingEnabled);

        // If tracking is enabled, load the last snapshot date
        if (data.wealthTrackingEnabled) {
          const historyResponse = await fetch('/api/wealth-history');
          if (historyResponse.ok) {
            const history = await historyResponse.json();
            if (history.length > 0) {
              // History is ordered by date descending, so first item is the latest
              setLastSnapshotDate(history[0].date);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading wealth tracking settings:', error);
    }
  };

  const toggleWealthTracking = async () => {
    try {
      const newValue = !wealthTrackingEnabled;
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wealthTrackingEnabled: newValue }),
      });

      if (response.ok) {
        setWealthTrackingEnabled(newValue);
        setToast({
          message: `Wealth tracking ${newValue ? 'enabled' : 'disabled'}!`,
          type: 'success',
        });

        // If enabling, create an initial snapshot (with a small delay to ensure setting is saved)
        if (newValue) {
          setTimeout(async () => {
            const success = await createWealthSnapshot();
            if (success) {
              setToast({ message: 'Initial snapshot created!', type: 'success' });
            }
          }, 500);
        }
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error toggling wealth tracking:', error);
      setToast({ message: 'Failed to update wealth tracking setting', type: 'error' });
    }
  };

  const createWealthSnapshot = async () => {
    try {
      // Calculate total values
      const cryptoValue = portfolio.crypto.reduce(
        (sum, asset) => sum + asset.quantity * asset.currentPrice,
        0
      );
      const stocksValue = portfolio.stocks.reduce(
        (sum, asset) => sum + asset.quantity * asset.currentPrice,
        0
      );
      const realEstateValue = portfolio.realEstate.reduce(
        (sum, asset) => sum + asset.squareMeters * asset.pricePerSqm,
        0
      );
      const cashValue = await convertCashAssetsToUSD(
        portfolio.cash.map(asset => ({ amount: asset.amount, currency: asset.currency }))
      );
      const totalValue = cryptoValue + stocksValue + realEstateValue + cashValue;

      const response = await fetch('/api/wealth-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalValue,
          cryptoValue,
          stocksValue,
          realEstateValue,
          cashValue,
        }),
      });

      if (response.ok) {
        const today = new Date().toISOString().split('T')[0];
        setLastSnapshotDate(today);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Snapshot API error:', errorData);
        throw new Error(errorData.error || 'Failed to create snapshot');
      }
    } catch (error) {
      console.error('Error creating wealth snapshot:', error);
      return false;
    }
  };

  // Load wealth tracking settings when user logs in
  useEffect(() => {
    if (user) {
      loadWealthTrackingSettings();
    }
  }, [user]);

  // Auto-create daily snapshot
  useEffect(() => {
    if (!user || !wealthTrackingEnabled) return;

    const checkAndCreateSnapshot = async () => {
      const today = new Date().toISOString().split('T')[0];

      // Only create a snapshot if we haven't created one today
      if (lastSnapshotDate !== today && portfolio.crypto.length + portfolio.stocks.length + portfolio.realEstate.length + portfolio.cash.length > 0) {
        console.log('📸 Creating automatic daily snapshot...');
        const success = await createWealthSnapshot();
        if (success) {
          console.log('✅ Daily snapshot created successfully');
        }
      }
    };

    // Check immediately when user logs in or portfolio changes
    checkAndCreateSnapshot();

    // Also check every hour to catch day changes
    const intervalId = setInterval(checkAndCreateSnapshot, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user, wealthTrackingEnabled, portfolio, lastSnapshotDate]);

  const handleAddAsset = async (asset: Asset) => {
    try {
      await createAssetInDb(asset);
      await loadPortfolio(); // Reload from database
      setToast({ message: 'Asset added successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding asset:', error);
      setToast({ message: 'Failed to add asset. Please try again.', type: 'error' });
    }
  };

  const handleUpdateAsset = async (asset: Asset) => {
    try {
      await updateAsset(asset);
      await loadPortfolio(); // Reload from database
      setToast({ message: 'Asset updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating asset:', error);
      setToast({ message: 'Failed to update asset. Please try again.', type: 'error' });
    }
  };

  const handleDeleteAsset = (id: string, type: Asset['type']) => {
    setConfirmDialog({
      title: 'Delete Asset?',
      message: 'Are you sure you want to delete this asset? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteAsset(id);
          await loadPortfolio();
          setToast({ message: 'Asset deleted successfully!', type: 'success' });
        } catch (error) {
          console.error('Error deleting asset:', error);
          setToast({ message: 'Failed to delete asset. Please try again.', type: 'error' });
        }
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleDeleteAll = async () => {
    try {
      const response = await fetch('/api/assets/delete-all', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assets');
      }

      const result = await response.json();

      // Close modal and reload portfolio
      setIsDeleteAllModalOpen(false);
      await loadPortfolio();

      setToast({ message: `Successfully deleted ${result.count} assets`, type: 'success' });
    } catch (error) {
      console.error('Error deleting all assets:', error);
      setToast({ message: 'Failed to delete assets. Please try again.', type: 'error' });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(portfolio, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wealth-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const importedPortfolio: Portfolio = JSON.parse(text);

        // Validate the structure
        if (!importedPortfolio.crypto || !importedPortfolio.stocks || !importedPortfolio.realEstate || !importedPortfolio.cash) {
          setToast({ message: 'Invalid backup file format', type: 'error' });
          return;
        }

        // Import all assets with NEW IDs to prevent conflicts
        const allAssets = [
          ...importedPortfolio.crypto,
          ...importedPortfolio.stocks,
          ...importedPortfolio.realEstate,
          ...importedPortfolio.cash,
        ];

        let successCount = 0;
        let errorCount = 0;
        const totalAssets = allAssets.length;

        // Show import progress
        setImportProgress({ current: 0, total: totalAssets, status: 'Importing assets...' });

        for (let i = 0; i < allAssets.length; i++) {
          const asset: any = allAssets[i]; // Use any to avoid type narrowing issues

          try {
            // Update progress
            setImportProgress({ current: i + 1, total: totalAssets, status: 'Importing assets...' });

            // Generate a new unique ID for this asset
            const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

            // Build the asset based on type with all required fields
            let newAsset: any = {
              id: newId,
              type: asset.type,
              purchaseDate: asset.purchaseDate || new Date().toISOString().split('T')[0],
              notes: asset.notes || '',
            };

            if (asset.type === 'crypto') {
              newAsset = {
                ...newAsset,
                coinId: asset.coinId || '',
                symbol: asset.symbol || '',
                quantity: asset.quantity || 0,
                name: asset.name || asset.symbol || asset.coinId,
                currentPrice: asset.currentPrice || 0,
                priceChange24h: asset.priceChange24h || 0,
              };
            } else if (asset.type === 'stock') {
              newAsset = {
                ...newAsset,
                symbol: asset.symbol || '',
                quantity: asset.quantity || 0,
                name: asset.name || asset.symbol,
                currentPrice: asset.currentPrice || 0,
                priceChange24h: asset.priceChange24h || 0,
              };
            } else if (asset.type === 'real-estate') {
              newAsset = {
                ...newAsset,
                city: asset.city || '',
                squareMeters: asset.squareMeters || 0,
                propertyType: asset.propertyType || 'apartment',
                name: asset.name || `${asset.city} ${asset.propertyType}`,
                address: asset.address || '',
                pricePerSqm: asset.pricePerSqm || 0,
              };
            } else if (asset.type === 'cash') {
              newAsset = {
                ...newAsset,
                amount: asset.amount || 0,
                currency: asset.currency || 'USD',
                name: asset.name || `${asset.currency} Cash`,
              };
            }

            // Small delay to ensure unique timestamps
            await new Promise(resolve => setTimeout(resolve, 2));

            // Skip price fetching during import for speed (we'll fetch all at once later)
            await createAssetInDb(newAsset, true);
            successCount++;
          } catch (error) {
            let identifier = 'unknown';
            if ('name' in asset && asset.name) identifier = asset.name;
            else if ('symbol' in asset && asset.symbol) identifier = asset.symbol;
            else if ('city' in asset && asset.city) identifier = asset.city;
            console.error('Error importing asset:', identifier, 'Asset data:', asset, 'Error:', error);
            errorCount++;
          }
        }

        // Reload portfolio to show imported assets
        await loadPortfolio();

        // Show price refresh status
        setImportProgress({ current: totalAssets, total: totalAssets, status: 'Updating prices...' });

        // Trigger immediate price refresh for newly imported assets
        try {
          const response = await fetch('/api/refresh-prices', { method: 'POST' });
          if (response.ok) {
            await loadPortfolio(); // Reload again with updated prices
          }
        } catch (error) {
          console.error('Error refreshing prices after import:', error);
        }

        // Hide import progress
        setImportProgress(null);

        if (errorCount > 0) {
          setToast({ message: `Imported ${successCount} assets, ${errorCount} failed`, type: 'info' });
        } else {
          setToast({ message: `Successfully imported ${successCount} assets!`, type: 'success' });
        }
      } catch (error) {
        console.error('Error importing file:', error);
        setImportProgress(null);
        setToast({ message: `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
      }
    };
    input.click();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const allAssets: Asset[] = [...portfolio.crypto, ...portfolio.stocks, ...portfolio.realEstate, ...portfolio.cash];

  const getFilteredAssets = () => {
    if (activeTab === 'all') return allAssets;
    if (activeTab === 'crypto') return portfolio.crypto;
    if (activeTab === 'stocks') return portfolio.stocks;
    if (activeTab === 'real-estate') return portfolio.realEstate;
    if (activeTab === 'cash') return portfolio.cash;
    return allAssets;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth prompt if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Wealth Tracker</h1>
              <p className="text-gray-600 dark:text-gray-300">Track your wealth across crypto, stocks, real estate, and cash</p>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Welcome Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-6">📊</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Wealth Tracker</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              Track your investments across crypto, stocks, real estate, and cash. Create an account to get started.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all hover:shadow-lg"
            >
              Sign In / Sign Up
            </button>
          </div>

          {/* Auth Modal */}
          {isAuthModalOpen && (
            <AuthModal onClose={() => setIsAuthModalOpen(false)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Wealth Tracker</h1>
              {refreshingPrices && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Updating prices...</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Track your wealth across crypto, stocks, real estate, and cash
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Signed in as {user.email} • Prices auto-refresh every 20s
            </p>
          </div>

          {/* Top Right Buttons */}
          <div className="flex gap-2">
            {/* Export Button */}
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2"
              title="Export to JSON"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Import Button */}
            <button
              onClick={handleImport}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center gap-2"
              title="Import from JSON"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Delete All Button */}
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2"
              title="Delete all assets"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Delete All</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Wealth Overview */}
        <WealthOverview portfolio={portfolio} />

        {/* Wealth Tracking Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wealthTrackingEnabled}
                  onChange={toggleWealthTracking}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Track Wealth Over Time
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {wealthTrackingEnabled
                      ? 'Automatically save daily snapshots of your portfolio value'
                      : 'Enable to see your wealth history and trends'}
                  </p>
                </div>
              </label>
            </div>

            {wealthTrackingEnabled && (
              <button
                onClick={async () => {
                  try {
                    const success = await createWealthSnapshot();
                    if (success) {
                      setToast({ message: 'Snapshot created successfully!', type: 'success' });
                    } else {
                      setToast({ message: 'Failed to create snapshot. Check console for details.', type: 'error' });
                    }
                  } catch (error) {
                    console.error('Snapshot button error:', error);
                    setToast({ message: 'Error creating snapshot', type: 'error' });
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take Snapshot Now
              </button>
            )}
          </div>
        </div>

        {/* Wealth Tracking Graph */}
        {wealthTrackingEnabled && (
          <div className="mb-6">
            <WealthTrackingGraph isEnabled={wealthTrackingEnabled} />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-1 flex gap-2 border border-gray-200 dark:border-gray-700">
          {[
            { id: 'all', label: 'All Assets' },
            { id: 'crypto', label: 'Crypto' },
            { id: 'stocks', label: 'Stocks' },
            { id: 'real-estate', label: 'Real Estate' },
            { id: 'cash', label: 'Cash' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${activeTab === tab.id
                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add Asset Button */}
        <div className="mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all hover:shadow-lg"
          >
            + Add Asset
          </button>
        </div>

        {/* Asset List */}
        <AssetList assets={getFilteredAssets()} onDelete={handleDeleteAsset} onEdit={handleEdit} />

        {/* Add/Edit Asset Modal */}
        {isModalOpen && (
          <AddAssetModal
            onClose={handleModalClose}
            onAdd={handleAddAsset}
            onUpdate={handleUpdateAsset}
            editingAsset={editingAsset}
          />
        )}

        {/* Delete All Confirmation Modal */}
        {isDeleteAllModalOpen && (
          <DeleteAllModal
            onConfirm={handleDeleteAll}
            onCancel={() => setIsDeleteAllModalOpen(false)}
            assetCount={allAssets.length}
          />
        )}

        {/* Generic Confirmation Modal */}
        {confirmDialog && (
          <ConfirmModal
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(null)}
            type="danger"
          />
        )}

        {/* Import Progress Modal */}
        {importProgress && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="animate-spin h-12 w-12 mx-auto text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {importProgress.status}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {importProgress.status === 'Updating prices...' ? (
                    <>Please wait, this may take a moment...</>
                  ) : (
                    <>{importProgress.current} of {importProgress.total} assets</>
                  )}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  ></div>
                </div>
                {importProgress.status === 'Importing assets...' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    Creating assets in database...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
