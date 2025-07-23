/**
 * Campaign Widget Iframe Helper
 * Provides utility functions for generating properly configured iframe code
 */

class CampaignWidgetHelper {
    constructor(baseUrl = 'http://localhost:3002') {
        this.baseUrl = baseUrl;
    }

    /**
     * Generate iframe HTML for a campaign widget
     * @param {Object} config - Widget configuration
     * @param {string} config.campaignName - Campaign name (required)
     * @param {string} config.userId - User identifier
     * @param {string} config.contentType - 'widget', 'dialogue', or 'modal'
     * @param {string} config.size - 'small', 'medium', 'large', 'dialogue', or 'modal'
     * @param {string} config.theme - 'light' or 'dark'
     * @param {string} config.objective - User objective for targeting
     * @param {string} config.brandName - Brand context
     * @param {string} config.position - Widget position
     * @param {Object} config.dimensions - Custom width/height override
     * @param {Object} config.styles - Additional CSS styles
     * @returns {string} HTML iframe code
     */
    generateIframe(config) {
        if (!config.campaignName) {
            throw new Error('campaignName is required');
        }

        // Build URL parameters
        const params = new URLSearchParams();
        params.append('campaignName', config.campaignName);
        
        if (config.userId) params.append('userId', config.userId);
        if (config.contentType) params.append('contentType', config.contentType);
        if (config.size) params.append('size', config.size);
        if (config.theme) params.append('theme', config.theme);
        if (config.objective) params.append('objective', config.objective);
        if (config.brandName) params.append('brandName', config.brandName);
        if (config.position) params.append('position', config.position);

        // Determine dimensions based on size/contentType
        const dimensions = this.getDimensions(config);
        
        // Build iframe attributes
        const src = `${this.baseUrl}/widget?${params.toString()}`;
        const width = config.dimensions?.width || dimensions.width;
        const height = config.dimensions?.height || dimensions.height;
        
        // Build styles
        const styles = this.buildStyles(config, dimensions);
        
        return `<iframe src="${src}" width="${width}" height="${height}" frameborder="0" ${styles ? `style="${styles}"` : ''}></iframe>`;
    }

    /**
     * Get recommended dimensions for a given configuration
     */
    getDimensions(config) {
        const sizeMap = {
            small: { width: 280, height: 180 },
            medium: { width: 350, height: 250 },
            large: { width: 450, height: 320 },
            dialogue: { width: 400, height: 350 },
            modal: { width: 500, height: 400 }
        };

        // Prioritize contentType over size for dimensions
        const key = config.contentType === 'dialogue' || config.contentType === 'modal' 
            ? config.contentType 
            : config.size || 'medium';

        return sizeMap[key] || sizeMap.medium;
    }

    /**
     * Build CSS styles for the iframe
     */
    buildStyles(config, dimensions) {
        const styles = [];
        
        // Always add border radius for modern look
        styles.push('border-radius: 12px');
        
        // Add shadow for dialogue/modal types
        if (config.contentType === 'dialogue' || config.contentType === 'modal') {
            styles.push('box-shadow: 0 8px 32px rgba(0,0,0,0.12)');
        }
        
        // For dialogue/modal, make resizable
        if (config.contentType === 'dialogue' || config.contentType === 'modal') {
            styles.push('resize: both');
            styles.push('overflow: auto');
        }

        // Add any custom styles
        if (config.styles) {
            Object.entries(config.styles).forEach(([key, value]) => {
                styles.push(`${key}: ${value}`);
            });
        }

        return styles.join('; ');
    }

    /**
     * Generate responsive iframe code that adapts to container size
     */
    generateResponsiveIframe(config, containerSelector = '.widget-container') {
        const iframe = this.generateIframe(config);
        const dimensions = this.getDimensions(config);
        
        return `
<div class="responsive-widget-container" style="width: 100%; max-width: ${dimensions.width}px;">
    ${iframe}
</div>

<style>
.responsive-widget-container iframe {
    width: 100%;
    height: auto;
    min-height: ${dimensions.height}px;
    aspect-ratio: ${dimensions.width}/${dimensions.height};
}

@media (max-width: 768px) {
    .responsive-widget-container {
        max-width: 100%;
        padding: 0 10px;
    }
}
</style>`;
    }

    /**
     * Generate JavaScript code for dynamic iframe loading
     */
    generateDynamicLoader(config, containerId) {
        const configJson = JSON.stringify(config, null, 2);
        
        return `
function loadCampaignWidget() {
    const config = ${configJson};
    const helper = new CampaignWidgetHelper('${this.baseUrl}');
    const iframe = helper.generateIframe(config);
    document.getElementById('${containerId}').innerHTML = iframe;
}

// Load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCampaignWidget);
} else {
    loadCampaignWidget();
}`;
    }

    /**
     * Validate configuration object
     */
    validateConfig(config) {
        const errors = [];
        
        if (!config.campaignName) {
            errors.push('campaignName is required');
        }
        
        if (config.contentType && !['widget', 'dialogue', 'modal'].includes(config.contentType)) {
            errors.push('contentType must be one of: widget, dialogue, modal');
        }
        
        if (config.size && !['small', 'medium', 'large', 'dialogue', 'modal'].includes(config.size)) {
            errors.push('size must be one of: small, medium, large, dialogue, modal');
        }
        
        if (config.theme && !['light', 'dark'].includes(config.theme)) {
            errors.push('theme must be either light or dark');
        }
        
        return errors;
    }
}

// Usage examples:
/*
const helper = new CampaignWidgetHelper();

// Basic widget
const basicWidget = helper.generateIframe({
    campaignName: 'summer-sale',
    userId: 'user-123'
});

// Dialogue widget
const dialogueWidget = helper.generateIframe({
    campaignName: 'product-recommendation',
    userId: 'user-456',
    contentType: 'dialogue',
    size: 'dialogue',
    objective: 'purchase',
    brandName: 'ACME Store'
});

// Modal widget with custom dimensions
const modalWidget = helper.generateIframe({
    campaignName: 'onboarding-flow',
    userId: 'user-789',
    contentType: 'modal',
    dimensions: { width: 600, height: 500 },
    styles: { 'z-index': '9999' }
});

// Responsive widget
const responsiveWidget = helper.generateResponsiveIframe({
    campaignName: 'mobile-friendly',
    userId: 'user-abc',
    contentType: 'dialogue'
});
*/

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CampaignWidgetHelper;
} else if (typeof window !== 'undefined') {
    window.CampaignWidgetHelper = CampaignWidgetHelper;
}