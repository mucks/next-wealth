export interface CryptoPrice {
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h: number;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export async function fetchCryptoPrice(coinId: string): Promise<CryptoPrice | null> {
    try {
        const response = await fetch(
            `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false`
        );

        if (!response.ok) {
            // Coin not found - return null quietly
            return null;
        }

        const data = await response.json();
        if (data.length === 0) return null;

        return data[0];
    } catch (error) {
        // Silently fail - caller will handle
        return null;
    }
}

export async function searchCrypto(query: string): Promise<CryptoPrice[]> {
    try {
        const response = await fetch(
            `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&query=${query}`
        );

        if (!response.ok) {
            throw new Error('Failed to search crypto');
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching crypto:', error);
        return [];
    }
}

// Popular crypto coin IDs for CoinGecko
export const POPULAR_CRYPTOS = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'staked-ether', name: 'Lido Staked Ether', symbol: 'STETH' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'sui', name: 'Sui', symbol: 'SUI' },
    { id: 'ripple', name: 'XRP', symbol: 'XRP' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
    { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
    { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
];

