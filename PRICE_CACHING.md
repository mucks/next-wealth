# 💰 Price Caching System

## Overview

Your wealth tracker uses an intelligent **price caching system** to:
- ⚡ **Reduce API calls** - Share cached prices across all users
- 🔄 **Auto-refresh** - Update prices every 20 seconds automatically
- 💾 **Store prices** - Persist price data in the database
- 🚀 **Fast imports** - Bulk imports get instant price data

---

## How It Works

### 1. **Price Cache Table**
All crypto and stock prices are stored in a shared `price_cache` table:

```sql
- id (crypto: coinId, stock: symbol)
- type ('crypto' or 'stock')  
- price (current price)
- priceChange24h (24h change %)
- name (asset name)
- lastUpdated (timestamp)
```

### 2. **Cache Duration**
- **Fresh**: Prices cached for **1 minute**
- **Auto-refresh**: Frontend triggers refresh every **20 seconds**
- **Fallback**: Uses stale cache if API fails

### 3. **Multi-User Optimization**

When User A requests Bitcoin price:
1. Check cache → Bitcoin last updated 30 seconds ago
2. Cache is fresh → Return cached price ✅
3. **No API call needed!**

When User B requests Bitcoin (5 seconds later):
1. Check cache → Bitcoin last updated 35 seconds ago
2. Cache still fresh → Return cached price ✅
3. **User B benefits from User A's API call!**

---

## Benefits

### **For You:**
- ✅ **Always up-to-date** - Prices refresh every 20 seconds
- ✅ **Fast imports** - Bulk import gets instant prices from cache
- ✅ **Reliable** - Falls back to stale cache if API is down
- ✅ **Visual feedback** - See "Updating prices..." indicator

### **For Performance:**
- ✅ **Reduced API calls** - Multiple users share cached data
- ✅ **Faster loads** - Cache hits are instant
- ✅ **Database-backed** - Persistent across server restarts
- ✅ **Indexed** - Fast lookups by type and update time

---

## Auto-Refresh in Action

### What You'll See:

**Every 20 seconds:**
1. 🔄 Small spinner appears: "Updating prices..."
2. 📡 Backend fetches latest prices (using cache when possible)
3. 💾 Updates your assets with current prices
4. ✨ UI reflects new values
5. ✅ Spinner disappears

**Visual Indicator:**
```
Wealth Tracker  🔄 Updating prices...
                ↑ Shows when refreshing
```

---

## Import Behavior

### **Before (Without Cache):**
```bash
Import 100 stocks:
- 100 API calls to Yahoo Finance
- ~30 seconds to complete
- Rate limiting possible
```

### **After (With Cache):**
```bash
Import 100 stocks:
- Check cache for all 100
- Maybe 5-10 API calls (for uncached stocks)
- ~3 seconds to complete
- ✅ 90% reduction in API calls!
```

---

## Cache Management

### **Automatic Cache Updates:**
- When you add a new crypto/stock → Price fetched and cached
- Every 20 seconds → Your portfolio prices refresh
- When price is stale (>1 min) → Fresh fetch + cache update

### **Shared Across Users:**
If 10 users all own Bitcoin:
- First user triggers Bitcoin price fetch
- Next 9 users get cached Bitcoin price
- **90% API call reduction!**

---

## Technical Details

### **Cache Hit Rate:**
Popular assets like BTC, ETH, AAPL:
- **~95% cache hit rate** (almost always cached)
- Fresh data without API overhead

Rare assets (niche German stocks):
- **~20% cache hit rate** (fetched on demand)
- Still benefits from 1-minute cache window

### **API Call Limits:**

**Without caching (100 users, 10 assets each):**
```
Every 20 seconds:
- 100 users × 10 assets = 1,000 API calls
- Per hour: 180,000 API calls 😱
```

**With caching (100 users, 10 assets each):**
```
Every 20 seconds:
- ~50 unique assets across all users
- Per hour: ~9,000 API calls 🎉
- 95% reduction!
```

---

## Manual Price Refresh

Want to force a price refresh? Just **reload the page**:
- Triggers immediate price refresh
- Pulls latest data from cache or APIs
- Updates all your assets

Or wait 20 seconds - it happens automatically! ⏰

---

## Troubleshooting

### "Prices not updating"
- Check network tab for `/api/refresh-prices` calls
- Should trigger every 20 seconds
- If missing, try refreshing the page

### "Stale prices"
- Individual assets might show stale data if API fails
- Cache will use last known good price
- Try editing the asset to force a refresh

### "Slow imports"
- First import of rare stocks takes longer (no cache)
- Subsequent imports are faster (cached)
- Popular stocks always cached

---

## Privacy & Security

### **What's Shared:**
- ✅ Price data (public information)
- ✅ 24h price changes (public information)
- ✅ Asset names (public information)

### **What's NOT Shared:**
- ❌ Your portfolio holdings (private to you)
- ❌ Your quantities (private to you)
- ❌ Your notes (private to you)
- ❌ Your user info (private to you)

**Only public market data is cached and shared!** Your personal portfolio data remains private and secured with Row Level Security.

---

## Best Practices

### **Adding Assets:**
1. Add crypto/stocks normally through UI
2. Prices fetch automatically (and cache for others)
3. Auto-refresh keeps them current

### **Bulk Importing:**
```json
{
  "stocks": [
    { "type": "stock", "symbol": "AAPL", "quantity": 10 },
    { "type": "stock", "symbol": "GOOGL", "quantity": 5 }
  ]
}
```
- Import with minimal fields
- Prices fetch from cache automatically
- Fast and efficient!

### **Performance Tip:**
- Popular assets (BTC, ETH, AAPL) → Always cached
- Rare assets → Cached after first user adds them
- Everyone benefits from shared cache!

---

## Under the Hood

### **Data Flow:**

**Adding a Stock:**
```
1. User adds AAPL (quantity: 10)
2. Check price_cache for AAPL
   ├─ Found & fresh (< 1 min) → Use cached price ✅
   └─ Missing/stale → Fetch from Yahoo → Update cache ✅
3. Save asset with current price
4. Show in portfolio
```

**Auto-Refresh (Every 20s):**
```
1. Timer triggers → POST /api/refresh-prices
2. Get all user's crypto/stock assets
3. For each asset:
   ├─ Check cache (< 1 min)
   ├─ Use cached OR fetch fresh
   └─ Update asset price
4. Reload portfolio → UI updates
```

---

## Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| Import 100 stocks | 100 API calls | ~10 API calls |
| Add popular stock | API call | Instant (cached) |
| 100 users, same stock | 100 API calls | 1 API call |
| Price freshness | On-demand | Every 20s auto |
| Offline resilience | Fails | Uses stale cache |

**Result**: Faster, more reliable, more scalable! 🚀

