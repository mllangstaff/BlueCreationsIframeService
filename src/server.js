const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow iframe embedding
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for iframe embedding - more permissive for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins in development, or specific origins in production
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    
    // Always allow requests with no origin (like direct server requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow all origins if * is specified or if origin is in allowed list
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow localhost and file:// origins for development
    if (origin.startsWith('http://localhost') || 
        origin.startsWith('https://localhost') || 
        origin.startsWith('file://') ||
        origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-Content-Type-Options'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add fetch polyfill for Node.js (for backend API calls)
const fetch = require('node-fetch');

// Helper function to extract title from recommendation text
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

// Widget endpoint - serves widget.js with configuration injected
app.get('/widget', (req, res) => {
  try {
    // Read widget template
    const widgetPath = path.join(__dirname, 'widget.js');
    let widgetCode = fs.readFileSync(widgetPath, 'utf8');
    
    // Extract configuration from URL parameters
    const config = {
      campaignId: req.query.campaignId || req.query.campaignName || '',
      campaignName: req.query.campaignName || req.query.campaignId || '',
      userId: req.query.userId || '',
      theme: req.query.theme || 'light',
      size: req.query.size || 'medium',
      position: req.query.position || 'bottom-right',
      contentType: req.query.contentType || 'widget', // widget, dialogue, modal
      objective: req.query.objective || '',
      brandName: req.query.brandName || '',
      apiUrl: process.env.PLATFORM_API_URL || 'http://localhost:3002',
      trackingUrl: `${req.protocol}://${req.get('host')}`,
      timeout: parseInt(process.env.DEFAULT_CAMPAIGN_TIMEOUT) || 5000
    };
    
    // Inject configuration into widget
    widgetCode = widgetCode.replace(
      '{{CONFIG_PLACEHOLDER}}', 
      JSON.stringify(config)
    );
    
    // Set appropriate headers for CORS and iframe embedding
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', `public, max-age=${process.env.WIDGET_CACHE_TTL || 300}`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', 'frame-ancestors *;');
    
    res.send(widgetCode);
  } catch (error) {
    console.error('Error serving widget:', error);
    res.status(500).send('// Widget loading error');
  }
});

// Campaign data proxy endpoint - connects to BlueCreations-Backend
app.get('/campaigns/:campaignName', async (req, res) => {
  try {
    const campaignName = req.params.campaignName;
    const userId = req.query.userId;
    const objective = req.query.objective;
    const brandName = req.query.brandName;
    
    // Validate required parameters
    if (!campaignName) {
      return res.status(400).json({ error: 'Campaign name is required' });
    }
    
    console.log(`Fetching campaign: ${campaignName} for user: ${userId}`);
    
    // Call the unified recommendation endpoint from BlueCreations-Backend
    const backendUrl = process.env.PLATFORM_API_URL || 'http://localhost:3000';
    const requestBody = {
      campaignName: campaignName,
      userProfile: userId ? {
        userId: userId,
        segments: ['website_visitor'],
        interests: objective ? [objective.replace('-', '_')] : [],
        demographics: {},
        behaviors: ['engaged_user']
      } : null,
      context: {
        source: 'widget',
        brandName: brandName || null,
        timestamp: new Date().toISOString()
      },
      status: 'active'
    };
    
    const response = await fetch(`${backendUrl}/recommendation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.recommendation) {
      // No campaign found - return fallback campaign
      const fallbackCampaign = {
        id: campaignName,
        title: 'Special Offer!',
        description: 'Discover amazing products at great prices',
        imageUrl: null,
        ctaText: 'Shop Now',
        ctaUrl: 'https://example.com/shop',
        backgroundColor: '#007bff',
        textColor: '#ffffff',
        html: '<div>No campaign available</div>',
        css: '',
        text: 'Check out our latest offers!',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      return res.json(fallbackCampaign);
    }
    
    // Transform backend recommendation to widget format
    const recommendation = data.recommendation;
    const campaign = {
      id: recommendation.campaignId,
      campaignName: recommendation.campaignName,
      title: extractTitleFromText(recommendation.text),
      description: recommendation.text,
      imageUrl: recommendation.products && recommendation.products[0] ? 
        recommendation.products[0].image : null,
      ctaText: 'Shop Now',
      ctaUrl: 'https://example.com/shop', // TODO: Extract from campaign data
      backgroundColor: '#007bff', // TODO: Extract from brand styling
      textColor: '#ffffff',
      html: recommendation.html,
      css: recommendation.css,
      text: recommendation.text,
      products: recommendation.products || [],
      category: recommendation.category,
      matchReason: data.matchReason,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    console.log(`Campaign found: ${campaign.campaignName}, Match: ${campaign.matchReason}`);
    
    // Set CORS headers for API response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    res.json(campaign);
    
  } catch (error) {
    console.error('Error fetching campaign:', error);
    
    // Return fallback campaign on error
    const fallbackCampaign = {
      id: req.params.campaignName,
      title: 'Limited Time Offer',
      description: 'Don\'t miss out on our exclusive deals!',
      imageUrl: null,
      ctaText: 'Learn More',
      ctaUrl: 'https://example.com/shop',
      backgroundColor: '#28a745',
      textColor: '#ffffff',
      html: '<div>Fallback campaign</div>',
      css: '',
      text: 'Limited time offer - check it out!',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Set CORS headers for fallback response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    res.json(fallbackCampaign);
  }
});

// Impression tracking endpoint
app.post('/track/impression', (req, res) => {
  try {
    const { campaignId, userId, timestamp } = req.body;
    
    // Validate required fields
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    // Log impression (in production, save to database or analytics service)
    console.log('Impression tracked:', {
      campaignId,
      userId,
      timestamp: timestamp || new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ success: true, message: 'Impression tracked' });
  } catch (error) {
    console.error('Error tracking impression:', error);
    res.status(500).json({ error: 'Failed to track impression' });
  }
});

// Click tracking endpoint
app.post('/track/click', (req, res) => {
  try {
    const { campaignId, userId, targetUrl, timestamp } = req.body;
    
    // Validate required fields
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    // Log click (in production, save to database or analytics service)
    console.log('Click tracked:', {
      campaignId,
      userId,
      targetUrl,
      timestamp: timestamp || new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ success: true, message: 'Click tracked' });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Debug page for testing backend HTML/CSS
app.get('/debug', (req, res) => {
  try {
    const debugPath = path.join(__dirname, '..', 'examples', 'debug-backend.html');
    res.sendFile(debugPath);
  } catch (error) {
    console.error('Error serving debug page:', error);
    res.status(500).send('Debug page not found');
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Campaign Widget Service running on port ${PORT}`);
  console.log(`Widget endpoint: http://localhost:${PORT}/widget`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});