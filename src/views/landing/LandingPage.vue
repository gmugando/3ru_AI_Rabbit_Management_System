<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <header class="hero">
      <nav class="nav-bar" :class="{ responsive: isNavOpen }" id="myTopnav">
        <div class="logo">
          <img src="@/assets/logo.png" alt="RMS Logo">
          <span>3RU RMS</span>
        </div>
                 <div class="nav-links">
           <a href="#features" @click="closeNav">Features</a>
           <a href="#pricing" @click="closeNav">Pricing</a>
           <div class="auth-buttons">
             <router-link to="/login" class="btn-login" @click="closeNav">Login</router-link>
             <router-link to="/register" class="btn-register" @click="closeNav">Register</router-link>
           </div>
         </div>
        <a href="javascript:void(0);" class="icon" @click="toggleNav">
          <i class="pi pi-bars"></i>
        </a>
      </nav>
      <div class="hero-content">
        <div class="hero-text">
          <h1>AI-Powered Rabbit Management System</h1>
          <p class="hero-subtitle">Revolutionize your rabbit farming with artificial intelligence</p>
          <div class="hero-cta">
            <router-link to="/register" class="btn-primary">Get Started</router-link>
            <a href="#features" class="btn-secondary">Learn More</a>
          </div>
          <div class="hero-images">
            <img src="https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=500&q=80" alt="Modern Rabbit Farm" class="hero-image">
            <img src="https://images.unsplash.com/photo-1452857297128-d9c29adba80b?auto=format&fit=crop&w=500&q=80" alt="Digital Rabbit Management" class="hero-image">
          </div>
        </div>
        <div class="feature-slider">
          <div class="slider-content" :class="'slide-' + currentSlide">
            <div class="slide">
              <i class="pi pi-brain"></i>
              <h3>AI-Driven Breeding Recommendations</h3>
              <p>Smart algorithms suggest optimal breeding pairs based on genetics and performance</p>
            </div>
            <div class="slide">
              <i class="pi pi-chart-line"></i>
              <h3>Predictive Health Analytics</h3>
              <p>AI monitors health patterns to predict and prevent potential issues</p>
            </div>
            <div class="slide">
              <i class="pi pi-cog"></i>
              <h3>Automated Farm Management</h3>
              <p>AI-powered scheduling and task automation for optimal efficiency</p>
            </div>
          </div>
          <div class="slider-dots">
            <button 
              v-for="n in 3" 
              :key="n" 
              :class="{ active: currentSlide === n }"
              @click="currentSlide = n"
            ></button>
          </div>
        </div>
      </div>
    </header>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="section-header">
        <h2>Comprehensive Features</h2>
        <p>Everything you need to manage your rabbit farm efficiently</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <i class="mdi mdi-rabbit"></i>
          </div>
          <h3>Basic Rabbit Data Storage</h3>
          <p>Capture and retrieve essential data about each rabbit including date of birth, genotype, and origin.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="mdi mdi-rabbit-variant"></i>
          </div>
          <h3>Breed Plan Management</h3>
          <p>Automatically generate and manage farm-wide breed plans without missing any scheduled tasks.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-dollar"></i>
          </div>
          <h3>Rabbitry Ledger</h3>
          <p>Automate financial record keeping with accurate tracking of all incomes and expenses.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <h3>Task Management</h3>
          <p>Never miss out on any rabbitry task with our notification system and task tracker.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-sitemap"></i>
          </div>
          <h3>Rabbit Pedigrees</h3>
          <p>Easily record and retrieve different generations of individual rabbits on your farm.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-heart"></i>
          </div>
          <h3>Health Data Management</h3>
          <p>Track diseases, treatments, and medications used for your rabbits.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="mdi mdi-food-variant"></i>
          </div>
          <h3>Rabbit Feeds Monitoring</h3>
          <p>Record and track feed types and portions given to your rabbits over time.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-chart-line"></i>
          </div>
          <h3>Weight Tracking</h3>
          <p>Monitor rabbit weight changes with visual graphs showing trends over time.</p>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="pricing">
      <div class="section-header">
        <h2>Simple, Transparent Pricing</h2>
        <p>Choose the plan that fits your farm size</p>
      </div>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-header">
            <h3>Starter</h3>
            <div class="price">
              <span class="amount">Free</span>
              <span class="period">/month</span>
            </div>
          </div>
          <ul class="pricing-features">
            <li><i class="pi pi-check"></i> Up to 5 rabbits</li>
            <li><i class="pi pi-check"></i> Basic features included</li>
            <li><i class="pi pi-check"></i> Community support</li>
          </ul>
          <router-link to="/register" class="btn-primary">Get Started</router-link>
        </div>

        <div class="pricing-card popular">
          <div class="popular-badge">Most Popular</div>
          <div class="pricing-header">
            <h3>Growth</h3>
            <div class="price">
              <span class="currency">$</span>
              <span class="amount">20</span>
              <span class="period">/month</span>
            </div>
          </div>
          <ul class="pricing-features">
            <li><i class="pi pi-check"></i> 5-100 rabbits</li>
            <li><i class="pi pi-check"></i> All features included</li>
            <li><i class="pi pi-check"></i> Priority support</li>
            <li><i class="pi pi-check"></i> Advanced reporting</li>
          </ul>
          <router-link to="/register" class="btn-primary">Get Started</router-link>
        </div>

        <div class="pricing-card">
          <div class="pricing-header">
            <h3>Enterprise</h3>
            <div class="price">
              <span class="currency">$</span>
              <span class="amount">45</span>
              <span class="period">/month</span>
            </div>
          </div>
          <ul class="pricing-features">
            <li><i class="pi pi-check"></i> 100-500 rabbits</li>
            <li><i class="pi pi-check"></i> All features included</li>
            <li><i class="pi pi-check"></i> 24/7 support</li>
            <li><i class="pi pi-check"></i> Custom solutions</li>
          </ul>
          <router-link to="/register" class="btn-primary">Get Started</router-link>
        </div>

        <div class="pricing-card custom">
          <div class="pricing-header">
            <h3>Custom</h3>
            <div class="price">
              <span class="amount">Contact Us</span>
            </div>
          </div>
          <ul class="pricing-features">
            <li><i class="pi pi-check"></i> 500+ rabbits</li>
            <li><i class="pi pi-check"></i> Custom features</li>
            <li><i class="pi pi-check"></i> Dedicated support</li>
            <li><i class="pi pi-check"></i> Custom integration</li>
          </ul>
          <a href="mailto:contact@3ru-rms.com" class="btn-secondary">Contact Sales</a>
        </div>
      </div>
    </section>

    <!-- Additional Features -->
    <section class="additional-features">
      <div class="section-header">
        <h2>Additional Features</h2>
        <p>More powerful tools to enhance your farm management</p>
      </div>
      <div class="features-list">
        <div class="feature-item">
          <i class="pi pi-qrcode"></i>
          <h3>QR Code Cage Data Access</h3>
          <p>Instantly retrieve rabbit data by scanning cage QR codes</p>
        </div>
        <div class="feature-item">
          <i class="pi pi-images"></i>
          <h3>Rich Media Support</h3>
          <p>Record data as photos, certificates, and show winnings</p>
        </div>
        <div class="feature-item">
          <i class="pi pi-chart-bar"></i>
          <h3>Detailed Reporting</h3>
          <p>Comprehensive dashboard with key metrics and analytics</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>About 3RU RMS</h4>
          <p>A comprehensive rabbit management system designed for modern farming needs.</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <router-link to="/login">Login</router-link>
          <router-link to="/register">Register</router-link>
        </div>
        <div class="footer-section">
          <h4>Contact</h4>
          <p>Email: support@{{ getEmailDomain() }}</p>
          <p>Phone: +27 74 079 8159</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 3RU Rabbit Management System. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import seoService from '@/services/seo'
