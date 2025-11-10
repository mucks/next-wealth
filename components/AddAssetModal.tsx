import { useState, useEffect } from 'react';
import { Asset, AssetType, CryptoAsset, StockAsset, RealEstateAsset, CashAsset } from '@/types/assets';
import { fetchCryptoPrice, POPULAR_CRYPTOS } from '@/services/cryptoService';
import { fetchRealEstatePrice, searchCities } from '@/services/realEstateService';
import { fetchStockPrice, POPULAR_STOCKS } from '@/services/stockService';

interface AddAssetModalProps {
    onClose: () => void;
    onAdd: (asset: Asset) => void;
    onUpdate: (asset: Asset) => void;
    editingAsset: Asset | null;
}

export function AddAssetModal({ onClose, onAdd, onUpdate, editingAsset }: AddAssetModalProps) {
    const isEditMode = !!editingAsset;
    const [assetType, setAssetType] = useState<AssetType>(editingAsset?.type || 'crypto');
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        coinId: '',
        quantity: '',
        purchasePrice: '',
        currentPrice: '',
        address: '',
        city: '',
        squareMeters: '',
        pricePerSqm: '',
        currentValue: '',
        propertyType: 'apartment' as 'house' | 'apartment' | 'commercial' | 'land' | 'other',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
        amount: '',
        currency: 'USD',
    });
    const [loadingPrice, setLoadingPrice] = useState(false);
    const [selectedCrypto, setSelectedCrypto] = useState('');
    const [selectedStock, setSelectedStock] = useState('');
    const [loadingStockPrice, setLoadingStockPrice] = useState(false);
    const [loadingRealEstatePrice, setLoadingRealEstatePrice] = useState(false);
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);

    // Fetch crypto price when selected
    const [priceChange24h, setPriceChange24h] = useState<number>(0);
    const [stockPriceChange24h, setStockPriceChange24h] = useState<number>(0);

    // Initialize form with existing asset data when editing
    useEffect(() => {
        if (editingAsset) {
            if (editingAsset.type === 'crypto') {
                const crypto = editingAsset as CryptoAsset;
                setFormData({
                    name: crypto.name,
                    symbol: crypto.symbol,
                    coinId: crypto.coinId,
                    quantity: crypto.quantity.toString(),
                    purchasePrice: '',
                    currentPrice: crypto.currentPrice.toString(),
                    address: '',
                    city: '',
                    squareMeters: '',
                    pricePerSqm: '',
                    currentValue: '',
                    propertyType: 'apartment',
                    purchaseDate: crypto.purchaseDate,
                    notes: crypto.notes || '',
                });
                setPriceChange24h(crypto.priceChange24h || 0);
                setSelectedCrypto(crypto.coinId);
            } else if (editingAsset.type === 'stock') {
                const stock = editingAsset as StockAsset;
                setFormData({
                    name: stock.name,
                    symbol: stock.symbol,
                    coinId: '',
                    quantity: stock.quantity.toString(),
                    purchasePrice: '',
                    currentPrice: stock.currentPrice.toString(),
                    address: '',
                    city: '',
                    squareMeters: '',
                    pricePerSqm: '',
                    currentValue: '',
                    propertyType: 'apartment',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    notes: stock.notes || '',
                });
                setStockPriceChange24h(stock.priceChange24h || 0);
                setSelectedStock(stock.symbol);
            } else if (editingAsset.type === 'real-estate') {
                const realEstate = editingAsset as RealEstateAsset;
                setFormData({
                    name: realEstate.name,
                    symbol: '',
                    coinId: '',
                    quantity: '',
                    purchasePrice: '',
                    currentPrice: '',
                    address: realEstate.address,
                    city: realEstate.city,
                    squareMeters: realEstate.squareMeters.toString(),
                    pricePerSqm: realEstate.pricePerSqm.toString(),
                    currentValue: '',
                    propertyType: realEstate.propertyType,
                    purchaseDate: new Date().toISOString().split('T')[0],
                    notes: realEstate.notes || '',
                    amount: '',
                    currency: 'USD',
                });
            } else if (editingAsset.type === 'cash') {
                const cash = editingAsset as CashAsset;
                setFormData({
                    name: cash.name,
                    symbol: '',
                    coinId: '',
                    quantity: '',
                    purchasePrice: '',
                    currentPrice: '',
                    address: '',
                    city: '',
                    squareMeters: '',
                    pricePerSqm: '',
                    currentValue: '',
                    propertyType: 'apartment',
                    purchaseDate: cash.purchaseDate,
                    notes: cash.notes || '',
                    amount: cash.amount.toString(),
                    currency: cash.currency,
                });
            }
        }
    }, [editingAsset]);

    useEffect(() => {
        if (selectedCrypto && assetType === 'crypto') {
            const crypto = POPULAR_CRYPTOS.find(c => c.id === selectedCrypto);

            const timeoutId = setTimeout(() => {
                setLoadingPrice(true);
                fetchCryptoPrice(selectedCrypto).then(priceData => {
                    if (priceData) {
                        setFormData(prev => ({
                            ...prev,
                            name: crypto?.name || priceData.name || selectedCrypto.toUpperCase(),
                            symbol: crypto?.symbol || priceData.symbol || selectedCrypto.toUpperCase(),
                            coinId: selectedCrypto,
                            currentPrice: priceData.current_price.toString(),
                        }));
                        setPriceChange24h(priceData.price_change_percentage_24h || 0);
                    }
                    setLoadingPrice(false);
                });
            }, 800); // Debounce for manual entry

            return () => clearTimeout(timeoutId);
        }
    }, [selectedCrypto, assetType]);

    // Fetch stock price when ticker is entered
    useEffect(() => {
        if (formData.symbol && formData.symbol.length >= 1 && assetType === 'stock') {
            const timeoutId = setTimeout(() => {
                setLoadingStockPrice(true);
                fetchStockPrice(formData.symbol).then(priceData => {
                    if (priceData) {
                        setFormData(prev => ({
                            ...prev,
                            name: priceData.name,
                            currentPrice: priceData.price.toString(),
                        }));
                        setStockPriceChange24h(priceData.changePercent || 0);
                    }
                    setLoadingStockPrice(false);
                });
            }, 800); // Debounce for 800ms

            return () => clearTimeout(timeoutId);
        }
    }, [formData.symbol, assetType]);

    // Fetch real estate price when city or property type changes
    useEffect(() => {
        if (formData.city && assetType === 'real-estate' && (formData.propertyType === 'apartment' || formData.propertyType === 'house')) {
            const timeoutId = setTimeout(() => {
                setLoadingRealEstatePrice(true);
                fetchRealEstatePrice(formData.city, formData.propertyType as 'apartment' | 'house')
                    .then(priceData => {
                        if (priceData) {
                            setFormData(prev => ({
                                ...prev,
                                pricePerSqm: priceData.pricePerSqm.toString(),
                            }));
                        }
                        setLoadingRealEstatePrice(false);
                    });
            }, 800); // Debounce for 800ms

            return () => clearTimeout(timeoutId);
        }
    }, [formData.city, formData.propertyType, assetType]);

    // City search suggestions
    useEffect(() => {
        if (formData.city && formData.city.length >= 2) {
            const suggestions = searchCities(formData.city);
            setCitySuggestions(suggestions);
        } else {
            setCitySuggestions([]);
        }
    }, [formData.city]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate real estate has price data
        if (assetType === 'real-estate' && !formData.pricePerSqm) {
            alert('Please select a city from the suggestions to fetch market prices.');
            return;
        }

        // Validate stock has price
        if (assetType === 'stock' && !formData.currentPrice) {
            alert('Please enter the current stock price.');
            return;
        }

        const baseAsset = {
            id: isEditMode ? editingAsset!.id : Date.now().toString(),
            name: formData.name,
            purchaseDate: formData.purchaseDate,
            notes: formData.notes || undefined,
        };

        let newAsset: Asset;

        if (assetType === 'crypto') {
            newAsset = {
                ...baseAsset,
                type: 'crypto',
                coinId: formData.coinId,
                symbol: formData.symbol.toUpperCase(),
                quantity: parseFloat(formData.quantity),
                currentPrice: parseFloat(formData.currentPrice),
                priceChange24h: priceChange24h,
            } as CryptoAsset;
        } else if (assetType === 'stock') {
            // If name wasn't fetched, use the ticker symbol
            const stockName = formData.name || formData.symbol.toUpperCase();

            newAsset = {
                ...baseAsset,
                name: stockName,
                type: 'stock',
                symbol: formData.symbol.toUpperCase(),
                quantity: parseFloat(formData.quantity),
                currentPrice: parseFloat(formData.currentPrice),
                priceChange24h: stockPriceChange24h,
            } as StockAsset;
        } else if (assetType === 'real-estate') {
            // Auto-generate name for real estate based on property type and city
            const propertyName = formData.address
                ? `${formData.propertyType.charAt(0).toUpperCase() + formData.propertyType.slice(1)} - ${formData.address}`
                : `${formData.propertyType.charAt(0).toUpperCase() + formData.propertyType.slice(1)} in ${formData.city}`;

            newAsset = {
                ...baseAsset,
                name: propertyName,
                type: 'real-estate',
                address: formData.address,
                city: formData.city,
                squareMeters: parseFloat(formData.squareMeters),
                pricePerSqm: parseFloat(formData.pricePerSqm),
                propertyType: formData.propertyType,
                purchaseDate: new Date().toISOString().split('T')[0], // Default to today
            } as RealEstateAsset;
        } else {
            // Cash
            const cashName = formData.name || `${formData.currency} Cash`;

            newAsset = {
                ...baseAsset,
                name: cashName,
                type: 'cash',
                amount: parseFloat(formData.amount),
                currency: formData.currency,
            } as CashAsset;
        }

        if (isEditMode) {
            onUpdate(newAsset);
        } else {
            onAdd(newAsset);
        }
        onClose();
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const inputClassName = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500";
    const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEditMode ? 'Edit Asset' : 'Add New Asset'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Asset Type Selection - Only show when adding */}
                    {!isEditMode && (
                        <div className="mb-6">
                            <label className={labelClassName}>
                                Asset Type
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { value: 'crypto', label: 'Crypto', icon: '₿' },
                                    { value: 'stock', label: 'Stock', icon: '📈' },
                                    { value: 'real-estate', label: 'Real Estate', icon: '🏠' },
                                    { value: 'cash', label: 'Cash', icon: '💵' },
                                ].map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setAssetType(type.value as AssetType)}
                                        className={`p-4 rounded-lg border-2 transition-all ${assetType === type.value
                                            ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">{type.icon}</div>
                                        <div className="font-semibold text-gray-900 dark:text-white">{type.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Crypto Fields - Simplified */}
                    {assetType === 'crypto' && (
                        <div className="space-y-4 mb-6 p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span>₿</span> Crypto Details
                            </h3>

                            <div>
                                <label className={labelClassName}>
                                    Select Popular Crypto (or enter CoinGecko ID below)
                                </label>
                                <select
                                    value={selectedCrypto}
                                    onChange={(e) => setSelectedCrypto(e.target.value)}
                                    className={inputClassName}
                                >
                                    <option value="">-- Quick select popular crypto --</option>
                                    {POPULAR_CRYPTOS.map((crypto) => (
                                        <option key={crypto.id} value={crypto.id}>
                                            {crypto.name} ({crypto.symbol})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    Or Enter CoinGecko ID *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.coinId}
                                    onChange={(e) => {
                                        const coinId = e.target.value.toLowerCase();
                                        handleChange('coinId', coinId);
                                        if (coinId.length >= 2) {
                                            setSelectedCrypto(coinId);
                                        }
                                    }}
                                    placeholder="bitcoin or ethereum"
                                    className={inputClassName + " lowercase"}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    CoinGecko ID (usually lowercase name). Find IDs at{' '}
                                    <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        coingecko.com
                                    </a>
                                </p>
                            </div>

                            {loadingPrice && (
                                <div className="text-center text-sm text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Fetching price for {formData.coinId}...
                                </div>
                            )}

                            {formData.coinId && !formData.currentPrice && !loadingPrice && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        ⚠ Price data not available for "{formData.coinId}". Check the CoinGecko ID is correct or enter price manually.
                                    </p>
                                </div>
                            )}

                            {formData.currentPrice && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                ${parseFloat(formData.currentPrice).toLocaleString()}
                                            </span>
                                            {priceChange24h !== 0 && (
                                                <div className={`text-sm ${priceChange24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(priceChange24h).toFixed(2)}% (24h)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Live price from CoinGecko
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={labelClassName}>
                                    How many {formData.symbol || 'coins'} do you own? *
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={formData.quantity}
                                    onChange={(e) => handleChange('quantity', e.target.value)}
                                    placeholder="1.5"
                                    className={inputClassName}
                                />
                                {formData.quantity && formData.currentPrice && (
                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        Total value: ${(parseFloat(formData.quantity) * parseFloat(formData.currentPrice)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Add any notes about this crypto holding..."
                                    rows={2}
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    )}

                    {/* Stock Fields - Simplified */}
                    {assetType === 'stock' && (
                        <div className="space-y-4 mb-6 p-4 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span>📈</span> Stock Details
                            </h3>

                            <div>
                                <label className={labelClassName}>
                                    Select Popular Stock (or enter ticker below)
                                </label>
                                <select
                                    value={selectedStock}
                                    onChange={(e) => {
                                        setSelectedStock(e.target.value);
                                        if (e.target.value) {
                                            const stock = POPULAR_STOCKS.find(s => s.symbol === e.target.value);
                                            if (stock) {
                                                handleChange('symbol', stock.symbol);
                                            }
                                        }
                                    }}
                                    className={inputClassName}
                                >
                                    <option value="">-- Quick select popular stocks --</option>
                                    <optgroup label="🇺🇸 US Stocks">
                                        {POPULAR_STOCKS.filter(s => s.exchange === 'US').map((stock) => (
                                            <option key={stock.symbol} value={stock.symbol}>
                                                {stock.name} ({stock.symbol})
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="🇪🇺 European Stocks (DE/AT)">
                                        {POPULAR_STOCKS.filter(s => s.exchange === 'DE' || s.exchange === 'F' || s.exchange === 'SG' || s.exchange === 'VI').map((stock) => (
                                            <option key={stock.symbol} value={stock.symbol}>
                                                {stock.name} ({stock.symbol})
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    Or Enter Stock Ticker *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.symbol}
                                    onChange={(e) => {
                                        const ticker = e.target.value.toUpperCase();
                                        handleChange('symbol', ticker);
                                        if (ticker.length >= 1) {
                                            setSelectedStock(ticker);
                                        }
                                    }}
                                    placeholder="AAPL or DPW.DE"
                                    className={inputClassName + " uppercase"}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    DE: .DE (XETRA), .F (Frankfurt), .SG (Stuttgart). AT: .VI (Vienna). Others: .TO, .L, etc.
                                </p>
                            </div>

                            {loadingStockPrice && (
                                <div className="text-center text-sm text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Fetching price for {formData.symbol}...
                                </div>
                            )}

                            {formData.symbol && !formData.currentPrice && !loadingStockPrice && (
                                <div className="space-y-2">
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            ⚠ Price data not available for "{formData.symbol}". Please enter the current price manually below.
                                        </p>
                                    </div>
                                    <div>
                                        <label className={labelClassName}>
                                            Current Price (per share) *
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            required
                                            value={formData.currentPrice}
                                            onChange={(e) => handleChange('currentPrice', e.target.value)}
                                            placeholder="150.00"
                                            className={inputClassName}
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.currentPrice && !loadingStockPrice && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Current Price</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                ${parseFloat(formData.currentPrice).toLocaleString()}
                                            </span>
                                            {stockPriceChange24h !== 0 && (
                                                <div className={`text-sm ${stockPriceChange24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {stockPriceChange24h >= 0 ? '↑' : '↓'} {Math.abs(stockPriceChange24h).toFixed(2)}% (24h)
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {stockPriceChange24h !== 0 ? 'Live stock price' : 'Stock price'}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={labelClassName}>
                                    How many shares do you own? *
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={formData.quantity}
                                    onChange={(e) => handleChange('quantity', e.target.value)}
                                    placeholder="100"
                                    className={inputClassName}
                                />
                                {formData.quantity && formData.currentPrice && (
                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        Total value: ${(parseFloat(formData.quantity) * parseFloat(formData.currentPrice)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Add any notes about this stock holding..."
                                    rows={2}
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    )}

                    {assetType === 'real-estate' && (
                        <div className="space-y-4 mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span>🏠</span> Property Details
                            </h3>

                            <div>
                                <label className={labelClassName}>
                                    Property Type *
                                </label>
                                <select
                                    required
                                    value={formData.propertyType}
                                    onChange={(e) => handleChange('propertyType', e.target.value)}
                                    className={inputClassName}
                                >
                                    <option value="apartment">Apartment</option>
                                    <option value="house">House</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="land">Land</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className={labelClassName}>
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={(e) => {
                                            handleChange('city', e.target.value);
                                            setShowCitySuggestions(true);
                                        }}
                                        onFocus={() => setShowCitySuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                                        placeholder="New York"
                                        className={inputClassName}
                                        autoComplete="off"
                                    />
                                    {showCitySuggestions && citySuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {citySuggestions.map((city) => (
                                                <button
                                                    key={city}
                                                    type="button"
                                                    onClick={() => {
                                                        handleChange('city', city);
                                                        setShowCitySuggestions(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                                                >
                                                    {city}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClassName}>
                                        Square Meters *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={formData.squareMeters}
                                        onChange={(e) => handleChange('squareMeters', e.target.value)}
                                        placeholder="85"
                                        className={inputClassName}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    Address (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    placeholder="123 Main Street"
                                    className={inputClassName}
                                />
                            </div>

                            {loadingRealEstatePrice && (
                                <div className="text-center text-sm text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Fetching market price for {formData.city}...
                                </div>
                            )}

                            {formData.city && !formData.pricePerSqm && !loadingRealEstatePrice && formData.squareMeters && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        ⚠ Market data not available for "{formData.city}". Try selecting a city from the suggestions or use a major city nearby.
                                    </p>
                                </div>
                            )}

                            {formData.squareMeters && formData.pricePerSqm && !loadingRealEstatePrice && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Value</span>
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                ${(parseFloat(formData.squareMeters) * parseFloat(formData.pricePerSqm)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                            <span>Market price in {formData.city}</span>
                                            <span>${parseFloat(formData.pricePerSqm).toLocaleString()}/m²</span>
                                        </div>
                                        <div className="text-xs text-green-600 dark:text-green-400">
                                            ✓ Based on average {formData.propertyType} prices
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={labelClassName}>
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Add any notes about this property..."
                                    rows={2}
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    )}

                    {/* Cash Fields */}
                    {assetType === 'cash' && (
                        <div className="space-y-4 mb-6 p-4 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span>💵</span> Cash Details
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClassName}>
                                        Currency *
                                    </label>
                                    <select
                                        required
                                        value={formData.currency}
                                        onChange={(e) => handleChange('currency', e.target.value)}
                                        className={inputClassName}
                                    >
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="GBP">GBP - British Pound</option>
                                        <option value="JPY">JPY - Japanese Yen</option>
                                        <option value="CHF">CHF - Swiss Franc</option>
                                        <option value="CAD">CAD - Canadian Dollar</option>
                                        <option value="AUD">AUD - Australian Dollar</option>
                                        <option value="CNY">CNY - Chinese Yuan</option>
                                        <option value="INR">INR - Indian Rupee</option>
                                        <option value="BRL">BRL - Brazilian Real</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClassName}>
                                        Amount *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => handleChange('amount', e.target.value)}
                                        placeholder="10000"
                                        className={inputClassName}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="Checking Account, Savings, etc."
                                    className={inputClassName}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Leave empty to auto-generate (e.g., "USD Cash")
                                </p>
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Add any notes about this cash holding..."
                                    rows={2}
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                        >
                            {isEditMode ? 'Update Asset' : 'Add Asset'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
