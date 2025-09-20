// Custom JavaScript for Simple Agentics Living Books

// Enhanced subscription management
class EnhancedSubscriptionManager {
  constructor() {
    this.isSubscribed = false;
    this.customerId = null;
    this.subscriptionId = null;
    this.trialDays = 7;
    this.init();
  }
  
  init() {
    this.checkSubscriptionStatus();
    this.setupEventListeners();
    this.initializeAnalytics();
    this.setupContentProtection();
  }
  
  checkSubscriptionStatus() {
    const subscriptionData = localStorage.getItem('subscription_data');
    const trialData = localStorage.getItem('trial_data');
    
    if (subscriptionData) {
      const data = JSON.parse(subscriptionData);
      this.isSubscribed = data.active;
      this.customerId = data.customer_id;
      this.subscriptionId = data.subscription_id;
    } else if (trialData) {
      const trial = JSON.parse(trialData);
      const trialEnd = new Date(trial.end_date);
      const now = new Date();
      
      if (now < trialEnd) {
        this.isSubscribed = true;
        this.isTrial = true;
      }
    }
    
    this.updateUI();
  }
  
  updateUI() {
    const statusEl = document.querySelector('.access-status');
    const portalBtn = document.getElementById('customer-portal-btn');
    const subscribeButtons = document.querySelectorAll('.subscribe-btn');
    
    if (this.isSubscribed) {
      if (this.isTrial) {
        const trialData = JSON.parse(localStorage.getItem('trial_data'));
        const daysLeft = Math.ceil((new Date(trialData.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        
        statusEl.className = 'access-status premium';
        statusEl.innerHTML = `
          <i class="fas fa-clock"></i> 
          Free Trial Active - ${daysLeft} days remaining. 
          <a href="#" class="subscribe-btn" style="margin-left: 10px; padding: 5px 10px; font-size: 14px;">
            Subscribe Now
          </a>
        `;
      } else {
        statusEl.className = 'access-status premium';
        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Premium Access Active - Enjoy unlimited access to all Living Books and Workbooks!';
        portalBtn.style.display = 'inline-block';
      }
      
      statusEl.style.display = 'block';
      this.unlockContent();
      
    } else {
      statusEl.className = 'access-status free';
      statusEl.innerHTML = `
        <i class="fas fa-info-circle"></i> 
        Free Preview - 
        <a href="#" class="start-trial-btn" style="color: #3498db; text-decoration: underline;">
          Start ${this.trialDays}-day free trial
        </a> 
        or subscribe for full access!
      `;
      statusEl.style.display = 'block';
      portalBtn.style.display = 'none';
      this.lockContent();
    }
  }
  
  unlockContent() {
    document.querySelectorAll('.locked-content').forEach(el => {
      el.classList.remove('locked-content');
    });
    
    // Show premium sections
    document.querySelectorAll('.premium-content').forEach(el => {
      el.style.display = 'block';
    });
  }
  
  lockContent() {
    // Lock premium content sections
    const premiumSections = document.querySelectorAll('.premium-content');
    premiumSections.forEach(el => {
      if (!el.classList.contains('locked-content')) {
        el.classList.add('locked-content');
      }
    });
  }
  
  setupContentProtection() {
    // Automatically lock content based on URL patterns
    const currentPath = window.location.hash.replace('#/', '');
    const premiumPaths = [
      'managing-the-machines/module',
      'ai-team-leaders-playbook/module',
      'workbooks/',
      'resources/templates',
      'community/forum'
    ];
    
    const isPremiumPath = premiumPaths.some(path => currentPath.includes(path));
    
    if (isPremiumPath && !this.isSubscribed) {
      setTimeout(() => {
        const content = document.querySelector('.markdown-section');
        if (content && !content.classList.contains('locked-content')) {
          content.classList.add('locked-content');
        }
      }, 500);
    }
  }
  
  async startTrial() {
    try {
      // In production, this would validate email and create trial
      const email = prompt('Enter your email to start your free trial:');
      if (!email || !this.validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
      }
      
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + this.trialDays);
      
      const trialData = {
        email: email,
        start_date: new Date().toISOString(),
        end_date: trialEnd.toISOString(),
        trial_id: 'trial_' + Date.now()
      };
      
      localStorage.setItem('trial_data', JSON.stringify(trialData));
      this.isTrial = true;
      this.isSubscribed = true;
      this.updateUI();
      
      // Track trial start
      this.trackEvent('trial_started', { email: email });
      
      alert(`🎉 Your ${this.trialDays}-day free trial has started! You now have full access to all content.`);
      
    } catch (error) {
      console.error('Trial start error:', error);
      alert('Sorry, there was an error starting your trial. Please try again.');
    }
  }
  
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  async subscribe() {
    try {
      // Track subscription attempt
      this.trackEvent('subscription_attempt');
      
      // In production, this would integrate with your Stripe backend
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: 'price_YOUR_PRICE_ID_HERE',
          trial_from_local: this.isTrial
        }),
      });
      
