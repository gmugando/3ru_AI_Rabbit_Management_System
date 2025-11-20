<template>
  <span class="currency-icon" :class="sizeClass" :title="currencyName">
    {{ currencySymbol }}
  </span>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import currencyService from '@/services/currency'

export default {
  name: 'CurrencyIcon',
  props: {
    currency: {
      type: String,
      default: null,
      validator: (value) => !value || ['USD', 'ZAR', 'GBP'].includes(value)
    },
    size: {
      type: String,
      default: 'normal',
      validator: (value) => ['small', 'normal', 'large'].includes(value)
    }
  },
  setup(props) {
    const currentCurrency = ref('ZAR')

    const currencySymbol = computed(() => {
      if (props.currency) {
        return currencyService.getSymbol(props.currency)
      }
      return currencyService.getSymbol(currentCurrency.value)
    })

    const currencyName = computed(() => {
      if (props.currency) {
        const currency = currencyService.currencyFormats[props.currency]
        return currency ? currency.name : 'Currency'
      }
      const currency = currencyService.getCurrentCurrency()
      return currency ? currency.name : 'Currency'
    })

    const sizeClass = computed(() => {
      return `currency-icon-${props.size}`
    })

    onMounted(async () => {
      // Initialize currency service to get user's preference
      await currencyService.initialize()
      currentCurrency.value = currencyService.currentCurrency
    })

    return {
      currencySymbol,
      currencyName,
      sizeClass
    }
  }
}
</script>

<style scoped>
.currency-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: inherit;
  user-select: none;
}

.currency-icon-small {
  font-size: 0.875rem;
}

.currency-icon-normal {
  font-size: 1rem;
}

.currency-icon-large {
  font-size: 1.25rem;
}
</style>

