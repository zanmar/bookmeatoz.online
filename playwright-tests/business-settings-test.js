// Specific test for the business settings API issue
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directory for request/response logs
const logsDir = path.join(__dirname, 'api-logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper function to log request/response details
function logApiCall(name, request, response) {
  const logFile = path.join(logsDir, `${name}-${Date.now()}.json`);
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    request,
    response
  }, null, 2));
  console.log(`API call details logged to ${logFile}`);
}

(async () => {
  console.log('Starting business settings API test');
  
  // Launch the browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  
  // Create a page to handle API requests
  const page = await context.newPage();
  
  try {
    // Test token from the example
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcsImVtYWlsIjoidGVzdDIyQG91dGxvb2suY29tIiwidXNlcl90eXBlIjoiYnVzaW5lc3MiLCJyb2xlIjoiYnVzaW5lc3MiLCJidXNpbmVzc19pZCI6IjVlNjk4NDk3LTYwMGEtNGM4Yi04NjdkLTE0NTY1YTcwZjE2YyIsInRlbmFudF9pZCI6IjVlNjk4NDk3LTYwMGEtNGM4Yi04NjdkLTE0NTY1YTcwZjE2YyIsImlhdCI6MTc0NzU5MDEzNywiZXhwIjoxNzQ4MTk0OTM3fQ.l5dwaGoxFecujoT9fOstPy77xddNigkfoDvbzsi46fk';
    
    // Decode JWT to display payload contents for debugging
    console.log('Decoding JWT token for analysis...');
    const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('Token payload:', tokenPayload);
    
    // Analyze the token to check the issue
    console.log('Token analysis:');
    console.log(`- user_type: ${tokenPayload.user_type}`);
    console.log(`- role: ${tokenPayload.role}`);
    console.log(`- business_id: ${tokenPayload.business_id}`);
    
    // Call the business settings API
    console.log('\nTesting the business settings API with token...');
    const requestDetails = {
      url: 'https://api.bookmeatoz.online/api/businesses/settings',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('Request details:', requestDetails);
    
    const response = await page.evaluate(async (request) => {
      try {
        const fetchResponse = await fetch(request.url, {
          method: request.method,
          headers: request.headers
        });
        
        return {
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          data: await fetchResponse.json(),
          headers: Object.fromEntries(fetchResponse.headers)
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    }, requestDetails);
    
    console.log('\nAPI Response:');
    console.log('Status:', response.status, response.statusText);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Log the API call details
    logApiCall('business-settings', requestDetails, response);
    
    // Attempt with modified token for testing
    console.log('\nAttempting with modified request for testing...');
    
    // Try with different header combinations
    const testVariations = [
      {
        name: 'type-in-both-fields',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': tokenPayload.tenant_id,
          'x-business-id': tokenPayload.business_id
        }
      },
      {
        name: 'with-tenant-header',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-tenant-id': tokenPayload.tenant_id
        }
      },
      {
        name: 'with-business-header',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-business-id': tokenPayload.business_id
        }
      }
    ];
    
    for (const variation of testVariations) {
      console.log(`\nTesting variation: ${variation.name}`);
      
      const variationRequest = {
        url: requestDetails.url,
        method: requestDetails.method,
        headers: variation.headers
      };
      
      console.log('Request headers:', variation.headers);
      
      const variationResponse = await page.evaluate(async (request) => {
        try {
          const fetchResponse = await fetch(request.url, {
            method: request.method,
            headers: request.headers
          });
          
          return {
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            data: await fetchResponse.json(),
            headers: Object.fromEntries(fetchResponse.headers)
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      }, variationRequest);
      
      console.log('Status:', variationResponse.status, variationResponse.statusText);
      console.log('Data:', JSON.stringify(variationResponse.data, null, 2));
      
      // Log the API call details
      logApiCall(`business-settings-${variation.name}`, variationRequest, variationResponse);
    }
    
    // Print summary of findings
    console.log('\nTest summary:');
    console.log(`- Default JWT token call: ${response.status === 200 ? 'PASSED' : 'FAILED'}`);
    
    // We can't directly access the testVariations status as they're separate responses
    console.log('- Check the detailed logs for variation results');
    
    console.log('\nPossible issues:');
    console.log('1. The auth middleware might be checking for token.type but token contains user_type instead');
    console.log('2. The tenant context might not be properly set');
    console.log('3. The authorization mechanism might be validating role/permissions incorrectly');
    
    if (response.status === 403) {
      console.log('\nRecommended fix:');
      console.log('1. Update the auth.js middleware to check for both token.type and token.user_type');
      console.log('2. Ensure the business settings route uses authenticateToken middleware');
      console.log('3. Restart the server after making the changes');
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('\nTest completed and browser closed');
  }
})();