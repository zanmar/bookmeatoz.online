// Multi-tenant test for BookMeAtOz using Playwright
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'tenant-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Helper to take and save screenshots
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Sample test data - update with actual tenants in your system
const tenantData = [
  {
    id: '5e698497-600a-4c8b-867d-14565a70f16c',
    subdomain: 'example',
    name: 'Example Business'
  },
  // Add more tenant data as needed
];

(async () => {
  console.log('Starting multi-tenant test for BookMeAtOz');
  
  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Test 1: Verify subdomain routing
    console.log('\nTest 1: Verifying subdomain routing');
    
    for (const tenant of tenantData) {
      console.log(`\nTesting tenant: ${tenant.name} (${tenant.subdomain})`);
      
      // Create a new context for each tenant (isolated cookies/storage)
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        // Navigate to tenant subdomain
        const tenantUrl = `https://${tenant.subdomain}.bookmeatoz.online`;
        console.log(`Navigating to: ${tenantUrl}`);
        
        await page.goto(tenantUrl, { timeout: 30000 });
        
        // Take screenshot
        await takeScreenshot(page, `tenant-${tenant.subdomain}-home`);
        
        // Extract page title and verify tenant-specific content
        const title = await page.title();
        console.log(`Page title: ${title}`);
        
        // Check for tenant-specific branding (customize selectors as needed)
        const hasTenantBranding = await page.evaluate((tenantName) => {
          const pageContent = document.body.textContent;
          return pageContent.includes(tenantName);
        }, tenant.name);
        
        console.log(`Has tenant branding: ${hasTenantBranding}`);
        
        // Close this tenant's context
        await context.close();
      } catch (error) {
        console.error(`Error testing tenant ${tenant.subdomain}:`, error.message);
        await takeScreenshot(page, `tenant-${tenant.subdomain}-error`);
        await context.close();
      }
    }
    
    // Test 2: API data isolation test
    console.log('\nTest 2: API data isolation test');
    
    // Create a context for API testing
    const apiContext = await browser.newContext();
    const apiPage = await apiContext.newPage();
    
    // For each tenant, test that they can only access their own data
    for (const tenant of tenantData) {
      console.log(`\nTesting API isolation for tenant: ${tenant.name}`);
      
      // This would be a real token for the tenant in a production test
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiIke3RlbmFudC5pZH0ifQ.signature`;
      
      // Test services API
      try {
        const servicesResponse = await apiPage.evaluate(async (params) => {
          try {
            const response = await fetch(`https://api.bookmeatoz.online/api/services?businessId=${params.tenantId}`, {
              headers: {
                'Authorization': `Bearer ${params.token}`,
                'Content-Type': 'application/json'
              }
            });
            
            return {
              status: response.status,
              data: await response.json()
            };
          } catch (error) {
            return { error: error.message };
          }
        }, { tenantId: tenant.id, token: mockToken });
        
        console.log(`Services API response status: ${servicesResponse.status}`);
        
        // Test that we can't access another tenant's data (using a different tenant ID)
        const otherTenantId = "00000000-0000-0000-0000-000000000000"; // Fake ID
        const crossTenantResponse = await apiPage.evaluate(async (params) => {
          try {
            const response = await fetch(`https://api.bookmeatoz.online/api/services?businessId=${params.tenantId}`, {
              headers: {
                'Authorization': `Bearer ${params.token}`,
                'Content-Type': 'application/json'
              }
            });
            
            return {
              status: response.status,
              data: await response.json()
            };
          } catch (error) {
            return { error: error.message };
          }
        }, { tenantId: otherTenantId, token: mockToken });
        
        console.log(`Cross-tenant API response status: ${crossTenantResponse.status}`);
        console.log(`Proper isolation: ${crossTenantResponse.status === 403 || crossTenantResponse.status === 401 || (crossTenantResponse.data && crossTenantResponse.data.length === 0)}`);
      } catch (error) {
        console.error(`API isolation test error for tenant ${tenant.name}:`, error.message);
      }
    }
    
    await apiContext.close();
    
    // Test 3: Test tenant-specific customization features
    console.log('\nTest 3: Tenant customization features');
    
    // Create a context for testing customizations
    const customContext = await browser.newContext();
    const customPage = await customContext.newPage();
    
    try {
      // This would be your admin panel URL in production
      await customPage.goto('https://admin.bookmeatoz.online', { timeout: 30000 });
      await takeScreenshot(customPage, 'admin-panel');
      
      console.log('Would test tenant customization features here');
      console.log('- Theme customization');
      console.log('- Business hours setting');
      console.log('- Service configuration');
      
      // Use evaluate to run arbitrary JS if we could login
      await customPage.evaluate(() => {
        console.log('Running client-side JavaScript in the admin panel');
        // This would interact with the admin UI in a real test
      });
    } catch (error) {
      console.error('Admin panel test error:', error.message);
      await takeScreenshot(customPage, 'admin-panel-error');
    }
    
    await customContext.close();
    
    // Print summary
    console.log('\n===== MULTI-TENANT TEST SUMMARY =====');
    console.log(`Tenants tested: ${tenantData.length}`);
    console.log(`Screenshots saved: ${fs.readdirSync(screenshotsDir).length}`);
    console.log('=================================');
  } catch (error) {
    console.error('Test script failed:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('\nTest completed and browser closed');
  }
})();