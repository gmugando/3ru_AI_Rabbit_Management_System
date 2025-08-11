// SEO Mixin for Vue Components using @unhead/vue
// import { useHead, useSeoMeta } from '@unhead/vue'
import seoService from '../services/seo'

export default {
  methods: {
    // Set page meta tags using unhead
    setPageMeta(meta = {}) {
      const finalMeta = { ...seoService.defaultMeta, ...meta }
      
      // Temporarily disabled due to @unhead/vue issues
      // useHead({
      //   title: finalMeta.title,
      //   meta: [
      //     { name: 'description', content: finalMeta.description },
      //     { name: 'keywords', content: finalMeta.keywords },
      //     { property: 'og:title', content: finalMeta.title },
      //     { property: 'og:description', content: finalMeta.description },
      //     { property: 'og:image', content: finalMeta.image },
      //     { property: 'og:url', content: finalMeta.url },
      //     { name: 'twitter:title', content: finalMeta.title },
      //     { name: 'twitter:description', content: finalMeta.description },
      //     { name: 'twitter:image', content: finalMeta.image }
      //   ],
      //   link: [
      //     { rel: 'canonical', href: finalMeta.url }
      //   ]
      // })
      
      // Fallback to direct DOM manipulation
      seoService.updateMetaTags(finalMeta)
    },

    // Set social media meta tags using unhead
    setSocialMeta(data = {}) {
      const socialData = {
        title: data.title || seoService.defaultMeta.title,
        description: data.description || seoService.defaultMeta.description,
        image: data.image || seoService.defaultMeta.image,
        url: data.url || seoService.defaultMeta.url
      }

      // Temporarily disabled due to @unhead/vue issues
      // useSeoMeta({
      //   title: socialData.title,
      //   description: socialData.description,
      //   ogTitle: socialData.title,
      //   ogDescription: socialData.description,
      //   ogImage: socialData.image,
      //   ogUrl: socialData.url,
      //   ogType: 'website',
      //   ogSiteName: '3RU RMS',
      //   twitterCard: 'summary_large_image',
      //   twitterTitle: socialData.title,
      //   twitterDescription: socialData.description,
      //   twitterImage: socialData.image
      // })
      
      // Fallback to direct DOM manipulation
      seoService.addSocialMetaTags(socialData)
    },

    // Add structured data (still using the service for JSON-LD)
    addStructuredData(data) {
      seoService.addStructuredData(data)
    },

    // Add organization data
    addOrganizationData() {
      seoService.addOrganizationData()
    },

    // Add software application data
    addSoftwareData() {
      seoService.addSoftwareData()
    },

    // Add FAQ structured data
    addFAQData(faqs) {
      seoService.addFAQData(faqs)
    },

    // Add breadcrumb data
    addBreadcrumbData(breadcrumbs) {
      seoService.addBreadcrumbData(breadcrumbs)
    },

    // Preload resource using unhead
    preloadResource(href, as = 'fetch', crossorigin = false) {
      // Temporarily disabled due to @unhead/vue issues
      // useHead({
      //   link: [
      //     {
      //       rel: 'preload',
      //       href,
      //       as,
      //       ...(crossorigin && { crossorigin: 'anonymous' })
      //     }
      //   ]
      // })
      
      // Fallback to direct DOM manipulation
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      if (crossorigin) {
        link.crossOrigin = 'anonymous'
      }
      document.head.appendChild(link)
    },

    // Generate meta description from content
    generateMetaDescription(content, maxLength = 160) {
      const text = content.replace(/<[^>]*>/g, '').trim()
      return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text
    },

    // Generate keywords from content
    generateKeywords(content, maxKeywords = 10) {
      const words = content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
      
      const wordCount = {}
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
      
      return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, maxKeywords)
        .map(([word]) => word)
        .join(', ')
    }
  },

  mounted() {
    // Auto-generate meta description if not provided
    if (this.$el && !this.metaDescription) {
      const content = this.$el.textContent || this.$el.innerText
      if (content) {
        const description = this.generateMetaDescription(content)
        this.setPageMeta({ description })
      }
    }
  }
}