      if (response.ok) {
        const session = await response.json();
        const result = await stripe.redirectToCheckout({
          sessionId: session.id,
        });
        
        if (result.error) {
          console.error('Stripe error:', result.error);
          this.trackEvent('subscription_error', { error: result.error.message });
        }
      } else {
        throw new Error('Failed to create checkout session');
      }
      
    } catch (error) {
      console.error('Subscription error:', error);
      // For demo purposes, simulate successful subscription
      this.simulateSubscription();
    }
  }
  
  simulateSubscription() {
    const subscriptionData = {
      active: true,
      customer_id: 'cus_demo_' + Date.now(),
      subscription_id: 'sub_demo_' + Date.now(),
      plan: 'monthly',
      amount: 700 // $7.00 in cents
    };
    
    localStorage.setItem('subscription_data', JSON.stringify(subscriptionData));
    localStorage.removeItem('trial_data'); // Remove trial data
    
    this.isSubscribed = true;
    this.isTrial = false;
    this.customerId = subscriptionData.customer_id;
    this.subscriptionId = subscriptionData.subscription_id;
    
    this.updateUI();
    this.trackEvent('subscription_completed', { plan: 'monthly' });
    
    alert('🎉 Demo: Subscription activated! In production, this would be handled by Stripe.');
  }
  
  setupEventListeners() {
    // Subscribe buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('subscribe-btn')) {
        e.preventDefault();
        this.subscribe();
      }
      
      if (e.target.classList.contains('start-trial-btn')) {
        e.preventDefault();
        this.startTrial();
      }
    });
    
    // Customer portal
    const portalBtn = document.getElementById('customer-portal-btn');
    if (portalBtn) {
      portalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openCustomerPortal();
      });
    }
    
    // Track page views
    window.addEventListener('hashchange', () => {
      this.trackPageView();
      this.setupContentProtection();
    });
  }
  
  async openCustomerPortal() {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: this.customerId,
        }),
      });
      
      if (response.ok) {
        const session = await response.json();
        window.open(session.url, '_blank');
      } else {
        throw new Error('Failed to create portal session');
      }
      
    } catch (error) {
      console.error('Portal error:', error);
      alert('Demo: Customer portal would open here. In production, this would redirect to Stripe Customer Portal.');
    }
  }
  
  initializeAnalytics() {
    // Initialize analytics tracking
    this.trackPageView();
  }
  
  trackEvent(eventName, properties = {}) {
    // In production, integrate with your analytics service
    console.log('Analytics Event:', eventName, properties);
    
    // Example: Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
    
    // Example: Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(eventName, properties);
    }
  }
  
  trackPageView() {
    const page = window.location.hash.replace('#/', '') || 'home';
    this.trackEvent('page_view', { 
      page: page,
      subscription_status: this.isSubscribed ? 'subscribed' : 'free',
      is_trial: this.isTrial || false
    });
  }
}

// Content enhancement functions
function enhanceContent() {
  // Add copy buttons to code blocks
  addCopyButtons();
  
  // Add reading progress indicator
  addReadingProgress();
  
  // Add table of contents
  addTableOfContents();
  
  // Add print button
  addPrintButton();
  
  // Enhance images with zoom
  enhanceImages();
}

function addCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.innerHTML = '<i class="fas fa-copy"></i>';
    button.title = 'Copy code';
    
    button.addEventListener('click', () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          button.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
      });
    });
    
    block.parentElement.style.position = 'relative';
    block.parentElement.appendChild(button);
  });
}

function addReadingProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress';
  progressBar.innerHTML = '<div class="reading-progress-bar"></div>';
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    const progressBarFill = document.querySelector('.reading-progress-bar');
    if (progressBarFill) {
      progressBarFill.style.width = scrolled + '%';
    }
  });
}

function addTableOfContents() {
  const headings = document.querySelectorAll('.markdown-section h2, .markdown-section h3');
  if (headings.length < 3) return;
  
  const toc = document.createElement('div');
  toc.className = 'table-of-contents';
  toc.innerHTML = '<h4><i class="fas fa-list"></i> Table of Contents</h4><ul></ul>';
  
  const tocList = toc.querySelector('ul');
  
  headings.forEach((heading, index) => {
    const id = `heading-${index}`;
    heading.id = id;
    
    const li = document.createElement('li');
    li.className = heading.tagName.toLowerCase();
    li.innerHTML = `<a href="#${id}">${heading.textContent}</a>`;
    tocList.appendChild(li);
  });
  
  const firstHeading = document.querySelector('.markdown-section h1');
  if (firstHeading) {
    firstHeading.parentNode.insertBefore(toc, firstHeading.nextSibling);
  }
}

function addPrintButton() {
  const printBtn = document.createElement('button');
  printBtn.className = 'print-btn';
  printBtn.innerHTML = '<i class="fas fa-print"></i> Print';
  printBtn.title = 'Print this page';
  
  printBtn.addEventListener('click', () => {
    window.print();
  });
  
  const customerPortal = document.querySelector('.customer-portal');
  if (customerPortal) {
    customerPortal.appendChild(printBtn);
  }
}

function enhanceImages() {
  const images = document.querySelectorAll('.markdown-section img');
  images.forEach(img => {
    img.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.className = 'image-modal';
      modal.innerHTML = `
        <div class="image-modal-content">
          <span class="image-modal-close">&times;</span>
          <img src="${img.src}" alt="${img.alt}">
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.querySelector('.image-modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize enhanced subscription manager
  window.subscriptionManager = new EnhancedSubscriptionManager();
  
  // Enhance content after Docsify loads
  setTimeout(enhanceContent, 1000);
});

// Re-enhance content when navigating
window.addEventListener('hashchange', () => {
  setTimeout(enhanceContent, 500);
});

// Export for global access
window.EnhancedSubscriptionManager = EnhancedSubscriptionManager;

