'use client';

import { useEffect, useState } from 'react';

interface WealthSnapshot {
    date: string;
    totalValue: number;
    cryptoValue: number;
    stocksValue: number;
    realEstateValue: number;
    cashValue: number;
}

interface WealthTrackingGraphProps {
    isEnabled: boolean;
}

export function WealthTrackingGraph({ isEnabled }: WealthTrackingGraphProps) {
    const [history, setHistory] = useState<WealthSnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'all' | '30d' | '90d' | '180d' | '365d'>('30d');

    useEffect(() => {
        if (!isEnabled) {
            setLoading(false);
            return;
        }

        loadHistory();
    }, [isEnabled]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/wealth-history');

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to load wealth history');
            }

            const data = await response.json();
            setHistory(data);
        } catch (err) {
            console.error('Error loading wealth history:', err);
            setError(err instanceof Error ? err.message : 'Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    if (!isEnabled) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Wealth Tracking
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Enable wealth tracking in settings to view your wealth history over time.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Wealth Tracking
                </h2>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Wealth Tracking
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    No wealth snapshots yet. Your first snapshot will be created automatically, or you can create one manually.
                </p>
            </div>
        );
    }

    // Filter history based on view mode
    const filterHistory = () => {
        if (viewMode === 'all') return history;

        const daysMap = { '30d': 30, '90d': 90, '180d': 180, '365d': 365 };
        const days = daysMap[viewMode];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoff = cutoffDate.toISOString().split('T')[0];

        return history.filter(h => h.date >= cutoff);
    };

    const filteredHistory = filterHistory().reverse(); // Reverse to show oldest first

    // Handle empty or single-value data
    if (filteredHistory.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Wealth Tracking
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    No wealth snapshots yet. Your first snapshot will be created automatically, or you can create one manually.
                </p>
            </div>
        );
    }

    // Calculate min/max for scaling
    const values = filteredHistory.map(h => h.totalValue).filter(v => !isNaN(v) && isFinite(v));
    if (values.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Wealth Tracking
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    No valid wealth data available.
                </p>
            </div>
        );
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1; // Prevent division by zero
    const padding = range * 0.1; // 10% padding

    // Calculate dimensions for SVG
    const svgWidth = 800;
    const svgHeight = 300;
    const chartPadding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = svgWidth - chartPadding.left - chartPadding.right;
    const chartHeight = svgHeight - chartPadding.top - chartPadding.bottom;

    // Create points for the line
    const points = filteredHistory.map((snapshot, index) => {
        const x = chartPadding.left + (index / (filteredHistory.length - 1 || 1)) * chartWidth;
        const y = chartPadding.top + chartHeight - ((snapshot.totalValue - minValue + padding) / (range + padding * 2)) * chartHeight;
        return { x, y, ...snapshot };
    }).filter(p => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y));

    // If no valid points, don't render chart
    if (points.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Wealth Tracking
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Unable to render chart. Please try taking a new snapshot.
                </p>
            </div>
        );
    }

    // Create path for the line
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Create area fill path
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - chartPadding.bottom} L ${chartPadding.left} ${svgHeight - chartPadding.bottom} Z`;

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate statistics
    const latestValue = filteredHistory[filteredHistory.length - 1]?.totalValue || 0;
    const oldestValue = filteredHistory[0]?.totalValue || 0;
    const change = latestValue - oldestValue;
    const changePercent = oldestValue > 0 ? (change / oldestValue) * 100 : 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Wealth Over Time
                    </h2>
                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(latestValue)}
                        </span>
                        <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {change >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(change))} ({changePercent.toFixed(1)}%)
                        </span>
                    </div>
                </div>

                {/* Time range selector */}
                <div className="flex gap-2">
                    {(['30d', '90d', '180d', '365d', 'all'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${viewMode === mode
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {mode === 'all' ? 'All' : mode.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="overflow-x-auto">
                <svg
                    width={svgWidth}
                    height={svgHeight}
                    className="w-full"
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                >
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = chartPadding.top + chartHeight * (1 - ratio);
                        const value = minValue + (range + padding * 2) * ratio - padding;
                        return (
                            <g key={ratio}>
                                <line
                                    x1={chartPadding.left}
                                    y1={y}
                                    x2={svgWidth - chartPadding.right}
                                    y2={y}
                                    stroke="currentColor"
                                    strokeOpacity="0.1"
                                    className="text-gray-400 dark:text-gray-600"
                                />
                                <text
                                    x={chartPadding.left - 10}
                                    y={y}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    className="text-xs fill-gray-500 dark:fill-gray-400"
                                >
                                    {formatCurrency(value)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Area fill */}
                    <path
                        d={areaPath}
                        fill="url(#gradient)"
                        opacity="0.2"
                    />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2"
                        className="dark:stroke-blue-400"
                    />

                    {/* Data points */}
                    {points.map((point, index) => (
                        <g key={index}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="#2563eb"
                                className="dark:fill-blue-400 cursor-pointer hover:r-6 transition-all"
                            />
                            <title>
                                {formatDate(point.date)}: {formatCurrency(point.totalValue)}
                            </title>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {points.filter((_, i) => {
                        const step = Math.ceil(points.length / 6);
                        return i % step === 0 || i === points.length - 1;
                    }).map((point) => (
                        <text
                            key={point.date}
                            x={point.x}
                            y={svgHeight - chartPadding.bottom + 20}
                            textAnchor="middle"
                            className="text-xs fill-gray-500 dark:fill-gray-400"
                        >
                            {formatDate(point.date)}
                        </text>
                    ))}

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#2563eb" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Crypto', value: filteredHistory[filteredHistory.length - 1]?.cryptoValue || 0, color: 'bg-yellow-500' },
                    { label: 'Stocks', value: filteredHistory[filteredHistory.length - 1]?.stocksValue || 0, color: 'bg-blue-500' },
                    { label: 'Real Estate', value: filteredHistory[filteredHistory.length - 1]?.realEstateValue || 0, color: 'bg-green-500' },
                    { label: 'Cash', value: filteredHistory[filteredHistory.length - 1]?.cashValue || 0, color: 'bg-emerald-500' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(value)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

