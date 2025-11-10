import { Portfolio } from '@/types/assets';

interface WealthOverviewProps {
    portfolio: Portfolio;
}

export function WealthOverview({ portfolio }: WealthOverviewProps) {
    const calculateCryptoValue = () => {
        return portfolio.crypto.reduce((sum, asset) => sum + asset.quantity * asset.currentPrice, 0);
    };

    const calculateStocksValue = () => {
        return portfolio.stocks.reduce((sum, asset) => sum + asset.quantity * asset.currentPrice, 0);
    };

    const calculateRealEstateValue = () => {
        return portfolio.realEstate.reduce((sum, asset) => sum + (asset.squareMeters * asset.pricePerSqm), 0);
    };

    const calculateCashValue = () => {
        return portfolio.cash.reduce((sum, asset) => sum + asset.amount, 0);
    };

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
    const cashValue = calculateCashValue();
    const totalValue = cryptoValue + stocksValue + realEstateValue + cashValue;

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
            name: 'Cash',
            value: cashValue,
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
                        <p className="text-3xl font-bold">{portfolio.crypto.length + portfolio.stocks.length + portfolio.realEstate.length + portfolio.cash.length}</p>
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

