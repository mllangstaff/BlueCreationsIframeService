(function() {
  'use strict';
  
  // Configuration injected by server
  const CONFIG = {{CONFIG_PLACEHOLDER}};
  
  // Widget state
  let isLoaded = false;
  let isTracked = false;
  
  // Create widget container
  function createWidget() {
    const container = document.createElement('div');
    container.id = 'campaign-widget-' + (CONFIG.campaignName || CONFIG.campaignId);
    container.className = 'campaign-widget';
    
    // Base styles
    const baseStyles = {
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      cursor: 'pointer',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      maxWidth: '100%',
      backdropFilter: 'blur(10px)'
    };
    
    // Size configurations - enhanced for dialogue content with combined HTML and text
    const sizeConfig = {
      small: { width: '280px', height: '180px', fontSize: '12px' },
      medium: { width: '350px', height: '250px', fontSize: '14px' },
      large: { width: '450px', height: '320px', fontSize: '16px' },
      // Special dialogue sizes for combined content (text + products)
      dialogue: { width: '550px', height: 'auto', minHeight: '400px', maxHeight: '700px', fontSize: '14px' },
      modal: { width: '650px', height: 'auto', minHeight: '500px', maxHeight: '800px', fontSize: '15px' }
    };
    
    // Theme configurations
    const themeConfig = {
      light: { 
        backgroundColor: '#ffffff', 
        textColor: '#333333',
        borderColor: '#e0e0e0'
      },
      dark: { 
        backgroundColor: '#2d2d2d', 
        textColor: '#ffffff',
        borderColor: '#444444'
      }
    };
    
    // Auto-detect if we should use dialogue sizing based on content type
    let sizeKey = CONFIG.size || 'medium';
    if (CONFIG.contentType === 'dialogue' || CONFIG.contentType === 'modal') {
      sizeKey = CONFIG.contentType;
    }
    
    const size = sizeConfig[sizeKey] || sizeConfig.medium;
    const theme = themeConfig[CONFIG.theme] || themeConfig.light;
    
    // Apply styles
    Object.assign(container.style, baseStyles, size, theme);
    
    // For dialogue/modal content, remove the default click cursor
    if (sizeKey === 'dialogue' || sizeKey === 'modal') {
      container.style.cursor = 'default';
    }
    
    return container;
  }
  
  // Create loading state
  function createLoadingState() {
    const loading = document.createElement('div');
    loading.className = 'campaign-widget-loading';
    loading.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column;">
        <div style="width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px;"></div>
        <div style="font-size: 12px; color: #666;">Loading campaign...</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    return loading;
  }
  
  // Create error state
  function createErrorState(message) {
    const error = document.createElement('div');
    error.className = 'campaign-widget-error';
    error.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; color: #666; text-align: center; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
        <div style="font-size: 12px;">${message || 'Campaign unavailable'}</div>
      </div>
    `;
    return error;
  }
  
  // Create campaign content
  function createCampaignContent(campaign) {
    const content = document.createElement('div');
    content.className = 'campaign-widget-content';
    
    // If campaign has custom HTML/CSS from backend, combine it with persuasive text
    if (campaign.html && campaign.html.trim() && campaign.html !== '<div>No campaign available</div>') {
      console.log('BlueCreations Widget: Combining backend HTML with persuasive text');
      
      // Set up container with proper styling
      content.style.cssText = `
        height: 100%;
        width: 100%;
        position: relative;
        overflow: auto;
        background: #ffffff;
        padding: 20px;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
      `;
      
      // Create the combined HTML structure
      let combinedHTML = '';
      
      // Add persuasive text header if available
      if (campaign.text && campaign.text.trim()) {
        const title = campaign.title || extractTitleFromText(campaign.text) || 'Special Recommendation';
        combinedHTML += `
          <div class="widget-header" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h2 style="margin: 0 0 10px 0; color: #333; font-size: 18px; font-weight: bold;">${title}</h2>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.5;">${campaign.text}</p>
          </div>
        `;
      }
      
      // Add the backend HTML (products)
      combinedHTML += `
        <div class="widget-products" style="margin-top: ${campaign.text ? '0' : '10px'};">
          ${campaign.html}
        </div>
      `;
      
      // Set the combined HTML
      content.innerHTML = combinedHTML;
      
      // Inject CSS if available
      if (campaign.css && campaign.css.trim()) {
        const style = document.createElement('style');
        style.textContent = campaign.css;
        document.head.appendChild(style);
      }
      
      // Add close button to custom content
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.className = 'widget-close-btn';
      closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(0,0,0,0.1);
        border: none;
        color: #666;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;
      
      // Add hover effects
      closeBtn.onmouseenter = function() {
        this.style.background = 'rgba(0,0,0,0.2)';
        this.style.color = '#333';
      };
      closeBtn.onmouseleave = function() {
        this.style.background = 'rgba(0,0,0,0.1)';
        this.style.color = '#666';
      };
      
      closeBtn.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        hideWidget();
      };
      content.appendChild(closeBtn);
      
      // Add click tracking to any buttons or links in the backend HTML
      setTimeout(() => {
        const buttons = content.querySelectorAll('button, a, .clickable, [onclick]');
        buttons.forEach(button => {
          if (!button.classList.contains('widget-close-btn')) {
            button.addEventListener('click', (e) => {
              const targetUrl = button.href || button.dataset.url || campaign.ctaUrl || '#';
              console.log('BlueCreations Widget: Tracking click on:', targetUrl);
              trackClick(targetUrl);
            });
          }
        });
      }, 100);
      
      return content;
    }
    
    // Fallback to default widget design
    content.style.cssText = `
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      background: linear-gradient(135deg, ${campaign.backgroundColor || '#007bff'} 0%, ${adjustBrightness(campaign.backgroundColor || '#007bff', -20)} 100%);
      color: ${campaign.textColor || '#ffffff'};
      padding: 20px;
      box-sizing: border-box;
    `;
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255,255,255,0.2);
      border: none;
      color: ${campaign.textColor || '#ffffff'};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeBtn.onclick = function(e) {
      e.stopPropagation();
      hideWidget();
    };
    
    // Header section
    const headerSection = document.createElement('div');
    headerSection.style.cssText = `
      text-align: center;
      margin-bottom: 16px;
    `;
    
    // Get first product image if available
    const firstProductImage = campaign.products && campaign.products.length > 0 
      ? campaign.products[0].image 
      : campaign.imageUrl;
    
    if (firstProductImage) {
      headerSection.innerHTML += `
        <img src="${firstProductImage}" 
             style="max-width: 100px; max-height: 80px; margin: 0 auto 12px; border-radius: 8px; display: block;" 
             onerror="this.style.display='none'">
      `;
    }
    
    // Title/Header
    const title = campaign.title || extractTitleFromText(campaign.text) || 'Special Offer';
    headerSection.innerHTML += `
      <h2 style="margin: 0 0 8px; font-size: ${CONFIG.size === 'small' ? '16px' : '18px'}; font-weight: bold; line-height: 1.2;">${title}</h2>
    `;
    
    // Persuasive text section
    const textSection = document.createElement('div');
    textSection.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: left;
      margin-bottom: 16px;
    `;
    
    // Display the persuasive text from backend
    const persuasiveText = campaign.text || campaign.description || 'Discover amazing products at great prices!';
    textSection.innerHTML = `
      <p style="margin: 0; font-size: ${CONFIG.size === 'small' ? '12px' : '14px'}; line-height: 1.4; opacity: 0.95;">
        ${persuasiveText}
      </p>
    `;
    
    // CTA section
    const ctaSection = document.createElement('div');
    ctaSection.style.cssText = `
      text-align: center;
      margin-top: auto;
    `;
    
    ctaSection.innerHTML = `
      <button style="
        background: rgba(255,255,255,0.25);
        border: 1px solid rgba(255,255,255,0.4);
        color: ${campaign.textColor || '#ffffff'};
        padding: 12px 24px;
        border-radius: 25px;
        font-size: ${CONFIG.size === 'small' ? '12px' : '14px'};
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        min-width: 120px;
      " onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.25)'">
        ${campaign.ctaText || 'Learn More'}
      </button>
    `;
    
    content.appendChild(closeBtn);
    content.appendChild(headerSection);
    content.appendChild(textSection);
    content.appendChild(ctaSection);
    
    return content;
  }
  
  // Utility function to adjust color brightness
  function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  
  // Helper function to extract title from persuasive text
  function extractTitleFromText(text) {
    if (!text) return 'Special Offer!';
    
    // Split by common separators and take the first part as title
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const title = sentences[0].trim();
      // If it's too long, truncate it
      return title.length > 50 ? title.substring(0, 47) + '...' : title;
    }
    
    // Fallback: take first 50 characters
    return text.length > 50 ? text.substring(0, 47) + '...' : text;
  }
  
  // Collect user profile data
  function collectUserProfile() {
    try {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Error collecting user profile:', error);
      return {};
    }
  }
  
  // Track impression
  function trackImpression() {
    if (isTracked) return;
    isTracked = true;
    
    const trackingData = {
      campaignId: CONFIG.campaignName || CONFIG.campaignId,
      campaignName: CONFIG.campaignName,
      userId: CONFIG.userId,
      timestamp: new Date().toISOString(),
      profile: collectUserProfile()
    };
    
    fetch(`${CONFIG.trackingUrl}/track/impression`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData)
    }).catch(error => {
      console.warn('Failed to track impression:', error);
    });
  }
  
  // Track click
  function trackClick(targetUrl) {
    const trackingData = {
      campaignId: CONFIG.campaignName || CONFIG.campaignId,
      campaignName: CONFIG.campaignName,
      userId: CONFIG.userId,
      targetUrl: targetUrl,
      timestamp: new Date().toISOString(),
      profile: collectUserProfile()
    };
    
    fetch(`${CONFIG.trackingUrl}/track/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData)
    }).catch(error => {
      console.warn('Failed to track click:', error);
    });
  }
  
  // Hide widget
  function hideWidget() {
    const widget = document.getElementById('campaign-widget-' + (CONFIG.campaignName || CONFIG.campaignId));
    if (widget) {
      widget.style.display = 'none';
    }
  }
  
  // Load campaign data
  function loadCampaign() {
    const campaignIdentifier = CONFIG.campaignName || CONFIG.campaignId;
    const params = new URLSearchParams();
    
    // Only append non-empty parameters
    if (CONFIG.userId) params.append('userId', CONFIG.userId);
    if (CONFIG.objective) params.append('objective', CONFIG.objective);
    if (CONFIG.brandName) params.append('brandName', CONFIG.brandName);
    
    const url = `${CONFIG.trackingUrl}/campaigns/${encodeURIComponent(campaignIdentifier)}?${params.toString()}`;
    
    console.log('BlueCreations Widget: Fetching campaign from:', url);
    
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => {
      console.log('BlueCreations Widget: API response status:', response.status);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('BlueCreations Widget: Received campaign data:', data);
      return data;
    })
    .catch(error => {
      console.error('BlueCreations Widget: Campaign loading error:', error);
      console.error('BlueCreations Widget: Request URL was:', url);
      throw error;
    });
  }
  
  // Initialize widget
  function initWidget() {
    if (isLoaded) return;
    isLoaded = true;
    
    console.log('BlueCreations Widget: Initializing with config:', CONFIG);
    
    // Validate required configuration
    if (!CONFIG.campaignId && !CONFIG.campaignName) {
      console.error('BlueCreations Widget Error: Campaign ID or Campaign Name is required');
      return;
    }
    
    try {
      // Create widget container
      const widget = createWidget();
      const loadingState = createLoadingState();
      widget.appendChild(loadingState);
      
      // Add to DOM
      document.body.appendChild(widget);
      
      // Position widget
      const positions = {
        'top-left': { top: '20px', left: '20px' },
        'top-right': { top: '20px', right: '20px' },
        'bottom-left': { bottom: '20px', left: '20px' },
        'bottom-right': { bottom: '20px', right: '20px' },
        'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      };
      
      const position = positions[CONFIG.position] || positions['bottom-right'];
      Object.assign(widget.style, { position: 'fixed', zIndex: '9999' }, position);
      
      console.log('BlueCreations Widget: Container created, loading campaign data...');
      
      // Load campaign data
      const loadTimeout = setTimeout(() => {
        console.warn('BlueCreations Widget: Loading timeout after', CONFIG.timeout, 'ms');
        widget.innerHTML = '';
        widget.appendChild(createErrorState('Loading timeout'));
      }, CONFIG.timeout);
      
      loadCampaign()
        .then(campaign => {
          console.log('BlueCreations Widget: Campaign loaded successfully:', campaign);
          clearTimeout(loadTimeout);
          widget.innerHTML = '';
          
          const content = createCampaignContent(campaign);
          widget.appendChild(content);
          
          // Add click handler only for non-dialogue/modal content
          if (CONFIG.contentType !== 'dialogue' && CONFIG.contentType !== 'modal') {
            widget.onclick = function(e) {
              e.preventDefault();
              trackClick(campaign.ctaUrl);
              if (campaign.ctaUrl) {
                window.open(campaign.ctaUrl, '_blank');
              }
            };
            
            // Add hover effects for clickable widgets
            widget.onmouseenter = function() {
              widget.style.transform = 'scale(1.02)';
              widget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
            };
            
            widget.onmouseleave = function() {
              widget.style.transform = 'scale(1)';
              widget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            };
          }
          
          // Track impression
          trackImpression();
          
          console.log('BlueCreations Widget: Successfully initialized');
        })
        .catch(error => {
          console.error('BlueCreations Widget: Failed to load campaign:', error);
          clearTimeout(loadTimeout);
          widget.innerHTML = '';
          widget.appendChild(createErrorState('Failed to load campaign'));
        });
    } catch (error) {
      console.error('BlueCreations Widget: Initialization error:', error);
    }
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
  
})();