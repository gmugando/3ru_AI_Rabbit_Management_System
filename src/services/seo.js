// SEO Service for managing meta tags and structured data
import { getDomain, getFullUrl, getEmailDomain } from '@/utils/config'

class SEOService {
  constructor() {
    // Get domain from config utility
    const domain = getDomain()
    
    this.defaultMeta = {
      title: '3RU RMS - AI-Powered Rabbit Management System',
      description: 'Revolutionize your rabbit farming with artificial intelligence. Comprehensive features for breeding, health monitoring, and farm management.',
      keywords: 'rabbit management, rabbit farming, AI farming, breeding management, rabbit health, farm automation, livestock management',
      image: getFullUrl('/og-image.jpg'),
      url: getFullUrl('/')
    }
    
    // Store domain for use in other methods
    this.domain = domain
  }

  // Update meta tags for a page
  updateMetaTags(meta = {}) {
    const finalMeta = { ...this.defaultMeta, ...meta }
    
    // Update title
    document.title = finalMeta.title
    
    // Update meta description
    this.updateMetaTag('description', finalMeta.description)
    
    // Update keywords
    this.updateMetaTag('keywords', finalMeta.keywords)
    
    // Update Open Graph tags
    this.updateMetaTag('og:title', finalMeta.title)
    this.updateMetaTag('og:description', finalMeta.description)
    this.updateMetaTag('og:image', finalMeta.image)
    this.updateMetaTag('og:url', finalMeta.url)
    
    // Update Twitter tags
    this.updateMetaTag('twitter:title', finalMeta.title)
    this.updateMetaTag('twitter:description', finalMeta.description)
    this.updateMetaTag('twitter:image', finalMeta.image)
    
    // Update canonical URL
    this.updateCanonical(finalMeta.url)
  }

  // Update specific meta tag
  updateMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`) || 
               document.querySelector(`meta[property="${name}"]`)
    
    if (!meta) {
      meta = document.createElement('meta')
      if (name.startsWith('og:')) {
        meta.setAttribute('property', name)
      } else {
        meta.setAttribute('name', name)
      }
      document.head.appendChild(meta)
    }
    
    meta.setAttribute('content', content)
  }

  // Update canonical URL
  updateCanonical(url) {
    let canonical = document.querySelector('link[rel="canonical"]')
    
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    
    canonical.setAttribute('href', url)
  }

  // Add structured data (JSON-LD)
  addStructuredData(data) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }

  // Add organization structured data
  addOrganizationData() {
    const orgData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "3RU RMS",
      "url": getFullUrl('/'),
      "logo": getFullUrl('/logo.png'),
      "description": "AI-Powered Rabbit Management System",
      "sameAs": [
        "https://twitter.com/3ru_rms",
        "https://linkedin.com/company/3ru-rms"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+27-74-079-8159",
        "contactType": "customer service",
        "email": `support@${getEmailDomain()}`
      }
    }
    
    this.addStructuredData(orgData)
  }

  // Add software application structured data
  addSoftwareData() {
    const softwareData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "3RU RMS",
      "description": "AI-Powered Rabbit Management System for modern farming",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "AI-Driven Breeding Recommendations",
        "Predictive Health Analytics",
        "Automated Farm Management",
        "Rabbit Data Storage",
        "Financial Tracking",
        "Task Management"
      ]
    }
    
    this.addStructuredData(softwareData)
  }

  // Add FAQ structured data
  addFAQData(faqs) {
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    }
    
    this.addStructuredData(faqData)
  }

  // Add breadcrumb structured data
  addBreadcrumbData(breadcrumbs) {
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    }
    
    this.addStructuredData(breadcrumbData)
  }

  // Generate sitemap data
  generateSitemapData(pages) {
    return pages.map(page => ({
      url: page.url,
      lastmod: page.lastmod || new Date().toISOString(),
      changefreq: page.changefreq || 'weekly',
      priority: page.priority || 0.5
    }))
  }

  // Preload critical resources
  preloadResource(href, as = 'fetch', crossorigin = false) {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (crossorigin) {
      link.crossOrigin = 'anonymous'
    }
    document.head.appendChild(link)
  }

  // Add meta tags for social sharing
  addSocialMetaTags(data = {}) {
    const socialData = {
      title: data.title || this.defaultMeta.title,
      description: data.description || this.defaultMeta.description,
      image: data.image || this.defaultMeta.image,
      url: data.url || this.defaultMeta.url
    }

    // Open Graph
    this.updateMetaTag('og:title', socialData.title)
    this.updateMetaTag('og:description', socialData.description)
    this.updateMetaTag('og:image', socialData.image)
    this.updateMetaTag('og:url', socialData.url)
    this.updateMetaTag('og:type', 'website')
    this.updateMetaTag('og:site_name', '3RU RMS')

    // Twitter
    this.updateMetaTag('twitter:card', 'summary_large_image')
    this.updateMetaTag('twitter:title', socialData.title)
    this.updateMetaTag('twitter:description', socialData.description)
    this.updateMetaTag('twitter:image', socialData.image)
  }
}

// Create singleton instance
const seoService = new SEOService()

export default seoService
