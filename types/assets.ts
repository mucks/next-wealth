export type AssetType = 'crypto' | 'stock' | 'real-estate' | 'cash';

export interface BaseAsset {
    id: string;
    name: string;
    type: AssetType;
    purchaseDate: string;
    notes?: string;
}

export interface CryptoAsset extends BaseAsset {
    type: 'crypto';
    coinId: string; // CoinGecko ID for fetching prices
    symbol: string;
    quantity: number;
    currentPrice: number;
    priceChange24h?: number;
}

export interface StockAsset extends BaseAsset {
    type: 'stock';
    symbol: string;
    quantity: number;
    currentPrice: number;
    priceChange24h?: number;
}

export interface RealEstateAsset extends BaseAsset {
    type: 'real-estate';
    address: string;
    city: string;
    squareMeters: number;
    pricePerSqm: number; // Current price per square meter
    propertyType: 'house' | 'apartment' | 'commercial' | 'land' | 'other';
}

export interface CashAsset extends BaseAsset {
    type: 'cash';
    amount: number;
    currency: string; // USD, EUR, GBP, etc.
}

export type Asset = CryptoAsset | StockAsset | RealEstateAsset | CashAsset;

export interface Portfolio {
    crypto: CryptoAsset[];
    stocks: StockAsset[];
    realEstate: RealEstateAsset[];
    cash: CashAsset[];
}

