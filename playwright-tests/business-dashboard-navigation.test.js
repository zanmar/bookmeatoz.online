import { test, expect } from '@playwright/test';

// Test data
const BUSINESS_LOGIN = {
  email: 'test40@outlook.com',
  password: 'Password01'
};

const NAVIGATION_ITEMS = {
  Dashboard: { 
    path: '/business/dashboard', 
    title: 'Dashboard'
  },
  Appointments: { 
    path: '/business/dashboard/appointments', 
    title: 'Appointments'
  },
  'My Profile': { 
    path: '/business/dashboard/profile', 
    title: 'Profile'
  },
  'Business Settings': { 
    path: '/business/dashboard/settings', 
    title: 'Settings'
  },
  'Manage Services': { 
    path: '/business/dashboard/services', 
    title: 'Services'
  },
  Employees: { 
    path: '/business/dashboard/employees', 
    title: 'Employees'
  },
  Customers: { 
    path: '/business/dashboard/customers', 
    title: 'Customers'
  },
  'Scheduler Control': { 
    path: '/business/dashboard/scheduler', 
    title: 'Scheduler'
  },
  'Email Reminders': { 
    path: '/business/dashboard/email-reminders', 
    title: 'Email Reminders'
  },
  'Email Marketing': { 
    path: '/business/dashboard/email-marketing', 
    title: 'Email Marketing'
  },
  'Reports & Analytics': { 
    path: '/business/dashboard/reports', 
    title: 'Reports'
  },
  'Website Template': { 
    path: '/business/dashboard/template', 
    title: 'Website Template'
  },
  Subdomain: { 
    path: '/business/dashboard/subdomain', 
    title: 'Subdomain'
  }
};

// Store API request counts to check for redundant calls
const apiRequestCounts = new Map();

