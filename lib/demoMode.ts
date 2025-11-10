import { Portfolio, Asset } from '@/types/assets';

const DEMO_MODE_KEY = 'next-wealth-demo-mode';
const DEMO_PORTFOLIO_KEY = 'next-wealth-demo-portfolio';

export function isDemoMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DEMO_MODE_KEY) === 'true';
}

export function enableDemoMode() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEMO_MODE_KEY, 'true');

    // Initialize with sample data if no demo portfolio exists
    if (!localStorage.getItem(DEMO_PORTFOLIO_KEY)) {
        const samplePortfolio: Portfolio = {
            crypto: [
                {
                    id: 'demo-crypto-1',
                    type: 'crypto',
                    name: 'Bitcoin',
                    coinId: 'bitcoin',
                    symbol: 'BTC',
                    quantity: 0.1,
                    currentPrice: 45000,
                    priceChange24h: 2.5,
                    purchaseDate: new Date().toISOString().split('T')[0],
                    notes: 'Demo asset',
                }
            ],
            stocks: [
                {
                    id: 'demo-stock-1',
                    type: 'stock',
                    name: 'Apple Inc.',
                    symbol: 'AAPL',
                    quantity: 5,
                    currentPrice: 180,
                    priceChange24h: 1.2,
                    purchaseDate: new Date().toISOString().split('T')[0],
                    notes: 'Demo asset',
                }
            ],
            realEstate: [
                {
                    id: 'demo-re-1',
                    type: 'real-estate',
                    name: 'New York Apartment',
                    city: 'New York',
                    address: 'Demo Address',
                    squareMeters: 75,
                    pricePerSqm: 8000,
                    propertyType: 'apartment',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    notes: 'Demo asset',
                }
            ],
            cash: [
                {
                    id: 'demo-cash-1',
                    type: 'cash',
                    name: 'USD Cash',
                    amount: 25000,
                    currency: 'USD',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    notes: 'Demo asset',
                }
            ],
        };
        saveDemoPortfolio(samplePortfolio);
    }
}

export function disableDemoMode() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DEMO_MODE_KEY);
    localStorage.removeItem(DEMO_PORTFOLIO_KEY);
}

export function getDemoPortfolio(): Portfolio {
    if (typeof window === 'undefined') {
        return { crypto: [], stocks: [], realEstate: [], cash: [] };
    }

    const stored = localStorage.getItem(DEMO_PORTFOLIO_KEY);
    if (!stored) {
        return { crypto: [], stocks: [], realEstate: [], cash: [] };
    }

    try {
        return JSON.parse(stored);
    } catch {
        return { crypto: [], stocks: [], realEstate: [], cash: [] };
    }
}

export function saveDemoPortfolio(portfolio: Portfolio) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEMO_PORTFOLIO_KEY, JSON.stringify(portfolio));
}

export function addDemoAsset(asset: Asset) {
    const portfolio = getDemoPortfolio();

    if (asset.type === 'crypto') {
        portfolio.crypto.push(asset);
    } else if (asset.type === 'stock') {
        portfolio.stocks.push(asset);
    } else if (asset.type === 'real-estate') {
        portfolio.realEstate.push(asset);
    } else if (asset.type === 'cash') {
        portfolio.cash.push(asset);
    }

    saveDemoPortfolio(portfolio);
}

export function updateDemoAsset(asset: Asset) {
    const portfolio = getDemoPortfolio();

    if (asset.type === 'crypto') {
        const index = portfolio.crypto.findIndex(a => a.id === asset.id);
        if (index !== -1) portfolio.crypto[index] = asset;
    } else if (asset.type === 'stock') {
        const index = portfolio.stocks.findIndex(a => a.id === asset.id);
        if (index !== -1) portfolio.stocks[index] = asset;
    } else if (asset.type === 'real-estate') {
        const index = portfolio.realEstate.findIndex(a => a.id === asset.id);
        if (index !== -1) portfolio.realEstate[index] = asset;
    } else if (asset.type === 'cash') {
        const index = portfolio.cash.findIndex(a => a.id === asset.id);
        if (index !== -1) portfolio.cash[index] = asset;
    }

    saveDemoPortfolio(portfolio);
}

export function deleteDemoAsset(id: string, type: Asset['type']) {
    const portfolio = getDemoPortfolio();

    if (type === 'crypto') {
        portfolio.crypto = portfolio.crypto.filter(a => a.id !== id);
    } else if (type === 'stock') {
        portfolio.stocks = portfolio.stocks.filter(a => a.id !== id);
    } else if (type === 'real-estate') {
        portfolio.realEstate = portfolio.realEstate.filter(a => a.id !== id);
    } else if (type === 'cash') {
        portfolio.cash = portfolio.cash.filter(a => a.id !== id);
    }

    saveDemoPortfolio(portfolio);
}

export function deleteAllDemoAssets() {
    saveDemoPortfolio({ crypto: [], stocks: [], realEstate: [], cash: [] });
}

