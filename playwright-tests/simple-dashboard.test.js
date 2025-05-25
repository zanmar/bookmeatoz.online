import { test, expect } from '@playwright/test';

// Test data
const BUSINESS_LOGIN = {
  email: 'test40@outlook.com',
  password: 'Password01'
};

test.describe('Basic Dashboard Navigation Test', () => {
  test('Login and access dashboard', async ({ page }) => {
    // Set longer timeout
    test.setTimeout(60000);
    
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
    
    // Take screenshot of login form
    await page.screenshot({ path: 'login-form.png' });
    
    // Click login and wait for navigation
    console.log('Submitting login...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]') // More general selector
    ]);
    
    // Log current URL to verify redirection
    console.log('Current URL after login:', page.url());
    
    // Take screenshot after login
    await page.screenshot({ path: 'after-login.png' });
    
    // Check if we're redirected to dashboard
    const currentUrl = page.url();
    console.log('Redirected to:', currentUrl);
    
    // Check for any visible error messages
    const hasErrorMessage = await page.isVisible('.error-message, .alert-error');
    if (hasErrorMessage) {
      const errorText = await page.textContent('.error-message, .alert-error');
      console.log('Error message displayed:', errorText);
    }
    
    // Check if dashboard elements exist
    // First, list all the selectors we can see
    const bodyContent = await page.textContent('body');
    console.log('Page content preview:', bodyContent.substring(0, 200).trim());
    
    // List all main elements on the page
    const mainElements = await page.$$eval('main, .dashboard-container, .main-content', 
      elements => elements.map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className
      }))
    );
    console.log('Main content elements:', mainElements);
    
    // List all navigation items
    const navItems = await page.$$eval('nav a, .sidebar a, .nav-item', 
      links => links.map(link => ({
        text: link.textContent?.trim(),
        href: link.href,
        className: link.className
      }))
    );
    console.log('Navigation items:', navItems);
  });
}); 