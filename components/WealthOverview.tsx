import { Portfolio } from '@/types/assets';
import { useState, useEffect } from 'react';
import { convertCashAssetsToUSD } from '@/services/currencyService';
import { convertToTroyOunces } from '@/services/metalService';

interface WealthOverviewProps {
    portfolio: Portfolio;
}

export function WealthOverview({ portfolio }: WealthOverviewProps) {
    // Calculate USD cash sum directly (always up-to-date, no state needed)
    const usdCashSum = portfolio.cash
        .filter(asset => asset.currency === 'USD')
        .reduce((sum, asset) => sum + asset.amount, 0);

    // Only use state for the converted total (including non-USD currencies)
    const [convertedCashTotal, setConvertedCashTotal] = useState<number | null>(null);

    const calculateCryptoValue = () => {
        return portfolio.crypto.reduce((sum, asset) => sum + asset.quantity * asset.currentPrice, 0);
    };

    const calculateStocksValue = () => {
        return portfolio.stocks.reduce((sum, asset) => sum + asset.quantity * asset.currentPrice, 0);
    };

    const calculateRealEstateValue = () => {
        return portfolio.realEstate.reduce((sum, asset) => sum + (asset.squareMeters * asset.pricePerSqm), 0);
    };

    const calculateMetalsValue = () => {
        return portfolio.metals.reduce((sum, asset) => {
            const weightInOz = convertToTroyOunces(asset.weight, asset.unit);
            return sum + (weightInOz * asset.currentPrice);
        }, 0);
    };

    // Convert all cash to USD (including non-USD currencies)
    useEffect(() => {
        // Check if we have non-USD currencies
        const hasNonUSD = portfolio.cash.some(asset => asset.currency !== 'USD');

        if (!hasNonUSD) {
            setConvertedCashTotal(null); // No conversion needed, use usdCashSum directly
            return;
        }

        // Convert all currencies to USD
        const convertCash = async () => {
            const usdValue = await convertCashAssetsToUSD(
                portfolio.cash.map(asset => ({ amount: asset.amount, currency: asset.currency }))
            );
            setConvertedCashTotal(usdValue);
        };

        convertCash();
    }, [portfolio.cash]);

    // Use converted total if available, otherwise use USD sum
    const cashValueUSD = convertedCashTotal ?? usdCashSum;

    const calculateCryptoGainLoss = () => {
        // For crypto, we just show current value since we don't track purchase price
        return 0;
    };

    const calculateStocksGainLoss = () => {
        // For stocks, we just show current value since we don't track purchase price
        return 0;
    };

    const calculateRealEstateGainLoss = () => {
        // For real estate, we don't track purchase price anymore, just show current value
        return 0;
    };

    const cryptoValue = calculateCryptoValue();
    const stocksValue = calculateStocksValue();
    const realEstateValue = calculateRealEstateValue();
    const metalsValue = calculateMetalsValue();
    const totalValue = cryptoValue + stocksValue + realEstateValue + metalsValue + cashValueUSD;

    const totalGainLoss = calculateCryptoGainLoss() + calculateStocksGainLoss() + calculateRealEstateGainLoss();
    const totalGainLossPercent = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const categories = [
        {
            name: 'Crypto',
            value: cryptoValue,
            color: 'bg-orange-500',
            textColor: 'text-orange-600',
            bgLight: 'bg-orange-50',
            count: portfolio.crypto.length,
        },
        {
            name: 'Stocks',
            value: stocksValue,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgLight: 'bg-blue-50',
            count: portfolio.stocks.length,
        },
        {
            name: 'Real Estate',
            value: realEstateValue,
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgLight: 'bg-green-50',
            count: portfolio.realEstate.length,
        },
        {
            name: 'Metals',
            value: metalsValue,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
            bgLight: 'bg-yellow-50',
            count: portfolio.metals.length,
        },
        {
            name: 'Cash',
            value: cashValueUSD,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-600',
            bgLight: 'bg-emerald-50',
            count: portfolio.cash.length,
        },
    ];

    return (
        <div className="mb-8">
            {/* Total Wealth Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-900 rounded-xl shadow-lg p-8 mb-6 text-white border border-blue-500/20">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-blue-100 dark:text-blue-200 text-sm font-medium mb-2">Total Net Worth</p>
                        <h2 className="text-5xl font-bold mb-4">{formatCurrency(totalValue)}</h2>
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-semibold ${totalGainLoss >= 0 ? 'text-green-300 dark:text-green-400' : 'text-red-300 dark:text-red-400'}`}>
                                {totalGainLoss >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(totalGainLoss))}
                            </span>
                            <span className={`text-sm ${totalGainLoss >= 0 ? 'text-green-200 dark:text-green-300' : 'text-red-200 dark:text-red-300'}`}>
                                ({totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-100 dark:text-blue-200 text-sm mb-1">Total Assets</p>
                        <p className="text-3xl font-bold">{portfolio.crypto.length + portfolio.stocks.length + portfolio.realEstate.length + portfolio.metals.length + portfolio.cash.length}</p>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((category) => (
                    <div key={category.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-l-4 border border-gray-200 dark:border-gray-700" style={{ borderLeftColor: category.color.replace('bg-', '') }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 dark:text-gray-300 font-medium">{category.name}</h3>
                            <span className={`${category.bgLight} dark:bg-opacity-20 ${category.textColor} px-3 py-1 rounded-full text-sm font-semibold`}>
                                {category.count} {category.count === 1 ? 'asset' : 'assets'}
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(category.value)}</p>
                        {totalValue > 0 && (
                            <div className="mt-4">
                                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    <span>Portfolio Share</span>
                                    <span>{((category.value / totalValue) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`${category.color} h-2 rounded-full transition-all`}
                                        style={{ width: `${(category.value / totalValue) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

