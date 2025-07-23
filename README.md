# Campaign Widget Service

A lightweight Express.js service for serving configurable campaign widgets that can be embedded in external websites via iframe.

## Features

- 🚀 **Lightweight Express server** with minimal dependencies
- 🔧 **Configurable widgets** via URL parameters
- 🌐 **CORS support** for iframe embedding
- 🛡️ **Rate limiting** and security features
- 📊 **Campaign tracking** (impressions, clicks)
- 🎯 **Personalized campaigns** based on user profiles
- ⚡ **Self-contained widgets** with error handling

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Embed the widget**:
   ```html
   <iframe src="http://localhost:3002/widget?campaignId=123&userId=456" 
           width="300" height="250" frameborder="0">
   </iframe>
   ```

## API Endpoints

### Widget Endpoints

- `GET /widget` - Serves the widget JavaScript with injected configuration
- `GET /campaigns/:id` - Proxy to platform API for campaign data
- `POST /track/impression` - Track widget impressions
- `POST /track/click` - Track widget clicks

### URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `campaignId` | Campaign identifier | `123` |
| `userId` | User identifier | `user_456` |
| `theme` | Widget theme | `light`, `dark` |
| `size` | Widget dimensions | `small`, `medium`, `large` |
| `position` | Widget position | `top-right`, `bottom-left` |

## Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- `PORT` - Server port (default: 3002)
- `PLATFORM_API_URL` - Main platform API URL
- `API_KEY` - API key for platform requests
- `ALLOWED_ORIGINS` - CORS allowed origins
- `RATE_LIMIT_MAX_REQUESTS` - Rate limit per window

### Widget Configuration

Widgets are configured via URL parameters and automatically:
- Collect user profile data from the embedding page
- Make API calls to fetch personalized campaigns
- Track user interactions
- Handle loading states and errors gracefully

## Examples

Check the `examples/` directory for HTML demo files showing different widget configurations.

## API Documentation

Detailed API documentation is available in the `docs/` directory.

## Development

### Project Structure

```
campaign-widget-service/
├── package.json          # Dependencies and scripts
├── .env.example          # Environment configuration template
├── .gitignore           # Git ignore rules
├── README.md            # This file
├── src/
│   ├── server.js        # Express server
│   └── widget.js        # Widget JavaScript template
├── examples/            # HTML demo files
└── docs/               # API documentation
```

### Security Features

- Helmet.js for security headers
- CORS configuration for iframe embedding
- Rate limiting to prevent abuse
- Input validation and sanitization
- Error handling without exposing internals

### Hackathon Ready

This service is designed to be hackathon-ready with:
- Minimal setup (just npm install and configure .env)
- Clear documentation and examples
- Flexible widget configuration
- Easy integration with existing platforms
- Built-in analytics and tracking

## License

MIT