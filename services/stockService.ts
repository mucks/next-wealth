export interface StockPrice {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

// Popular stock symbols
export const POPULAR_STOCKS = [
    // US Stocks
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'US' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'US' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'US' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'US' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'US' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'US' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'US' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', exchange: 'US' },
    { symbol: 'JPM', name: 'JPMorgan Chase', exchange: 'US' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'US' },
    { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'US' },
    { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'US' },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'US' },
    { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'US' },
    { symbol: 'AMD', name: 'AMD Inc.', exchange: 'US' },

    // German Stocks (XETRA/IBIS/FWB/SWB)
    { symbol: 'APS', name: 'Apple Inc. (XETRA)', exchange: 'DE' },
    { symbol: '2PP', name: 'PayPal Holdings Inc. (FWB)', exchange: 'DE' },
    { symbol: '307', name: 'Shopify Inc. (FWB2)', exchange: 'F' },
    { symbol: '8BZ', name: 'Sony Financial Group Inc. (SWB2)', exchange: 'SG' },
    { symbol: 'NTO', name: 'NTO Stock (Vienna)', exchange: 'VI' },
    { symbol: 'SAP', name: 'SAP SE', exchange: 'DE' },
    { symbol: 'SIE', name: 'Siemens AG', exchange: 'DE' },
    { symbol: 'BMW', name: 'BMW AG', exchange: 'DE' },
    { symbol: 'VOW3', name: 'Volkswagen AG', exchange: 'DE' },
    { symbol: 'DTE', name: 'Deutsche Telekom AG', exchange: 'DE' },
    { symbol: 'ALV', name: 'Allianz SE', exchange: 'DE' },
    { symbol: 'BAS', name: 'BASF SE', exchange: 'DE' },
    { symbol: 'MBG', name: 'Mercedes-Benz Group AG', exchange: 'DE' },
    { symbol: 'ADS', name: 'Adidas AG', exchange: 'DE' },
    { symbol: 'DB1', name: 'Deutsche Börse AG', exchange: 'DE' },
];

// Mock stock prices (in production, use a real API like Alpha Vantage, Finnhub, or Yahoo Finance)
const MOCK_STOCK_PRICES: Record<string, { price: number; changePercent: number }> = {
    // US Stocks
    'AAPL': { price: 189.50, changePercent: 1.2 },
    'MSFT': { price: 378.25, changePercent: 0.8 },
    'GOOGL': { price: 142.80, changePercent: -0.5 },
    'AMZN': { price: 178.35, changePercent: 1.5 },
    'NVDA': { price: 495.20, changePercent: 2.3 },
    'META': { price: 485.60, changePercent: -0.3 },
    'TSLA': { price: 242.15, changePercent: 3.1 },
    'BRK.B': { price: 445.30, changePercent: 0.4 },
    'JPM': { price: 198.75, changePercent: 0.6 },
    'V': { price: 285.90, changePercent: 0.9 },
    'WMT': { price: 165.40, changePercent: -0.2 },
    'MA': { price: 472.80, changePercent: 1.1 },
    'NFLX': { price: 645.30, changePercent: 2.5 },
    'ADBE': { price: 512.40, changePercent: -0.7 },
    'AMD': { price: 165.75, changePercent: 1.9 },

    // German & Austrian Stocks (EUR prices)
    'APS': { price: 178.25, changePercent: 1.2 }, // Apple on XETRA
    '2PP': { price: 72.50, changePercent: 0.8 }, // PayPal on FWB
    '307': { price: 58.30, changePercent: 1.5 }, // Shopify on FWB2
    '8BZ': { price: 3.85, changePercent: -0.5 }, // Sony Financial Group on SWB2
    'NTO': { price: 25.40, changePercent: 0.3 }, // NTO on Vienna
    'SAP': { price: 178.45, changePercent: 0.7 },
    'SIE': { price: 172.30, changePercent: 1.2 },
    'BMW': { price: 95.80, changePercent: -0.4 },
    'VOW3': { price: 122.50, changePercent: 0.9 },
    'DTE': { price: 23.15, changePercent: 0.3 },
    'ALV': { price: 265.40, changePercent: 0.5 },
    'BAS': { price: 48.25, changePercent: -0.8 },
    'MBG': { price: 68.90, changePercent: 1.1 },
    'ADS': { price: 218.60, changePercent: 1.5 },
    'DB1': { price: 195.80, changePercent: 0.6 },
};

export async function fetchStockPrice(symbol: string): Promise<StockPrice | null> {
    try {
        const upperSymbol = symbol.toUpperCase();

        // For stocks in popular list, add appropriate exchange suffix if not already present
        let yahooSymbol = upperSymbol;
        const stockInfo = POPULAR_STOCKS.find(s => s.symbol === upperSymbol.split('.')[0]);

        // Add exchange suffix if stock is in popular list and no suffix already present
        if (stockInfo && !upperSymbol.includes('.')) {
            if (stockInfo.exchange === 'DE') {
                yahooSymbol = `${upperSymbol}.DE`; // XETRA/IBIS
            } else if (stockInfo.exchange === 'F') {
                yahooSymbol = `${upperSymbol}.F`; // Frankfurt (FWB)
            } else if (stockInfo.exchange === 'SG') {
                yahooSymbol = `${upperSymbol}.SG`; // Stuttgart (SWB)
            } else if (stockInfo.exchange === 'VI') {
                yahooSymbol = `${upperSymbol}.VI`; // Vienna (VSE)
            }
            // US stocks don't need a suffix
        }
        // Otherwise use the symbol as-is (supports manual entry like "DPW.DE", "307.F", "8BZ.SG", "NTO.VI", "SHOP.TO")

        // Use our Next.js API route to avoid CORS issues
        const response = await fetch(`/api/stock-price?symbol=${encodeURIComponent(yahooSymbol)}`);

        if (!response.ok) {
            // Stock not found - this is normal for invalid tickers, return null quietly
            return null;
        }

        const data = await response.json();

        return {
            symbol: upperSymbol.split('.')[0], // Remove exchange suffix for display
            name: stockInfo?.name || data.name || upperSymbol,
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
        };
    } catch (error) {
        // Only log unexpected errors
        return null;
    }
}

