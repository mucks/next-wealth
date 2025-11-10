// Currency conversion service using ExchangeRate-API (free tier)
// Alternative: use frankfurter.app or exchangeratesapi.io

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const exchangeRateCache: { [key: string]: { rate: number; timestamp: number } } = {};

export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
    // If already USD, return as-is
    if (fromCurrency.toUpperCase() === 'USD') {
        return amount;
    }

    try {
        const rate = await getExchangeRate(fromCurrency, 'USD');
        return amount * rate;
    } catch (error) {
        console.error(`Error converting ${fromCurrency} to USD:`, error);
        // Fallback: return original amount (assume 1:1)
        return amount;
    }
}

export async function getExchangeRate(from: string, to: string = 'USD'): Promise<number> {
    const cacheKey = `${from}-${to}`;
    const now = Date.now();

    // Check cache
    if (exchangeRateCache[cacheKey] && (now - exchangeRateCache[cacheKey].timestamp) < CACHE_DURATION) {
        return exchangeRateCache[cacheKey].rate;
    }

    try {
        // Use Frankfurter API (free, no API key needed, EU-based)
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from.toUpperCase()}&to=${to.toUpperCase()}`);

        if (!response.ok) {
            throw new Error('Failed to fetch exchange rate');
        }

        const data = await response.json();
        const rate = data.rates[to.toUpperCase()];

        if (!rate) {
            throw new Error(`Exchange rate not found for ${from} to ${to}`);
        }

        // Cache the rate
        exchangeRateCache[cacheKey] = { rate, timestamp: now };

        return rate;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to 1:1 ratio
        return 1;
    }
}

// Batch convert multiple cash assets to USD
export async function convertCashAssetsToUSD(cashAssets: Array<{ amount: number; currency: string }>): Promise<number> {
    let totalUSD = 0;

    for (const asset of cashAssets) {
        const usdValue = await convertToUSD(asset.amount, asset.currency);
        totalUSD += usdValue;
    }

    return totalUSD;
}