import { getFullUrl, getEmailDomain } from '@/utils/config'

export default {
  name: 'LandingPage',
  setup() {
    const currentSlide = ref(1)
    const isNavOpen = ref(false)
    let slideshowInterval = null

    const toggleNav = () => {
      console.log('Toggle nav clicked, current state:', isNavOpen.value)
      isNavOpen.value = !isNavOpen.value
      console.log('New state:', isNavOpen.value)
    }

    const closeNav = () => {
      isNavOpen.value = false
      // Smooth scroll to section after a small delay to allow menu to close
      setTimeout(() => {
        const hash = window.location.hash
        if (hash) {
          const element = document.querySelector(hash)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }
      }, 100)
    }

    const startSlideshow = () => {
      slideshowInterval = setInterval(() => {
        currentSlide.value = currentSlide.value === 3 ? 1 : currentSlide.value + 1
      }, 5000)
    }

    const closeNavOnResize = () => {
      if (window.innerWidth > 768) {
        isNavOpen.value = false
      }
    }

    onMounted(() => {
      startSlideshow()
      window.addEventListener('resize', closeNavOnResize)
      
      // Set SEO meta tags directly using the service
      seoService.updateMetaTags({
        title: '3RU RMS - AI-Powered Rabbit Management System',
        description: 'Revolutionize your rabbit farming with artificial intelligence. Comprehensive features for breeding, health monitoring, and farm management.',
        keywords: 'rabbit management, rabbit farming, AI farming, breeding management, rabbit health, farm automation, livestock management',
        url: getFullUrl(window.location.pathname)
      })
      
      // Add structured data
      seoService.addOrganizationData()
      seoService.addSoftwareData()
      
      // Add FAQ structured data
      const faqs = [
        {
          question: 'What is 3RU RMS?',
          answer: '3RU RMS is an AI-powered rabbit management system that helps farmers manage their rabbit farms efficiently with features like breeding recommendations, health monitoring, and financial tracking.'
        },
        {
          question: 'How does AI help in rabbit farming?',
          answer: 'Our AI system provides breeding recommendations, predicts health issues, and automates farm management tasks to optimize your rabbit farming operations.'
        },
        {
          question: 'Is 3RU RMS free to use?',
          answer: 'We offer a free starter plan for up to 5 rabbits, with premium plans available for larger farms.'
        }
      ]
      seoService.addFAQData(faqs)
    })

    onUnmounted(() => {
      if (slideshowInterval) {
        clearInterval(slideshowInterval)
      }
      window.removeEventListener('resize', closeNavOnResize)
    })

    return {
      currentSlide,
      isNavOpen,
      toggleNav,
      closeNav,
      getEmailDomain
    }
  }
}
</script>