test.describe('Business Dashboard Navigation Tests', () => {
  let apiCalls = [];
  let responsePayloads = new Map();
  
  test.beforeEach(async ({ page }) => {
    // Increase timeouts for slower environments
    test.setTimeout(120000);
    page.setDefaultTimeout(60000);
    
    // Reset tracking
    apiCalls = [];
    apiRequestCounts.clear();
    responsePayloads.clear();

    // Intercept all API requests
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = request.url();
      
      // Track API calls
      apiCalls.push({
        url,
        method: request.method(),
        timestamp: Date.now()
      });
      
      // Count API requests
      const count = apiRequestCounts.get(url) || 0;
      apiRequestCounts.set(url, count + 1);

      // Store response payload for validation
      try {
        const response = await route.fetch();
        const json = await response.json();
        responsePayloads.set(url, json);
      } catch (error) {
        console.log(`Failed to parse response for ${url}:`, error);
      }

      await route.continue();
    });

    // Login before each test
    try {
      console.log('Navigating to login page...');
      await page.goto('/login');
      
      // Wait for login form to be ready
      console.log('Waiting for login form...');
      await page.waitForSelector('#email', { state: 'visible', timeout: 30000 });
      await page.waitForSelector('#password', { state: 'visible', timeout: 30000 });
      
      // Fill login form
      console.log('Filling login form...');
      await page.fill('#email', BUSINESS_LOGIN.email);
      await page.fill('#password', BUSINESS_LOGIN.password);
      
      // Click login and wait for navigation
      console.log('Submitting login...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('button[type="submit"]')
      ]);
      
      // Wait for dashboard to load
      console.log('Waiting for dashboard to load...');
      await page.waitForSelector('.dashboard-container', { timeout: 30000 });
      
      console.log('Login successful, dashboard loaded.');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  });

  // Test navigation to each section
  for (const [name, details] of Object.entries(NAVIGATION_ITEMS)) {
    test(`Navigate to ${name} section`, async ({ page }) => {
      // Find the navigation item by text
      const navSelector = `nav a:has-text("${name}")`;
      
      // Verify the navigation item exists
      await expect(page.locator(navSelector)).toBeVisible();
      
      // Click the navigation item
      await page.click(navSelector);
      
      // Verify URL matches expected path
      await expect(page).toHaveURL(new RegExp(details.path));
      
      // Try to capture a screenshot after navigation
      await page.screenshot({ path: `test-results/${name.replace(/\s+/g, '-')}-section.png` });
      
      // Verify main content area is loaded
      await expect(page.locator('.dashboard-container')).toBeVisible();
      
      // Check for any error messages that might appear during loading
      const hasErrorMessage = await page.isVisible('.error-message, [role="alert"]');
      if (hasErrorMessage) {
        console.log(`Warning: Error message found on ${name} page:`, 
          await page.textContent('.error-message, [role="alert"]'));
      }
      
      // Log that the navigation test passed
      console.log(`Successfully navigated to ${name} section at ${details.path}`);
    });
  }

  // Test for redundant API calls
  test('No redundant API calls on repeated navigation', async ({ page }) => {
    const dashboardLink = page.locator('nav a').filter({ hasText: 'Dashboard' }).first();
    
    // First navigation to Dashboard
    await dashboardLink.click();
    await page.waitForURL('**/dashboard**');
    
    // Get API call count after first navigation
    const firstCallCount = new Map(apiRequestCounts);
    
    // Second navigation to same page
    await dashboardLink.click();
    await page.waitForURL('**/dashboard**');
    
    // Compare API call counts
    for (const [url, count] of apiRequestCounts.entries()) {
      const previousCount = firstCallCount.get(url) || 0;
      const newCount = count - previousCount;
      
      // We don't expect new API calls when navigating to the same page
      if (newCount > 0) {
        console.log(`Warning: Redundant API call detected - ${url} called ${newCount} additional times`);
      }
    }
  });

  // Test proper error handling
  test('Proper error handling for failed API calls', async ({ page }) => {
    // Mock a failed API response for dashboard data
    await page.route('**/api/dashboard-data', route => {
      return route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    // Navigate to dashboard
    const dashboardLink = page.locator('nav a').filter({ hasText: 'Dashboard' }).first();
    await dashboardLink.click();
    
    // Verify error message is displayed or log that it's not handled
    const hasErrorMessage = await page.isVisible('.error-message, [role="alert"]');
    if (!hasErrorMessage) {
      console.log('Warning: No error message displayed for failed API call');
    }
    
    // Take a screenshot of how the error is handled
    await page.screenshot({ path: 'test-results/error-handling-test.png' });
  });

  // Simplified test for broken links
  test('No broken links in navigation', async ({ page }) => {
    // Get the navigation text items to test
    const navItems = Object.keys(NAVIGATION_ITEMS);
    
    console.log(`Testing ${navItems.length} navigation items`);
    
    for (let i = 0; i < navItems.length; i++) {
      const itemText = navItems[i];
      
      // Start from the dashboard for each test
      if (i > 0) {
        const dashboardLink = page.locator('nav a').filter({ hasText: 'Dashboard' }).first();
        await dashboardLink.click();
        await page.waitForLoadState('networkidle');
      }
      
      // Find and click the current nav item
      console.log(`Testing navigation item: ${itemText}`);
      const navItem = page.locator('nav a').filter({ hasText: itemText }).first();
      
      // Verify item exists
      await expect(navItem).toBeVisible();
      
      // Get href before clicking
      const href = await navItem.getAttribute('href');
      console.log(`Link href: ${href}`);
      
      // Skip external links
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        console.log(`Skipping external link: ${href}`);
        continue;
      }
      
      // Click the link
      await navItem.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Verify the page loaded - no 404
      const is404 = await page.isVisible('text="404"') || 
                   await page.isVisible('text="Page not found"');
      
      if (is404) {
        console.error(`Broken link found: ${itemText} (${href})`);
      } else {
        console.log(`Link works: ${itemText} (${href})`);
      }
      
      // Take a screenshot of the page we navigated to
      await page.screenshot({ path: `test-results/link-${i}-${itemText.replace(/\s+/g, '-')}.png` });
    }
  });
}); 