# Playwright MCP Testing Guide for BookMeAtOz

This guide demonstrates how to use Playwright MCP (Machine-Controlled Playwright) for automated testing of the BookMeAtOz platform.

## Setup

1. Install the required dependencies:

```bash
# Install Playwright globally (with browser skip flag for environments without display)
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install -g @playwright/test

# Add Playwright as a project dependency
cd /var/www/bookmeatoz.online
npm install --save-dev @playwright/test
```

2. Create a tests directory:

```bash
mkdir -p /var/www/bookmeatoz.online/playwright-tests
```

3. Copy the example test scripts to this directory:

```bash
cp /var/www/bookmeatoz.online/*.js /var/www/bookmeatoz.online/playwright-tests/
```

## Available Test Scripts

We've created several example scripts to demonstrate different testing approaches:

1. **api-test-esm.js** - Tests the business settings API endpoint
2. **business-settings-test.js** - Specialized test for the business settings API with detailed diagnostics
3. **multi-tenant-test.js** - Tests the multi-tenant architecture of BookMeAtOz
4. **playwright-mcp-demo.js** - Comprehensive demo of various Playwright MCP capabilities

## Running Tests

To run a test script:

```bash
cd /var/www/bookmeatoz.online
node playwright-tests/api-test-esm.js
```

For headless environments like servers without a display:

```bash
xvfb-run node playwright-tests/api-test-esm.js
```

## Test Types

### API Testing

The API testing scripts demonstrate how to:

- Make authenticated API requests
- Test business settings endpoints
- Test multi-tenant isolation
- Debug authentication/permission issues

### UI Testing

The UI testing examples show how to:

- Navigate to different pages
- Take screenshots
- Interact with forms
- Extract page content
- Test search functionality
- Test login forms

### Performance Testing

Performance tests include:

- Page load time measurement
- Resource count analysis
- Navigation timing API metrics

### Accessibility Testing

Basic accessibility checks include:

- Images without alt text
- Form inputs without labels
- Color contrast issues (simplified)

## Creating Custom Tests

To create a new test script:

1. Create a new .js file in the playwright-tests directory
2. Import the required Playwright modules
3. Initialize a browser with proper headless and sandbox flags
4. Implement your test logic
5. Close the browser when done

Example boilerplate:

```javascript
import { chromium } from '@playwright/test';

(async () => {
  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // Create context and page
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Your test code here
    await page.goto('https://bookmeatoz.online');
    
    // Perform actions, assertions, etc.
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up
    await browser.close();
  }
})();
```

## Testing JWT Authentication

To test endpoints that require JWT authentication:

1. Generate a valid JWT token for your test user
2. Include it in the Authorization header
3. Add any required tenant/business context headers

Example:

```javascript
const response = await page.evaluate(async (token) => {
  const response = await fetch('https://api.bookmeatoz.online/api/businesses/settings', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return {
    status: response.status,
    data: await response.json()
  };
}, jwtToken);
```

## Testing Multi-Tenant Features

For multi-tenant testing:

1. Create separate browser contexts for each tenant
2. Use subdomain routing to test tenant isolation
3. Verify tenant-specific branding and content
4. Test API data isolation between tenants

## Best Practices

1. Always run as headless on server environments
2. Include the `--no-sandbox` and `--disable-setuid-sandbox` flags when running as root
3. Use try/catch blocks to handle errors gracefully
4. Take screenshots at key points for debugging
5. Clean up resources in a finally block
6. Use unique, descriptive test names
7. Create isolated contexts for each test case

## Troubleshooting

Common issues:

- **X server errors**: Use headless mode or xvfb-run
- **JWT token errors**: Check token expiration and payload fields
- **API permissions**: Verify the right middleware is applied
- **Network errors**: Check CORS settings and API URLs

## Further Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [JWT.io](https://jwt.io/) - For debugging JWT tokens
- BookMeAtOz API Documentation