<style scoped>
.landing-page {
  background: #ffffff;
}

/* Navigation */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo img {
  height: 40px;
}

.logo span {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links a {
  color: #64748b;
  text-decoration: none;
  transition: color 0.3s ease;
  padding: 0.5rem 1rem;
}

.nav-links a:hover {
  color: #3b82f6;
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Hamburger menu icon */
.icon {
  display: none;
  color: #64748b;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.75rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  z-index: 1001;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.icon:hover {
  color: #3b82f6;
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

/* Hero Section */
.hero {
  min-height: 40vh;
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
  color: white;
  padding: 4rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  padding: 2rem 0;
}

.hero-text {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero h1 {
  font-size: 3rem;
  margin: 0;
  background: linear-gradient(120deg, #ffffff, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
}

.hero-cta {
  display: flex;
  gap: 1rem;
}

.hero-images {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.hero-image {
  width: calc(50% - 0.5rem);
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.hero-image:hover {
  transform: translateY(-5px);
}

/* Buttons */
.btn-primary {
  background: #4f46e5;
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 600;
  border: 2px solid #4f46e5;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background: #6366f1;
  border-color: #6366f1;
  box-shadow: 0 6px 8px rgba(79, 70, 229, 0.3);
  transform: translateY(-1px);
}

.btn-secondary {
  background: white;
  color: #3b82f6;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-login {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-login:hover {
  color: #4f46e5;
}

.btn-register {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  color: #4f46e5;
  text-decoration: none;
  border: 2px solid #4f46e5;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-register:hover {
  background: rgba(79, 70, 229, 0.1);
  transform: translateY(-1px);
}

/* Features Section */
.features {
  padding: 6rem 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-header h2 {
  font-size: 2.5rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.section-header p {
  color: #64748b;
  font-size: 1.25rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #64748b;
}

/* Pricing Section */
.pricing {
  padding: 6rem 2rem;
  background: #f8fafc;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.pricing-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
}

.pricing-card.popular {
  border: 2px solid #3b82f6;
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #3b82f6;
  color: white;
  padding: 0.25rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.pricing-header {
  text-align: center;
  margin-bottom: 2rem;
}

.price {
  font-size: 2.5rem;
  color: #1e293b;
  margin: 1rem 0;
}

.period {
  font-size: 1rem;
  color: #64748b;
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.pricing-features li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #64748b;
}

.pricing-features i {
  color: #10b981;
}

/* Additional Features */
.additional-features {
  padding: 6rem 2rem;
}

.features-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-item {
  text-align: center;
  padding: 2rem;
}

.feature-item i {
  font-size: 2.5rem;
  color: #3b82f6;
  margin-bottom: 1rem;
}

/* Footer */
.footer {
  background: #1e293b;
  color: white;
  padding: 4rem 2rem 2rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.footer-section h4 {
  margin-bottom: 1rem;
}

.footer-section a {
  display: block;
  color: #94a3b8;
  text-decoration: none;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: white;
}

.footer-bottom {
  text-align: center;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid #334155;
  color: #94a3b8;
}

/* Feature Slider */
.feature-slider {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  position: relative;
  height: 300px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.slider-content {
  position: relative;
  height: 100%;
  transition: transform 0.5s ease;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.5s ease;
}

.slide i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #60a5fa;
}

.slide h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.slide p {
  color: rgba(255, 255, 255, 0.9);
}

.slide-1 .slide:nth-child(1),
.slide-2 .slide:nth-child(2),
.slide-3 .slide:nth-child(3) {
  opacity: 1;
  transform: translateX(0);
}

.slider-dots {
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.slider-dots button {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
}

.slider-dots button.active {
  background: white;
  transform: scale(1.2);
}

/* Responsive Navigation - Modern Mobile Menu */
@media screen and (max-width: 768px) {
  /* Override any dark mode styles */
  .landing-page .nav-bar.responsive {
    background: rgba(30, 41, 59, 0.95) !important;
  }
  .nav-bar {
    padding: 1rem;
  }

  .nav-links {
    display: none;
  }

  .nav-bar.responsive {
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem;
    min-height: auto;
    background: rgba(30, 41, 59, 0.95) !important;
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .nav-bar.responsive .nav-links {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0;
    margin-top: 1.5rem;
    padding: 0 0.5rem;
  }

  .landing-page .nav-bar.responsive .nav-links a {
    display: block;
    padding: 1.25rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0 !important;
    font-weight: 500;
    transition: all 0.3s ease;
    font-size: 1.1rem;
  }

  .nav-bar.responsive .nav-links a:hover {
    color: #60a5fa;
    background: rgba(255, 255, 255, 0.05);
    padding-left: 0.5rem;
  }

  .nav-bar.responsive .auth-buttons {
    flex-direction: column;
    width: 100%;
    gap: 1rem;
    margin-top: 2rem;
    padding: 1.5rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    align-items: center;
  }

  .nav-bar.responsive .auth-buttons a {
    text-align: center;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    margin: 0.25rem 0;
    min-width: 120px;
  }

  .nav-bar.responsive .btn-login {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #e2e8f0 !important;
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .nav-bar.responsive .btn-login:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    transform: translateY(-1px);
  }

  .nav-bar.responsive .btn-register {
    background: #3b82f6 !important;
    color: #ffffff !important;
    border: 2px solid #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .nav-bar.responsive .btn-register:hover {
    background: #2563eb;
    border-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .icon {
    display: block;
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
  }

  .nav-bar.responsive .icon {
    position: absolute;
    right: 1rem;
    top: 1rem;
    color: #e2e8f0;
  }

  .nav-bar.responsive .icon:hover {
    color: #60a5fa;
  }

  /* Hero responsive adjustments */
  .hero {
    min-height: auto;
    padding: 6rem 1rem 2rem;
  }

  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 2rem;
  }

  .hero h1 {
    font-size: 2rem;
  }

  .hero-cta {
    justify-content: center;
  }

  .hero-images {
    justify-content: center;
    margin-top: 1rem;
  }

  .hero-image {
    width: 140px;
    height: 100px;
  }

  .feature-slider {
    height: 250px;
    margin-top: 1rem;
  }
}

@media screen and (min-width: 769px) {
  .icon {
    display: none;
  }
}
</style> 