# Multi-Currency Support Implementation

## Overview
Implemented multi-currency support with user preferences for displaying financial amounts in USD ($), ZAR (R), or GBP (£).

## Implementation Details

### 1. Currency Service (`src/services/currency.js`)
- Centralized currency formatting and management
- Supports USD, ZAR, and GBP with proper symbols and locale formatting
- Automatically loads user's currency preference from database
- Provides methods for formatting amounts with currency symbols

### 2. User Preferences Integration
- Added currency dropdown to Preferences page under "Display Preferences"
- Default currency set to ZAR (South African Rand)
- Stored in `user_preferences` table in database
- Users can switch between currencies in real-time

### 3. Dashboard Integration
- Updated dashboard service to initialize currency service
- Dashboard now displays financial amounts in user's preferred currency
- Real-time formatting based on user preferences

## Supported Currencies

| Code | Symbol | Name | Locale |
|------|--------|------|--------|
| USD | $ | US Dollar | en-US |
| ZAR | R | South African Rand | en-ZA |
| GBP | £ | British Pound | en-GB |

## Usage Examples

### Setting Currency Preference
1. Go to Settings → Preferences
2. Under "Display Preferences", select preferred currency
3. Save changes
4. All financial amounts will update immediately

### For Developers

```javascript
import currencyService from '@/services/currency'

// Initialize (loads user preference)
await currencyService.initialize()

// Format amount with user's preferred currency
const formatted = currencyService.format(1234.56)
// Returns: "R1,234.56" (if user prefers ZAR)

// Format with specific currency
const usdFormatted = currencyService.format(1234.56, 'USD')
// Returns: "$1,234.56"

// Get just the symbol
const symbol = currencyService.getSymbol()
// Returns: "R" (if user prefers ZAR)
```

## Currency Formatting Rules

### ZAR (South African Rand)
- Format: `R1,234.56`
- Symbol appears before amount
- Uses en-ZA locale for number formatting

### USD (US Dollar)
- Format: `$1,234.56`
- Uses native Intl.NumberFormat with USD currency
- Full currency formatting with en-US locale

### GBP (British Pound)
- Format: `£1,234.56`
- Symbol appears before amount
- Uses en-GB locale for number formatting

## Database Schema

### user_preferences table
```sql
currency text default 'ZAR'
```

## Features

### Current Implementation
- ✅ Currency selection in preferences
- ✅ Real-time formatting on dashboard
- ✅ Persistent user preferences
- ✅ Fallback to default currency (ZAR)
- ✅ Support for USD, ZAR, GBP

### Future Enhancements
- 🔄 Currency conversion with live exchange rates
- 🔄 Additional currency support (EUR, CAD, AUD, etc.)
- 🔄 Historical exchange rate data
- 🔄 Multi-currency transaction tracking
- 🔄 Currency-specific number formatting preferences

## Files Modified

### Core Files
- `src/services/currency.js` - New currency service
- `src/views/settings/AppPreferences.vue` - Added currency dropdown
- `src/views/dashboard/AppDashboard.vue` - Integration with currency service
- `src/services/dashboard.js` - Currency service initialization

### Database
- `supabase/migrations/create_user_preferences_table.sql` - Updated default currency to ZAR

## Testing

### Manual Testing Steps
1. **Default Currency**: New users should see ZAR (R) by default
2. **Currency Selection**: 
   - Go to Preferences
   - Change currency to USD
   - Save preferences
   - Navigate to dashboard
   - Verify amounts show with $ symbol
3. **Persistence**: 
   - Refresh page
   - Verify currency preference is maintained
4. **Fallback**: 
   - Clear preferences
   - Verify fallback to ZAR works

### Edge Cases Handled
- Invalid currency codes fallback to default (ZAR)
- Missing user preferences fallback to default
- Database connection errors fallback gracefully
- Invalid amounts default to 0

## Best Practices

### For Developers
1. Always use `currencyService.format()` for displaying financial amounts
2. Initialize currency service before using formatting functions
3. Handle async initialization properly
4. Use specific currency codes when needed (e.g., for reports)

### For Users
1. Set currency preference in Settings → Preferences
2. Currency affects all financial displays across the application
3. Changes take effect immediately without page refresh

## Troubleshooting

### Common Issues
1. **Currency not updating**: Clear browser cache and refresh
2. **Wrong symbol showing**: Check user preferences are saved correctly
3. **Formatting errors**: Verify currency service is initialized

### Debug Information
Enable console logging to see:
- Currency service initialization
- User preference loading
- Formatting function calls
- Error messages for troubleshooting
