// Sitemap Generator Utility
import seoService from '../services/seo'

export class SitemapGenerator {
  constructor(baseUrl = 'https://3ru-rabbitry.co.za/') {
    this.baseUrl = baseUrl
    this.pages = []
  }

  // Add a page to the sitemap
  addPage(path, options = {}) {
    const page = {
      url: `${this.baseUrl}${path}`,
      lastmod: options.lastmod || new Date().toISOString(),
      changefreq: options.changefreq || 'weekly',
      priority: options.priority || 0.5
    }
    
    this.pages.push(page)
    return this
  }

  // Generate XML sitemap
  generateXML() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${this.pages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`
    
    return xml
  }

  // Generate robots.txt content
  generateRobotsTxt() {
    return `User-agent: *
Allow: /

Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /private/
Disallow: /api/
`
  }

  // Generate sitemap for Vue Router routes
  generateFromRoutes(routes, options = {}) {
    routes.forEach(route => {
      if (route.path && !route.path.includes('*')) {
        this.addPage(route.path, {
          priority: route.meta?.priority || 0.5,
          changefreq: route.meta?.changefreq || 'weekly',
          lastmod: route.meta?.lastmod || new Date().toISOString(),
          ...options
        })
      }
    })
    
    return this
  }

  // Save sitemap to file (for build process)
  saveToFile(filename = 'sitemap.xml') {
    const fs = require('fs')
    const path = require('path')
    
    const sitemapPath = path.join(process.cwd(), 'public', filename)
    fs.writeFileSync(sitemapPath, this.generateXML())
    
    console.log(`Sitemap saved to: ${sitemapPath}`)
  }
}

// Default sitemap configuration
export const defaultSitemapConfig = {
  pages: [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/features', priority: 0.8, changefreq: 'weekly' },
    { path: '/pricing', priority: 0.8, changefreq: 'weekly' },
    { path: '/login', priority: 0.6, changefreq: 'monthly' },
    { path: '/register', priority: 0.7, changefreq: 'monthly' }
  ]
}

// Generate default sitemap
export function generateDefaultSitemap(baseUrl = 'https://3ru-rabbitry.co.za/') {
  const generator = new SitemapGenerator(baseUrl)
  
  defaultSitemapConfig.pages.forEach(page => {
    generator.addPage(page.path, {
      priority: page.priority,
      changefreq: page.changefreq
    })
  })
  
  return generator
}
