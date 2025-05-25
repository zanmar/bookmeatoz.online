import { chromium } from '@playwright/test';

(async () => {
  // Launch the browser with no-sandbox flag (required when running as root)
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // Create a new context and page
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Test the business settings API
  console.log('Testing the business settings API...');
  
  // The JWT token from your example
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcsImVtYWlsIjoidGVzdDIyQG91dGxvb2suY29tIiwidXNlcl90eXBlIjoiYnVzaW5lc3MiLCJyb2xlIjoiYnVzaW5lc3MiLCJidXNpbmVzc19pZCI6IjVlNjk4NDk3LTYwMGEtNGM4Yi04NjdkLTE0NTY1YTcwZjE2YyIsInRlbmFudF9pZCI6IjVlNjk4NDk3LTYwMGEtNGM4Yi04NjdkLTE0NTY1YTcwZjE2YyIsImlhdCI6MTc0NzU5MDEzNywiZXhwIjoxNzQ4MTk0OTM3fQ.l5dwaGoxFecujoT9fOstPy77xddNigkfoDvbzsi46fk';
  
  try {
    // Make API request using Playwright
    const response = await page.evaluate(async (token) => {
      const response = await fetch('https://api.bookmeatoz.online/api/businesses/settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        status: response.status,
        statusText: response.statusText,
        data: await response.json()
      };
    }, token);
    
    console.log('API Response Status:', response.status, response.statusText);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error making API request:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
})().catch(err => {
  console.error('Error in test:', err);
  process.exit(1);
});