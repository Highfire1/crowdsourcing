# Public API Documentation

## Export Verified Courses API

### Endpoint
```
GET /api/public/export-verified-courses
```

### Authentication
This endpoint requires an API key provided via:
- Header: `x-api-key: YOUR_API_KEY`
- Query parameter: `?api_key=YOUR_API_KEY`

### Rate Limiting
- Maximum 10 requests per minute per IP address
- Rate limit resets every minute

### Caching
- Response is cached for 1 hour on the server
- Browser cache header set to 1 hour
- `X-Cache` header indicates `HIT` or `MISS`

### Response Format
```json
{
  "metadata": {
    "title": "SFU Verified Course Prerequisites Export",
    "description": "This file contains all courses that have been human-verified...",
    "exportDate": "2025-10-04T12:00:00.000Z",
    "totalCourses": 150,
    "apiVersion": "1.0",
    "fields": {
      "id": "Unique course identifier",
      "dept": "Department code (e.g., CMPT, MATH)",
      "number": "Course number (e.g., 101, 215)",
      // ... field descriptions
    },
    "note": "The parsed_prerequisites field contains structured data..."
  },
  "courses": [
    {
      "id": "course_id",
      "dept": "CMPT",
      "number": "101",
      "title": "Introduction to Computing",
      "description": "Course description...",
      "prerequisites": "Original prerequisite text",
      "corequisites": "Original corequisite text",
      "notes": "Additional notes",
      "parse_status": "human_verified",
      "parsed_prerequisites": { /* structured JSON */ },
      "parsed_credit_conflicts": { /* structured JSON */ },
      "verified_at": "2025-10-04T10:30:00.000Z"
    }
    // ... more courses
  ]
}
```

### Example Usage

#### cURL
```bash
curl -H "x-api-key: YOUR_API_KEY" \
     https://your-domain.com/api/public/export-verified-courses
```

#### JavaScript/Fetch
```javascript
const response = await fetch('/api/public/export-verified-courses', {
  headers: {
    'x-api-key': 'YOUR_API_KEY'
  }
});
const data = await response.json();
```

#### Query Parameter
```bash
curl "https://your-domain.com/api/public/export-verified-courses?api_key=YOUR_API_KEY"
```

### Error Responses

#### 401 - Invalid API Key
```json
{
  "error": "Invalid or missing API key",
  "message": "Please provide a valid API key via x-api-key header or api_key query parameter"
}
```

#### 429 - Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 requests per minute allowed"
}
```

#### 500 - Server Error
```json
{
  "error": "Server error: Error message here"
}
```

### Setup Instructions

1. **Generate API Key:**
   ```bash
   # Generate a secure 64-character hex string
   openssl rand -hex 32
   ```

2. **Set Environment Variable:**
   ```bash
   # In your .env file
   PUBLIC_API_KEY=your_generated_api_key_here
   ```

3. **Share API Key:**
   - Provide the API key to authorized users/applications
   - Consider creating multiple keys for different users if needed

### Data Description

The API returns all courses that have been verified by human reviewers through the crowdsourcing system. Each course includes:

- **Original Data**: Course title, description, prerequisites as text
- **Parsed Data**: Structured JSON representation of prerequisites and credit conflicts
- **Verification Info**: When the course was verified and by whom

The `parsed_prerequisites` field contains a structured representation of course requirements that has been validated by human reviewers for accuracy.