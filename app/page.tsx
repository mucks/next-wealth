'use client';

import { useState, useEffect } from 'react';
import { Portfolio, Asset } from '@/types/assets';
import { WealthOverview } from '@/components/WealthOverview';
import { AssetList } from '@/components/AssetList';
import { AddAssetModal } from '@/components/AddAssetModal';
import { AuthModal } from '@/components/AuthModal';
import { DeleteAllModal } from '@/components/DeleteAllModal';
import { Toast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useTheme } from '@/hooks/useTheme';
import { createClient } from '@/lib/supabase/client';
import { fetchUserPortfolio, createAsset as createAssetInDb, updateAsset, deleteAsset } from '@/lib/db/assets';
import type { User } from '@supabase/supabase-js';

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
      if (!file) return;

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

        for (const asset of allAssets) {
          try {
            // Generate a new unique ID for this asset
            const baseAsset = {
              ...asset,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              // Fill in defaults for missing fields
              name: asset.name || (asset.type === 'crypto' ? asset.symbol : asset.type === 'stock' ? asset.symbol : asset.type === 'cash' ? `${asset.currency} Cash` : asset.city || 'Property'),
              purchaseDate: asset.purchaseDate || new Date().toISOString().split('T')[0],
              notes: asset.notes || '',
            };

            // Add type-specific defaults
            let newAsset: any = baseAsset;

            if (asset.type === 'crypto' || asset.type === 'stock') {
              newAsset = {
                ...baseAsset,
                currentPrice: asset.currentPrice || 0,
                priceChange24h: asset.priceChange24h || 0,
              };
            } else if (asset.type === 'real-estate') {
              newAsset = {
                ...baseAsset,
                address: asset.address || '',
                pricePerSqm: asset.pricePerSqm || 0,
              };
            }

            // Small delay to ensure unique timestamps
            await new Promise(resolve => setTimeout(resolve, 1));

            await createAssetInDb(newAsset);
            successCount++;
          } catch (error) {
            console.error('Error importing asset:', asset.name || asset.symbol || asset.city, error);
            errorCount++;
          }
        }

        await loadPortfolio();

        if (errorCount > 0) {
          setToast({ message: `Imported ${successCount} assets, ${errorCount} failed`, type: 'info' });
        } else {
          setToast({ message: `Successfully imported ${successCount} assets!`, type: 'success' });
        }
      } catch (error) {
        console.error('Error importing file:', error);
        setToast({ message: 'Failed to import file. Please check the file format.', type: 'error' });
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
