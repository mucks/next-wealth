import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            console.error(`Yahoo Finance API error for ${symbol}: ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch stock price' }, { status: response.status });
        }

        const data = await response.json();

        if (!data.chart?.result?.[0]) {
            return NextResponse.json({ error: 'No data found for symbol' }, { status: 404 });
        }

        if (data.chart?.error) {
            return NextResponse.json({ error: data.chart.error.description }, { status: 400 });
        }

        const result = data.chart.result[0];
        const quote = result.meta;
        const currentPrice = quote.regularMarketPrice;
        const previousClose = quote.chartPreviousClose || quote.previousClose;

        if (!currentPrice) {
            return NextResponse.json({ error: 'Price data not available' }, { status: 404 });
        }

        const change = currentPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        return NextResponse.json({
            symbol: symbol,
            name: result.meta.longName || result.meta.shortName || symbol,
            price: currentPrice,
            change: change,
            changePercent: changePercent,
        });
    } catch (error) {
        console.error('Error fetching stock price:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

