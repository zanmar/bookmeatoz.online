// A comprehensive demo of Playwright MCP for BookMeAtOz
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

(async () => {
  console.log('Starting Playwright MCP demo for BookMeAtOz');
  
  // Launch the browser with required flags for running as root
  const browser = await chromium.launch({
    headless: true, // Required when running without X server
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Part 1: UI Testing - Navigate to the main site
  console.log('Part 1: UI Testing');
  
  try {
    console.log('Navigating to BookMeAtOz homepage...');
    await page.goto('https://bookmeatoz.online', { timeout: 60000 });
    
    // Take a screenshot
    await page.screenshot({ path: path.join(screenshotsDir, '01-homepage.png') });
    console.log('Screenshot saved: 01-homepage.png');
    
    // Extract page details for verification
    const title = await page.title();
    console.log('Page title:', title);
    
    // Extract navigation links
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a'));
      return links.map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }));
    });
    
    console.log('Navigation links found:', navLinks.length);
    navLinks.forEach(link => console.log(`- ${link.text}: ${link.href}`));
    
    // Test search functionality if available
    try {
      const searchBox = await page.waitForSelector('input[type="search"]', { timeout: 5000 });
      if (searchBox) {
        console.log('Testing search functionality...');
        await searchBox.fill('test');
        await page.keyboard.press('Enter');
        
        // Wait for search results
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '02-search-results.png') });
        console.log('Screenshot saved: 02-search-results.png');
      }
    } catch (error) {
      console.log('Search box not found, skipping search test');
    }
    
    // Test login form if available
    try {
      // Look for common login link/button texts
      const loginButton = await page.waitForSelector('a:has-text("Login"), button:has-text("Login"), a:has-text("Sign In"), button:has-text("Sign In")', 
        { timeout: 5000 });
      
      if (loginButton) {
        console.log('Testing login form...');
        await loginButton.click();
        
        // Wait for login form to appear
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotsDir, '03-login-form.png') });
        console.log('Screenshot saved: 03-login-form.png');
        
        // Fill login form but don't submit (just for demo)
        try {
          await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
          await page.fill('input[type="password"], input[name="password"]', 'password123');
          
          // Take screenshot of filled form
          await page.screenshot({ path: path.join(screenshotsDir, '04-login-form-filled.png') });
          console.log('Screenshot saved: 04-login-form-filled.png');
        } catch (error) {
          console.log('Could not fill login form:', error.message);
        }
      }
    } catch (error) {
      console.log('Login button not found, skipping login test');
    }
  } catch (error) {
    console.error('UI testing failed:', error);
  }
  
  // Part 2: API Testing
  console.log('\nPart 2: API Testing');
  
  try {
    // The JWT token for API tests
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzcsImVtYWlsIjoidGVzdDIyQG91dGxvb2suY29tIiwidXNlcl90eXBlIjoiYnVzaW5lc3MiLCJyb2xlIjoiYnVzaW5lc3MiLCJidXNpbmVzc19pZCI6IjVlNjk4NDk3LTYwMGEtNGM4Yi04NjdkLTE0NTY1YTcwZjE2YyIsInRlbmFudF9pZCI6IjVlNjk4NDk3LTYwMGEtNGM4Yi04NjdkLTE0NTY1YTcwZjE2YyIsImlhdCI6MTc0NzU5MDEzNywiZXhwIjoxNzQ4MTk0OTM3fQ.l5dwaGoxFecujoT9fOstPy77xddNigkfoDvbzsi46fk';
    
    // Test 1: Server status (public API)
    console.log('Testing server status API...');
    const serverStatusResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://api.bookmeatoz.online/api/server-status');
        return {
          status: response.status,
          data: await response.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Server status response:', serverStatusResponse);
    
    // Test 2: Business settings API (authenticated)
    console.log('Testing business settings API...');
    const settingsResponse = await page.evaluate(async (token) => {
      try {
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
      } catch (error) {
        return { error: error.message };
      }
    }, token);
    
    console.log('Business settings response:', settingsResponse);
    
    // Test 3: Services API
    console.log('Testing services API...');
    const businessId = '5e698497-600a-4c8b-867d-14565a70f16c';
    const servicesResponse = await page.evaluate(async (businessId) => {
      try {
        const response = await fetch(`https://api.bookmeatoz.online/api/services?businessId=${businessId}`);
        return {
          status: response.status,
          data: await response.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    }, businessId);
    
    console.log('Services API response:', servicesResponse);
    
    // Test 4: Time slots API
    console.log('Testing time slots API...');
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const slotsResponse = await page.evaluate(async (params) => {
      try {
        // Using a placeholder service ID and client ID
        const response = await fetch(`https://api.bookmeatoz.online/api/slots?date=${params.date}&serviceId=service1&clientId=client1&businessId=${params.businessId}`);
        return {
          status: response.status,
          data: await response.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    }, { businessId, date: formattedDate });
    
    console.log('Slots API response:', slotsResponse);
  } catch (error) {
    console.error('API testing failed:', error);
  }
  
  // Part 3: Performance Testing
  console.log('\nPart 3: Performance Testing');
  
  try {
    // Test page load performance
    console.log('Testing page load performance...');
    
    const navigationStart = new Date().getTime();
    await page.goto('https://bookmeatoz.online', { waitUntil: 'networkidle' });
    const navigationEnd = new Date().getTime();
    
    const loadTime = navigationEnd - navigationStart;
    console.log(`Page load time: ${loadTime}ms`);
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
      const connectionTime = perfData.connectEnd - perfData.connectStart;
      const ttfb = perfData.responseStart - perfData.requestStart;
      const domProcessingTime = perfData.domComplete - perfData.domLoading;
      
      return {
        pageLoadTime,
        dnsTime,
        connectionTime,
        ttfb,
        domProcessingTime
      };
    });
    
    console.log('Performance metrics:', performanceMetrics);
    
    // Count resources loaded
    const resourceCount = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource').length;
    });
    
    console.log(`Resources loaded: ${resourceCount}`);
  } catch (error) {
    console.error('Performance testing failed:', error);
  }
  
  // Part 4: Accessibility Testing
  console.log('\nPart 4: Accessibility Testing');
  
  try {
    console.log('Performing basic accessibility checks...');
    
    // Check for alt attributes on images
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.hasAttribute('alt')).length;
    });
    
    console.log(`Images without alt text: ${imagesWithoutAlt}`);
    
    // Check for form inputs with labels
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.filter(input => {
        if (input.type === 'hidden') return false;
        
        // Check for associated label
        const id = input.id;
        if (!id) return true;
        
        const label = document.querySelector(`label[for="${id}"]`);
        return !label;
      }).length;
    });
    
    console.log(`Form inputs without labels: ${inputsWithoutLabels}`);
    
    // Check contrast ratio (simplified)
    await page.evaluate(() => {
      // This would normally use a more sophisticated algorithm
      console.log('Contrast ratio checks would be performed here');
    });
  } catch (error) {
    console.error('Accessibility testing failed:', error);
  }
  
  // Close everything and report summary
  await context.close();
  await browser.close();
  
  console.log('\n===== TESTING SUMMARY =====');
  console.log('UI Tests: Completed');
  console.log('API Tests: Completed');
  console.log('Performance Tests: Completed');
  console.log('Accessibility Tests: Completed');
  console.log(`Screenshots saved in: ${screenshotsDir}`);
  console.log('==========================');
})().catch(error => {
  console.error('Test script failed:', error);
});