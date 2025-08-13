import { supabase } from '@/supabase'

class CurrencyService {
  constructor() {
    this.defaultCurrency = 'ZAR'
    this.currencyFormats = {
      USD: {
        symbol: '$',
        code: 'USD',
        locale: 'en-US',
        name: 'US Dollar'
      },
      ZAR: {
        symbol: 'R',
        code: 'ZAR',
        locale: 'en-ZA',
        name: 'South African Rand'
      },
      GBP: {
        symbol: '£',
        code: 'GBP',
        locale: 'en-GB',
        name: 'British Pound'
      }
    }
    this.currentCurrency = this.defaultCurrency
  }

  // Initialize currency from user preferences
  async initialize() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('currency')
          .eq('user_id', user.id)
          .single()
        
        if (preferences?.currency) {
          this.currentCurrency = preferences.currency
        }
      }
    } catch (error) {
      console.error('Error loading currency preference:', error)
      this.currentCurrency = this.defaultCurrency
    }
  }

  // Set current currency
  setCurrency(currencyCode) {
    if (this.currencyFormats[currencyCode]) {
      this.currentCurrency = currencyCode
    }
  }

  // Get current currency info
  getCurrentCurrency() {
    return this.currencyFormats[this.currentCurrency] || this.currencyFormats[this.defaultCurrency]
  }

  // Format amount with currency symbol
  format(amount, currencyCode = null) {
    const currency = currencyCode ? this.currencyFormats[currencyCode] : this.getCurrentCurrency()
    const numericAmount = parseFloat(amount) || 0

    // For simple formatting with symbol prefix
    if (currency.code === 'ZAR' || currency.code === 'GBP') {
      return `${currency.symbol}${numericAmount.toLocaleString(currency.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    } else {
      // For USD, use standard locale formatting
      return numericAmount.toLocaleString(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  }

  // Format amount with full currency name
  formatWithName(amount, currencyCode = null) {
    const currency = currencyCode ? this.currencyFormats[currencyCode] : this.getCurrentCurrency()
    const formatted = this.format(amount, currencyCode)
    return `${formatted} ${currency.code}`
  }

  // Get just the symbol
  getSymbol(currencyCode = null) {
    const currency = currencyCode ? this.currencyFormats[currencyCode] : this.getCurrentCurrency()
    return currency.symbol
  }

  // Get currency code
  getCode(currencyCode = null) {
    const currency = currencyCode ? this.currencyFormats[currencyCode] : this.getCurrentCurrency()
    return currency.code
  }

  // Get all available currencies
  getAvailableCurrencies() {
    return Object.keys(this.currencyFormats).map(code => ({
      code,
      ...this.currencyFormats[code]
    }))
  }

  // Convert between currencies (placeholder - you might want to add real exchange rates)
  convert(amount, fromCurrency, toCurrency) {
    // This is a placeholder for currency conversion
    // In a real app, you'd integrate with an exchange rate API
    const exchangeRates = {
      USD: { ZAR: 18.5, GBP: 0.79, USD: 1 },
      ZAR: { USD: 0.054, GBP: 0.043, ZAR: 1 },
      GBP: { USD: 1.27, ZAR: 23.5, GBP: 1 }
    }

    const rate = exchangeRates[fromCurrency]?.[toCurrency] || 1
    return parseFloat(amount) * rate
  }
}

export default new CurrencyService()
