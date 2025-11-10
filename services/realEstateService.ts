export interface RealEstatePriceData {
    city: string;
    country: string;
    pricePerSqm: number;
    currency: string;
    propertyType?: 'apartment' | 'house';
}

// Sample data for major cities (prices in USD per square meter)
// In a production app, this would come from a real API
const CITY_PRICE_DATA: Record<string, RealEstatePriceData> = {
    // United States
    'new york': { city: 'New York', country: 'USA', pricePerSqm: 12000, currency: 'USD', propertyType: 'apartment' },
    'san francisco': { city: 'San Francisco', country: 'USA', pricePerSqm: 11000, currency: 'USD', propertyType: 'apartment' },
    'los angeles': { city: 'Los Angeles', country: 'USA', pricePerSqm: 7000, currency: 'USD', propertyType: 'apartment' },
    'miami': { city: 'Miami', country: 'USA', pricePerSqm: 6500, currency: 'USD', propertyType: 'apartment' },
    'chicago': { city: 'Chicago', country: 'USA', pricePerSqm: 4500, currency: 'USD', propertyType: 'apartment' },
    'seattle': { city: 'Seattle', country: 'USA', pricePerSqm: 7500, currency: 'USD', propertyType: 'apartment' },
    'boston': { city: 'Boston', country: 'USA', pricePerSqm: 8000, currency: 'USD', propertyType: 'apartment' },

    // Europe
    'london': { city: 'London', country: 'UK', pricePerSqm: 15000, currency: 'USD', propertyType: 'apartment' },
    'paris': { city: 'Paris', country: 'France', pricePerSqm: 13000, currency: 'USD', propertyType: 'apartment' },
    'berlin': { city: 'Berlin', country: 'Germany', pricePerSqm: 7000, currency: 'USD', propertyType: 'apartment' },
    'munich': { city: 'Munich', country: 'Germany', pricePerSqm: 9500, currency: 'USD', propertyType: 'apartment' },
    'amsterdam': { city: 'Amsterdam', country: 'Netherlands', pricePerSqm: 8500, currency: 'USD', propertyType: 'apartment' },
    'barcelona': { city: 'Barcelona', country: 'Spain', pricePerSqm: 5500, currency: 'USD', propertyType: 'apartment' },
    'madrid': { city: 'Madrid', country: 'Spain', pricePerSqm: 4500, currency: 'USD', propertyType: 'apartment' },
    'rome': { city: 'Rome', country: 'Italy', pricePerSqm: 6000, currency: 'USD', propertyType: 'apartment' },
    'milan': { city: 'Milan', country: 'Italy', pricePerSqm: 6500, currency: 'USD', propertyType: 'apartment' },
    'zurich': { city: 'Zurich', country: 'Switzerland', pricePerSqm: 14000, currency: 'USD', propertyType: 'apartment' },
    'vienna': { city: 'Vienna', country: 'Austria', pricePerSqm: 6500, currency: 'USD', propertyType: 'apartment' },
    'lisbon': { city: 'Lisbon', country: 'Portugal', pricePerSqm: 5000, currency: 'USD', propertyType: 'apartment' },

    // Asia
    'tokyo': { city: 'Tokyo', country: 'Japan', pricePerSqm: 10000, currency: 'USD', propertyType: 'apartment' },
    'hong kong': { city: 'Hong Kong', country: 'Hong Kong', pricePerSqm: 25000, currency: 'USD', propertyType: 'apartment' },
    'singapore': { city: 'Singapore', country: 'Singapore', pricePerSqm: 18000, currency: 'USD', propertyType: 'apartment' },
    'shanghai': { city: 'Shanghai', country: 'China', pricePerSqm: 9000, currency: 'USD', propertyType: 'apartment' },
    'beijing': { city: 'Beijing', country: 'China', pricePerSqm: 8500, currency: 'USD', propertyType: 'apartment' },
    'seoul': { city: 'Seoul', country: 'South Korea', pricePerSqm: 11000, currency: 'USD', propertyType: 'apartment' },
    'dubai': { city: 'Dubai', country: 'UAE', pricePerSqm: 4500, currency: 'USD', propertyType: 'apartment' },
    'bangkok': { city: 'Bangkok', country: 'Thailand', pricePerSqm: 3500, currency: 'USD', propertyType: 'apartment' },
    'mumbai': { city: 'Mumbai', country: 'India', pricePerSqm: 5000, currency: 'USD', propertyType: 'apartment' },

    // Australia
    'sydney': { city: 'Sydney', country: 'Australia', pricePerSqm: 9500, currency: 'USD', propertyType: 'apartment' },
    'melbourne': { city: 'Melbourne', country: 'Australia', pricePerSqm: 7500, currency: 'USD', propertyType: 'apartment' },

    // Canada
    'toronto': { city: 'Toronto', country: 'Canada', pricePerSqm: 8000, currency: 'USD', propertyType: 'apartment' },
    'vancouver': { city: 'Vancouver', country: 'Canada', pricePerSqm: 9000, currency: 'USD', propertyType: 'apartment' },
};

export async function fetchRealEstatePrice(city: string, propertyType: 'apartment' | 'house' = 'apartment'): Promise<RealEstatePriceData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const normalizedCity = city.toLowerCase().trim();
    const data = CITY_PRICE_DATA[normalizedCity];

    if (!data) {
        return null;
    }

    // Adjust price for houses (typically 10-20% less per sqm than apartments in city centers)
    if (propertyType === 'house' && data.propertyType === 'apartment') {
        return {
            ...data,
            pricePerSqm: Math.round(data.pricePerSqm * 0.85),
            propertyType: 'house'
        };
    }

    return data;
}

export function searchCities(query: string): string[] {
    if (!query || query.length < 2) {
        return [];
    }

    const normalizedQuery = query.toLowerCase();
    const cities = Object.values(CITY_PRICE_DATA)
        .filter(data =>
            data.city.toLowerCase().includes(normalizedQuery) ||
            data.country.toLowerCase().includes(normalizedQuery)
        )
        .map(data => data.city)
        .slice(0, 10);

    return cities;
}

export function getAllCities(): string[] {
    return Object.values(CITY_PRICE_DATA)
        .map(data => data.city)
        .sort();
}

