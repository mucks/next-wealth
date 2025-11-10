# 📥📤 Import/Export Guide

## Overview

Your wealth tracker supports backing up and restoring data via JSON files. This is useful for:
- 💾 **Backups** - Save your data before making changes
- 🔄 **Migration** - Move data between accounts
- 🤝 **Sharing** - Share portfolio with family/accountant
- 🛡️ **Safety** - Extra protection against data loss

---

## 📤 Export (Download Backup)

### How to Export:
1. Sign in to your account
2. Click the **"Export"** button (📥 icon) in the top-right
3. Your browser downloads: `wealth-tracker-backup-YYYY-MM-DD.json`
4. Save it somewhere safe (Downloads, Dropbox, etc.)

### What Gets Exported:
- ✅ All crypto assets with current prices
- ✅ All stock holdings
- ✅ All real estate properties
- ✅ All cash accounts
- ✅ Notes and metadata

### What Doesn't Get Exported:
- ❌ User account info (email/password)
- ❌ Historical price data

---

## 📥 Import (Upload Backup)

### How to Import:
1. Sign in to your account
2. Click the **"Import"** button (📤 icon) in the top-right
3. Select your JSON backup file
4. Confirm the import
5. See success message: "✓ X assets imported"

### Important Notes:
- 📌 **Import ADDS assets** (doesn't delete existing ones)
- 📌 **New IDs Generated**: The app automatically generates new unique IDs for imported assets to prevent conflicts
- 📌 **Safe to Re-import**: You can import the same file multiple times without ID conflicts
- 📌 **Validation**: Invalid JSON files will be rejected
- 📌 **Errors**: You'll see which assets failed to import (if any)

### ID Handling:
The app **automatically generates new IDs** for all imported assets using:
- **Timestamp** + **Random String** = Guaranteed unique IDs
- Example: `"1731283200000abc123def"`

**Why?** This prevents duplicate ID conflicts if you:
- Import the same file twice
- Share/merge portfolios between accounts
- Restore from an old backup while having new data

### Safety Tips:
- ✅ Export before importing (just in case!)
- ✅ Review the JSON file before importing
- ✅ Test with a small file first
- ✅ Safe to import the same file multiple times

---

## 📋 JSON File Format

### Structure:
```json
{
  "crypto": [ /* array of crypto assets */ ],
  "stocks": [ /* array of stock assets */ ],
  "realEstate": [ /* array of real estate assets */ ],
  "cash": [ /* array of cash accounts */ ]
}
```

### Example File:

See **`example-backup.json`** in the project root for a complete working example!

---

## 📚 Asset Field Reference

### Crypto Asset:
```json
{
  "id": "1699564800001",
  "name": "Bitcoin",
  "type": "crypto",
  "coinId": "bitcoin",
  "symbol": "BTC",
  "quantity": 0.5,
  "currentPrice": 35000,
  "priceChange24h": 2.5,
  "purchaseDate": "2024-01-15",
  "notes": "Optional notes"
}
```

**Required fields**: `id`, `name`, `type`, `coinId`, `symbol`, `quantity`, `currentPrice`, `purchaseDate`
**Optional fields**: `priceChange24h`, `notes`
**Note**: The `id` field will be regenerated on import, so any unique string works here

### Stock Asset:
```json
{
  "id": "1699564800002",
  "name": "Apple Inc.",
  "type": "stock",
  "symbol": "AAPL",
  "quantity": 10,
  "currentPrice": 175.50,
  "priceChange24h": 0.8,
  "purchaseDate": "2024-03-10",
  "notes": "Tech portfolio"
}
```

**Required fields**: `id`, `name`, `type`, `symbol`, `quantity`, `currentPrice`, `purchaseDate`
**Optional fields**: `priceChange24h`, `notes`
**Note**: The `id` field will be regenerated on import, so any unique string works here

### Real Estate Asset:
```json
{
  "id": "1699564800003",
  "name": "Apartment in New York",
  "type": "real-estate",
  "address": "123 Main Street, Apt 4B",
  "city": "New York",
  "squareMeters": 85,
  "pricePerSqm": 12000,
  "propertyType": "apartment",
  "purchaseDate": "2023-06-15",
  "notes": "Investment property"
}
```

**Required fields**: `id`, `name`, `type`, `address`, `city`, `squareMeters`, `pricePerSqm`, `propertyType`, `purchaseDate`
**Optional fields**: `notes`
**Property types**: `"house"`, `"apartment"`, `"commercial"`, `"land"`, `"other"`
**Note**: The `id` field will be regenerated on import, so any unique string works here

### Cash Asset:
```json
{
  "id": "1699564800004",
  "name": "Emergency Fund",
  "type": "cash",
  "amount": 50000,
  "currency": "USD",
  "purchaseDate": "2024-01-01",
  "notes": "6 months expenses"
}
```

**Required fields**: `id`, `name`, `type`, `amount`, `currency`, `purchaseDate`
**Optional fields**: `notes`
**Common currencies**: `"USD"`, `"EUR"`, `"GBP"`, `"JPY"`, `"CHF"`, `"CAD"`, `"AUD"`, etc.
**Note**: The `id` field will be regenerated on import, so any unique string works here

---

## 🔧 Advanced: Manual Editing

You can manually edit the JSON file to:
- Update asset names
- Change quantities
- Fix data errors
- Bulk edit multiple assets
- Create a template for bulk importing

**Tips:**
- Use a JSON validator (https://jsonlint.com) to check syntax
- Don't worry about IDs - they'll be regenerated on import automatically
- For quick creation: Copy an example asset, modify the data, and import
- Keep the structure intact (all 4 arrays: crypto, stocks, realEstate, cash)

---

## 🆘 Troubleshooting

### "Invalid backup file format"
- Make sure the JSON has all 4 arrays: `crypto`, `stocks`, `realEstate`, `cash`
- Check JSON syntax is valid
- Verify file isn't corrupted

### "X failed" during import
- Check browser console for specific errors
- Verify required fields are present
- Ensure data types match (numbers as numbers, strings as strings)

### Import succeeds but assets don't appear
- Refresh the page
- Check you're signed into the correct account
- Verify assets were added: check the database or export again

---

## 💡 Use Cases

### Backup Before Big Changes:
```bash
1. Export current data
2. Make changes
3. If something goes wrong → Import backup
```

### Migrate to New Account:
```bash
1. Account A: Export
2. Account B: Sign in
3. Account B: Import
```

### Share With Accountant:
```bash
1. Export your portfolio
2. Email the JSON file
3. They can view it or import it
```

### Restore After Safari Clears Data:
```bash
1. (Before) Export regularly as backup
2. (After Safari clears) Import last backup
3. Your data is restored!
```

---

## 📊 Testing Import

Want to test the import feature? Use the provided **`example-backup.json`**:

1. Click "Import"
2. Select `example-backup.json`
3. See 8 sample assets imported:
   - 2 crypto (Bitcoin, Ethereum)
   - 2 stocks (Apple US, Apple XETRA)
   - 2 real estate (NYC apartment, SF house)
   - 2 cash (USD, EUR)
4. Explore the app with sample data!
5. Delete assets you don't want

---

## 🔐 Security Note

**JSON files contain your financial data!**
- 🔒 Don't share publicly
- 🔒 Store securely (encrypted folders, password managers)
- 🔒 Use secure channels if sharing (encrypted email, Signal, etc.)

Your Supabase database is already secure with Row Level Security, but exported JSON files are just text files - treat them like sensitive documents!

