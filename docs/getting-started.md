# Getting Started

This guide will help you quickly set up and deploy the Campaign Widget Service for your hackathon project.

## Quick Setup (5 minutes)

### 1. Prerequisites

- Node.js 16+ installed
- Basic knowledge of HTML/JavaScript
- A text editor or IDE

### 2. Installation

```bash
# Clone or download the project
cd campaign-widget-service

# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

### 3. Configuration

Edit `.env` file with your settings:

```bash
# Basic configuration
PORT=3000
NODE_ENV=development

# API configuration (optional for demo)
PLATFORM_API_URL=https://your-api.com
API_KEY=your-api-key

# CORS (allow all origins for development)
ALLOWED_ORIGINS=*
```

### 4. Start the Service

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The service will be available at `http://localhost:3002`

### 5. Test Your First Widget

Open your browser and visit:
```
http://localhost:3002/widget?campaignId=test-123&userId=demo-user
```

You should see the widget JavaScript code. Now embed it in a webpage:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Widget Test</title>
</head>
<body>
    <h1>My Website</h1>
    <iframe src="http://localhost:3002/widget?campaignId=test-123&userId=demo-user" 
            width="300" height="200" frameborder="0">
    </iframe>
</body>
</html>
```

## Integration Methods

### Method 1: Simple iframe (Recommended for hackathons)

**Pros:** Easy to implement, works everywhere
**Cons:** Fixed size, less flexible

```html
<!-- Basic widget -->
<iframe src="http://localhost:3002/widget?campaignName=my-campaign&userId=user-123" 
        width="350" height="250" frameborder="0" style="border-radius: 12px;">
</iframe>

<!-- Dialogue widget for backend HTML -->
<iframe src="http://localhost:3002/widget?campaignName=my-dialogue&userId=user-123&contentType=dialogue&size=dialogue" 
        width="400" height="350" frameborder="0" 
        style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); resize: both; overflow: auto;">
</iframe>

<!-- Modal widget for complex content -->
<iframe src="http://localhost:3002/widget?campaignName=my-modal&userId=user-123&contentType=modal&size=modal&objective=purchase" 
        width="500" height="400" frameborder="0" 
        style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
</iframe>
```

### Method 2: Dynamic JavaScript

**Pros:** More flexible, can be responsive
**Cons:** Requires more JavaScript knowledge

```html
<div id="campaign-widget"></div>
<script>
(function() {
    const config = {
        campaignId: 'demo-123',
        userId: 'user-456',
        size: 'medium',
        theme: 'light'
    };
    
    const iframe = document.createElement('iframe');
    const params = new URLSearchParams(config);
    iframe.src = `http://localhost:3002/widget?${params}`;
    iframe.width = '300';
    iframe.height = '200';
    iframe.frameBorder = '0';
    
    document.getElementById('campaign-widget').appendChild(iframe);
})();
</script>
```

### Method 3: Advanced Integration

For more control, use the widget API directly:

```javascript
class CampaignWidget {
    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        this.config = config;
        this.load();
    }
    
    async load() {
        try {
            // Fetch campaign data
            const response = await fetch(
                `http://localhost:3002/campaigns/${this.config.campaignId}?userId=${this.config.userId}`
            );
            const campaign = await response.json();
            
            // Create widget
            this.render(campaign);
            
            // Track impression
            this.trackImpression();
        } catch (error) {
            this.renderError('Failed to load campaign');
        }
    }
    
    render(campaign) {
        this.container.innerHTML = `
            <div class="campaign-widget" onclick="this.handleClick('${campaign.ctaUrl}')">
                <h3>${campaign.title}</h3>
                <p>${campaign.description}</p>
                <button>${campaign.ctaText}</button>
            </div>
        `;
    }
    
    async trackImpression() {
        await fetch('http://localhost:3002/track/impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId: this.config.campaignId,
                userId: this.config.userId,
                timestamp: new Date().toISOString()
            })
        });
    }
    
    async handleClick(targetUrl) {
        await fetch('http://localhost:3002/track/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignId: this.config.campaignId,
                userId: this.config.userId,
                targetUrl: targetUrl,
                timestamp: new Date().toISOString()
            })
        });
        
        window.open(targetUrl, '_blank');
    }
}

// Usage
new CampaignWidget('my-widget-container', {
    campaignId: 'demo-123',
    userId: 'user-456'
});
```

## Widget Configuration

### Basic Configuration

```javascript
const config = {
    campaignId: 'your-campaign-id',    // Required
    userId: 'unique-user-id',          // Optional but recommended
    size: 'medium',                    // small, medium, large
    theme: 'light',                    // light, dark
    position: 'top-right'              // For overlay widgets
};
```

### Responsive Widgets

Make widgets responsive to different screen sizes:

```html
<style>
.widget-container {
    width: 100%;
    max-width: 400px;
}

.widget-container iframe {
    width: 100%;
    height: auto;
    aspect-ratio: 3/2; /* Maintain aspect ratio */
}

/* Mobile adjustments */
@media (max-width: 768px) {
    .widget-container {
        max-width: 300px;
    }
}
</style>

<div class="widget-container">
    <iframe src="http://localhost:3002/widget?campaignId=123&size=medium" 
            frameborder="0">
    </iframe>
</div>
```

## Hackathon Tips

### 1. Quick Demo Setup

For presentations, use the included demo files:

```bash
# Start the server
npm run dev

# Open demo in browser
open examples/basic-widget.html
open examples/advanced-integration.html
```

### 2. Mock Data

The service includes mock campaign data by default. No external API required for demos.

### 3. Customization

Quickly customize the widget appearance by editing `src/widget.js`:

```javascript
// Change default colors
const themeConfig = {
    light: { 
        backgroundColor: '#your-brand-color', 
        textColor: '#333333'
    },
    // ...
};
```

### 4. Testing Different Scenarios

Use different campaign IDs to simulate various campaigns:

```html
<!-- E-commerce campaign -->
<iframe src="http://localhost:3002/widget?campaignId=ecommerce-sale&size=large"></iframe>

<!-- App download campaign -->
<iframe src="http://localhost:3002/widget?campaignId=app-download&size=medium"></iframe>

<!-- Newsletter signup -->
<iframe src="http://localhost:3002/widget?campaignId=newsletter&size=small"></iframe>
```

### 5. Analytics Demo

The service logs all interactions to the console. For demos, check the browser's Network tab or server logs to show real-time tracking.

## Common Issues & Solutions

### CORS Errors

If you see CORS errors, ensure `ALLOWED_ORIGINS` includes your domain:

```bash
# In .env file
ALLOWED_ORIGINS=http://localhost:3002,https://yourdomain.com
```

### Widget Not Loading

1. Check if the service is running: `http://localhost:3002/health`
2. Verify the campaign ID is provided
3. Check browser console for JavaScript errors

### Styling Issues

Widgets are designed to be self-contained, but you can add custom CSS:

```html
<style>
iframe[src*="campaign-widget"] {
    border-radius: 12px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
}
</style>
```

## Next Steps

1. **Customize Campaigns:** Modify the mock data in `src/server.js`
2. **Add Features:** Extend the widget with new functionality
3. **Integrate APIs:** Connect to your existing platform APIs
4. **Deploy:** Use platforms like Heroku, Vercel, or Railway for quick deployment

## Production Considerations

Before going live:

1. **Security:** Add proper authentication and input validation
2. **Performance:** Implement caching and CDN for widget delivery
3. **Analytics:** Integrate with proper analytics platforms
4. **Monitoring:** Add health checks and error monitoring
5. **Rate Limiting:** Configure appropriate limits for your use case

Happy hacking! 🚀