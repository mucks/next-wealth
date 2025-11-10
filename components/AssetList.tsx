import { Asset, CryptoAsset, StockAsset, RealEstateAsset, CashAsset } from '@/types/assets';
import { useState, useEffect } from 'react';
import { convertToUSD } from '@/services/currencyService';

interface AssetListProps {
    assets: Asset[];
    onDelete: (id: string, type: Asset['type']) => void;
    onEdit: (asset: Asset) => void;
}

export function AssetList({ assets, onDelete, onEdit }: AssetListProps) {
    const [cashUSDValues, setCashUSDValues] = useState<{ [key: string]: number }>({});

    // Convert cash values to USD
    useEffect(() => {
        // First, immediately set USD values (no conversion needed)
        const initialValues: { [key: string]: number } = {};
        for (const asset of assets) {
            if (asset.type === 'cash') {
                const cashAsset = asset as CashAsset;
                if (cashAsset.currency === 'USD') {
                    initialValues[asset.id] = cashAsset.amount;
                }
            }
        }
        setCashUSDValues(initialValues);

        // Then convert non-USD currencies
        const convertAllCash = async () => {
            const newValues: { [key: string]: number } = {};

            for (const asset of assets) {
                if (asset.type === 'cash') {
                    const cashAsset = asset as CashAsset;
                    newValues[asset.id] = await convertToUSD(cashAsset.amount, cashAsset.currency);
                }
            }

            setCashUSDValues(newValues);
        };

        convertAllCash();
    }, [assets]);

    const formatCurrency = (value: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const calculateCurrentValue = (asset: Asset) => {
        if (asset.type === 'crypto' || asset.type === 'stock') {
            return asset.quantity * asset.currentPrice;
        }
        if (asset.type === 'real-estate') {
            return asset.squareMeters * asset.pricePerSqm;
        }
        // cash - use converted USD value if available
        return cashUSDValues[asset.id] || (asset as CashAsset).amount;
    };

    const calculateGainLoss = (asset: Asset) => {
        // We don't track gain/loss for any asset type anymore
        return 0;
    };

    const calculateGainLossPercent = (asset: Asset) => {
        if (asset.type === 'crypto') {
            // Show 24h price change for crypto
            return (asset as CryptoAsset).priceChange24h || 0;
        }
        if (asset.type === 'stock') {
            // Show 24h price change for stocks
            return (asset as StockAsset).priceChange24h || 0;
        }
        if (asset.type === 'real-estate') {
            // No gain/loss tracking for real estate
            return 0;
        }
        return 0;
    };

    const getAssetIcon = (type: Asset['type']) => {
        switch (type) {
            case 'crypto':
                return '₿';
            case 'stock':
                return '📈';
            case 'real-estate':
                return '🏠';
            case 'cash':
                return '💵';
        }
    };

    const getAssetColor = (type: Asset['type']) => {
        switch (type) {
            case 'crypto':
                return 'text-orange-600 bg-orange-50';
            case 'stock':
                return 'text-blue-600 bg-blue-50';
            case 'real-estate':
                return 'text-green-600 bg-green-50';
            case 'cash':
                return 'text-emerald-600 bg-emerald-50';
        }
    };

    if (assets.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No assets yet</h3>
                <p className="text-gray-500 dark:text-gray-400">Start tracking your wealth by adding your first asset</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {assets.map((asset) => {
                const currentValue = calculateCurrentValue(asset);
                const gainLoss = calculateGainLoss(asset);
                const gainLossPercent = calculateGainLossPercent(asset);
                const isPositive = gainLoss >= 0;

                return (
                    <div
                        key={asset.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                {/* Icon */}
                                <div className={`${getAssetColor(asset.type)} dark:bg-opacity-20 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold`}>
                                    {getAssetIcon(asset.type)}
                                </div>

                                {/* Asset Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{asset.name}</h3>
                                        {(asset.type === 'crypto' || asset.type === 'stock') && (
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                                {asset.symbol}
                                            </span>
                                        )}
                                    </div>

                                    {asset.type === 'real-estate' && (asset as RealEstateAsset).address && (
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">{(asset as RealEstateAsset).address}</p>
                                    )}

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                        {asset.type === 'crypto' && (
                                            <>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quantity</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{asset.quantity.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Price</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(asset.currentPrice)}</p>
                                                </div>
                                            </>
                                        )}
                                        {asset.type === 'stock' && (
                                            <>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shares</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{asset.quantity.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Price</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(asset.currentPrice)}</p>
                                                </div>
                                            </>
                                        )}
                                        {asset.type === 'real-estate' && (
                                            <>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Property Type</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                                        {(asset as RealEstateAsset).propertyType}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">City</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {(asset as RealEstateAsset).city}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Size</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {(asset as RealEstateAsset).squareMeters} m²
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price per m²</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {formatCurrency((asset as RealEstateAsset).pricePerSqm)}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                        {asset.type === 'cash' && (
                                            <>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {formatCurrency((asset as CashAsset).amount, (asset as CashAsset).currency)}
                                                    </p>
                                                    {(asset as CashAsset).currency !== 'USD' && cashUSDValues[asset.id] && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            ≈ {formatCurrency(cashUSDValues[asset.id], 'USD')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Currency</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {(asset as CashAsset).currency}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {asset.notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic">{asset.notes}</p>
                                    )}
                                </div>
                            </div>

                            {/* Value & Actions */}
                            <div className="flex flex-col items-end gap-4 ml-6">
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Value</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(currentValue)}</p>
                                    {asset.type === 'crypto' || asset.type === 'stock' ? (
                                        <div className="flex items-center gap-2 justify-end mt-1">
                                            <span className={`text-xs ${gainLossPercent >= 0 ? 'text-green-500 dark:text-green-300' : 'text-red-500 dark:text-red-300'}`}>
                                                {gainLossPercent >= 0 ? '↑' : '↓'} {gainLossPercent.toFixed(2)}% (24h)
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Estimated market value
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => onEdit(asset)}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-md font-medium transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDelete(asset.id, asset.type)}
                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-md font-medium transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

