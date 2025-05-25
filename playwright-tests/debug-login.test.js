import { test, expect } from '@playwright/test';

test('Debug login page', async ({ page }) => {
  // Set long timeout to ensure page has time to load
  test.setTimeout(120000);
  
  console.log('Navigating to login page...');
  
  // Navigate to the login page
  await page.goto('/login');
  
  // Wait for any redirects to complete
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot to see what's actually displayed
  await page.screenshot({ path: 'login-page-debug.png' });
  
  // Log the current URL
  console.log('Current URL:', page.url());
  
  // Log the page HTML to examine the structure
  const html = await page.content();
  console.log('Page HTML (first 1000 chars):', html.substring(0, 1000));
  
  // Try to find the login form elements using various selectors
  const formExists = await page.isVisible('form');
  const identifierExists = await page.isVisible('#identifier');
  const emailInputExists = await page.isVisible('[data-testid="email-input"]');
  const emailExists = await page.isVisible('input[type="email"]');
  const anyEmailInput = await page.isVisible('input[placeholder*="email" i]');
  const anyInput = await page.isVisible('input');
  const anyButton = await page.isVisible('button');
  
  console.log('Element visibility:');
  console.log('- form element:', formExists);
  console.log('- #identifier:', identifierExists);
  console.log('- [data-testid="email-input"]:', emailInputExists);
  console.log('- input[type="email"]:', emailExists);
  console.log('- input with email placeholder:', anyEmailInput);
  console.log('- any input:', anyInput);
  console.log('- any button:', anyButton);
  
  // List all form elements on the page
  const forms = await page.$$eval('form', forms => 
    forms.map(form => ({
      id: form.id,
      className: form.className,
      action: form.action
    }))
  );
  console.log('Forms on page:', forms);
  
  // List all input elements on the page
  const inputs = await page.$$eval('input', inputs => 
    inputs.map(input => ({
      type: input.type,
      id: input.id,
      name: input.name,
      placeholder: input.placeholder,
      className: input.className
    }))
  );
  console.log('All input elements:', inputs);
  
  // List all buttons on the page
  const buttons = await page.$$eval('button', buttons => 
    buttons.map(button => ({
      text: button.textContent,
      id: button.id,
      className: button.className,
      type: button.type
    }))
  );
  console.log('All buttons:', buttons);
  
  // Get all links to check navigation structure
  const links = await page.$$eval('a', links => 
    links.map(link => ({
      text: link.textContent,
      href: link.href
    }))
  );
  console.log('All links:', links);
}); 