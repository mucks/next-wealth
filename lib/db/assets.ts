import { Asset, Portfolio, CryptoAsset, StockAsset, RealEstateAsset, CashAsset, MetalAsset } from '@/types/assets';

export async function fetchUserPortfolio(): Promise<Portfolio> {
    try {
        const response = await fetch('/api/assets', { cache: 'no-store' });

        if (!response.ok) {
            throw new Error('Failed to fetch assets');
        }

        // API now returns Portfolio format directly
        const portfolio = await response.json();

        return portfolio;
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return { crypto: [], stocks: [], realEstate: [], cash: [], metals: [] };
    }
}

export async function createAsset(asset: Asset, skipPriceFetch = false): Promise<Asset> {
    const dbAsset = mapAssetToDbAsset(asset);

    const url = skipPriceFetch ? '/api/assets?skipPrice=true' : '/api/assets';
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbAsset),
    });

    if (!response.ok) {
        throw new Error('Failed to create asset');
    }

    const created = await response.json();
    return mapDbAssetToAsset(created);
}

export async function updateAsset(asset: Asset): Promise<Asset> {
    const dbAsset = mapAssetToDbAsset(asset);

    const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbAsset),
    });

    if (!response.ok) {
        throw new Error('Failed to update asset');
    }

    const updated = await response.json();
    return mapDbAssetToAsset(updated);
}

export async function deleteAsset(id: string): Promise<void> {
    const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete asset');
    }
}

// Helper functions to map between Asset types and database structure
function mapAssetToDbAsset(asset: Asset): any {
    const base = {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        purchaseDate: asset.purchaseDate,
        notes: asset.notes || null,
    };

    if (asset.type === 'crypto') {
        return {
            ...base,
            coinId: asset.coinId,
            symbol: asset.symbol,
            quantity: asset.quantity.toString(),
            currentPrice: asset.currentPrice.toString(),
            priceChange24h: (asset.priceChange24h || 0).toString(),
        };
    } else if (asset.type === 'stock') {
        return {
            ...base,
            symbol: asset.symbol,
            quantity: asset.quantity.toString(),
            currentPrice: asset.currentPrice.toString(),
            priceChange24h: (asset.priceChange24h || 0).toString(),
        };
    } else if (asset.type === 'real-estate') {
        return {
            ...base,
            address: asset.address,
            city: asset.city,
            squareMeters: asset.squareMeters.toString(),
            pricePerSqm: asset.pricePerSqm.toString(),
            propertyType: asset.propertyType,
        };
    } else if (asset.type === 'cash') {
        return {
            ...base,
            amount: asset.amount.toString(),
            currency: asset.currency,
        };
    } else if (asset.type === 'metal') {
        return {
            ...base,
            metalType: asset.metalType,
            weight: asset.weight.toString(),
            unit: asset.unit,
            currentPrice: asset.currentPrice.toString(),
            priceChange24h: (asset.priceChange24h || 0).toString(),
        };
    }

    return base;
}

function mapDbAssetToAsset(dbAsset: any): Asset {
    const base = {
        id: dbAsset.id,
        name: dbAsset.name,
        type: dbAsset.type,
        purchaseDate: dbAsset.purchaseDate,
        notes: dbAsset.notes,
    };

    if (dbAsset.type === 'crypto') {
        return {
            ...base,
            type: 'crypto',
            coinId: dbAsset.coinId,
            symbol: dbAsset.symbol,
            quantity: parseFloat(dbAsset.quantity),
            currentPrice: parseFloat(dbAsset.currentPrice),
            priceChange24h: parseFloat(dbAsset.priceChange24h || '0'),
        } as CryptoAsset;
    } else if (dbAsset.type === 'stock') {
        return {
            ...base,
            type: 'stock',
            symbol: dbAsset.symbol,
            quantity: parseFloat(dbAsset.quantity),
            currentPrice: parseFloat(dbAsset.currentPrice),
            priceChange24h: parseFloat(dbAsset.priceChange24h || '0'),
        } as StockAsset;
    } else if (dbAsset.type === 'real-estate') {
        return {
            ...base,
            type: 'real-estate',
            address: dbAsset.address,
            city: dbAsset.city,
            squareMeters: parseFloat(dbAsset.squareMeters),
            pricePerSqm: parseFloat(dbAsset.pricePerSqm),
            propertyType: dbAsset.propertyType,
        } as RealEstateAsset;
    } else if (dbAsset.type === 'cash') {
        return {
            ...base,
            type: 'cash',
            amount: parseFloat(dbAsset.amount),
            currency: dbAsset.currency,
        } as CashAsset;
    } else if (dbAsset.type === 'metal') {
        return {
            ...base,
            type: 'metal',
            metalType: dbAsset.metalType,
            weight: parseFloat(dbAsset.weight),
            unit: dbAsset.unit,
            currentPrice: parseFloat(dbAsset.currentPrice),
            priceChange24h: parseFloat(dbAsset.priceChange24h || '0'),
        } as MetalAsset;
    }

    throw new Error(`Unknown asset type: ${dbAsset.type}`);
}
