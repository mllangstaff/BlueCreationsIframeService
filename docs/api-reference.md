# API Reference

Campaign Widget Service provides a RESTful API for serving configurable campaign widgets and tracking user interactions.

## Base URL

```
http://localhost:3002
```

## Endpoints

### Widget Endpoints

#### GET /widget

Serves widget JavaScript with injected configuration via URL parameters.

**Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `campaignId` | string | Yes | Unique campaign identifier | `demo-123` |
| `userId` | string | No | User identifier for personalization | `user-456` |
| `size` | string | No | Widget size (`small`, `medium`, `large`) | `medium` |
| `theme` | string | No | Visual theme (`light`, `dark`) | `light` |
| `position` | string | No | Widget position for overlay mode | `top-right` |

**Response:**
- **Content-Type:** `application/javascript`
- **Body:** Widget JavaScript code with injected configuration

**Example Request:**
```
GET /widget?campaignId=demo-123&userId=user-456&size=medium&theme=light
```

**Example Response Headers:**
```
Content-Type: application/javascript
Cache-Control: public, max-age=300
X-Content-Type-Options: nosniff
```

---

#### GET /campaigns/:id

Proxy endpoint to fetch campaign data from the main platform API.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Campaign ID (URL parameter) |
| `userId` | string | No | User ID for personalization (query parameter) |

**Response:**
```json
{
  "id": "demo-123",
  "title": "Special Offer!",
  "description": "Get 20% off your next purchase",
  "imageUrl": "https://example.com/image.jpg",
  "ctaText": "Shop Now",
  "ctaUrl": "https://example.com/shop",
  "backgroundColor": "#007bff",
  "textColor": "#ffffff",
  "expiresAt": "2023-12-31T23:59:59Z"
}
```

**Error Responses:**
- `400` - Campaign ID is required
- `500` - Failed to fetch campaign data

---

### Tracking Endpoints

#### POST /track/impression

Track widget impression events.

**Request Body:**
```json
{
  "campaignId": "demo-123",
  "userId": "user-456",
  "timestamp": "2023-07-23T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Impression tracked"
}
```

**Error Responses:**
- `400` - Campaign ID is required
- `500` - Failed to track impression

---

#### POST /track/click

Track widget click events.

**Request Body:**
```json
{
  "campaignId": "demo-123",
  "userId": "user-456",
  "targetUrl": "https://example.com/shop",
  "timestamp": "2023-07-23T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Click tracked"
}
```

**Error Responses:**
- `400` - Campaign ID is required
- `500` - Failed to track click

---

### System Endpoints

#### GET /health

Health check endpoint for monitoring service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-07-23T10:30:00Z",
  "version": "1.0.0"
}
```

---

## Widget Configuration

### Size Options

| Size | Dimensions | Use Case |
|------|------------|----------|
| `small` | 200x150px | Compact widgets, sidebar placement |
| `medium` | 300x200px | Standard widgets, content area |
| `large` | 400x250px | Feature widgets, hero sections |

### Theme Options

| Theme | Description | Background | Text Color |
|-------|-------------|------------|------------|
| `light` | Light theme for dark backgrounds | White | Dark gray |
| `dark` | Dark theme for light backgrounds | Dark gray | White |

### Position Options

| Position | Description |
|----------|-------------|
| `top-left` | Top-left corner overlay |
| `top-right` | Top-right corner overlay |
| `bottom-left` | Bottom-left corner overlay |
| `bottom-right` | Bottom-right corner overlay |
| `center` | Center overlay |

---

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

### Common Error Codes

- `400 Bad Request` - Invalid or missing required parameters
- `404 Not Found` - Endpoint not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window:** 15 minutes (configurable via `RATE_LIMIT_WINDOW_MS`)
- **Max Requests:** 100 per window (configurable via `RATE_LIMIT_MAX_REQUESTS`)
- **Headers:** Standard rate limit headers included in responses

When rate limit is exceeded:
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

---

## CORS Configuration

The service supports Cross-Origin Resource Sharing (CORS) for iframe embedding:

- **Allowed Origins:** Configurable via `ALLOWED_ORIGINS` environment variable
- **Credentials:** Supported
- **Methods:** GET, POST, OPTIONS
- **Headers:** Content-Type, Authorization, X-Requested-With

---

## Authentication

Currently, the API does not require authentication for widget serving and basic tracking. For production use, consider implementing:

- API key authentication for campaign data access
- JWT tokens for user-specific data
- OAuth for third-party integrations

---

## Examples

### Basic Widget Embedding

```html
<iframe src="http://localhost:3002/widget?campaignId=123&userId=456" 
        width="300" height="200" frameborder="0">
</iframe>
```

### Dynamic Widget Loading

```javascript
async function loadWidget(config) {
  const params = new URLSearchParams(config);
  const iframe = document.createElement('iframe');
  iframe.src = `http://localhost:3002/widget?${params}`;
  iframe.width = config.width || '300';
  iframe.height = config.height || '200';
  iframe.frameBorder = '0';
  document.getElementById('widget-container').appendChild(iframe);
}

loadWidget({
  campaignId: 'demo-123',
  userId: 'user-456',
  size: 'medium',
  theme: 'light'
});
```

### Tracking API Usage

```javascript
// Track custom events
async function trackEvent(eventType, data) {
  try {
    const response = await fetch(`http://localhost:3002/track/${eventType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Tracking failed:', error);
  }
}
```