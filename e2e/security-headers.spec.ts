import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
  test('should have comprehensive security headers on main page', async ({ page }) => {
    const response = await page.goto('/');
    
    // Verify response is successful
    expect(response?.status()).toBe(200);
    
    // Check security headers
    const headers = response?.headers() || {};
    
    // Basic security headers
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
    
    // Additional security headers from middleware
    expect(headers['x-dns-prefetch-control']).toBe('off');
    expect(headers['x-download-options']).toBe('noopen');
    expect(headers['x-permitted-cross-domain-policies']).toBe('none');
    
    // Content Security Policy
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).toContain("base-uri 'self'");
    expect(headers['content-security-policy']).toContain("form-action 'self'");
    
    // Cache control for main page (should prevent caching)
    expect(headers['cache-control']).toContain('no-store');
  });

  test('should have proper service worker headers', async ({ page }) => {
    const response = await page.goto('/sw.js');
    
    // Verify response is successful
    expect(response?.status()).toBe(200);
    
    const headers = response?.headers() || {};
    
    // Service worker specific headers
    expect(headers['content-type']).toBe('application/javascript; charset=utf-8');
    expect(headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
    expect(headers['service-worker-allowed']).toBe('/');
    
    // Security headers should still be present
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    
    // Service worker specific CSP
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("script-src 'self' 'unsafe-eval'");
  });

  test('should have proper manifest headers', async ({ page, browserName }) => {
    // Skip Firefox due to download behavior with manifest.json
    if (browserName === 'firefox') {
      test.skip();
      return;
    }
    
    const response = await page.goto('/manifest.json');
    
    // Verify response is successful
    expect(response?.status()).toBe(200);
    
    const headers = response?.headers() || {};
    
    // Manifest specific headers
    expect(headers['content-type']).toBe('application/manifest+json');
    expect(headers['cache-control']).toBe('public, max-age=31536000, immutable');
    
    // Security headers should still be present
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
  });

  test('should have proper static asset headers', async ({ page }) => {
    // Test an icon file
    const response = await page.goto('/img/icon-192-192.png');
    
    // Verify response is successful
    expect(response?.status()).toBe(200);
    
    const headers = response?.headers() || {};
    
    // Static asset caching
    expect(headers['cache-control']).toBe('public, max-age=31536000, immutable');
    
    // Security headers should still be present
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
  });

  test('should prevent clickjacking with X-Frame-Options', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    
    // Should deny framing completely
    expect(headers['x-frame-options']).toBe('DENY');
  });

  test('should have CSP that prevents XSS attacks', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    
    const csp = headers['content-security-policy'] || '';
    
    // Should have restrictive default-src
    expect(csp).toContain("default-src 'self'");
    
    // Should prevent inline scripts (except where needed for Next.js)
    expect(csp).toContain("script-src 'self'");
    
    // Should prevent data: URIs for scripts
    expect(csp).not.toContain("script-src 'self' data:");
    
    // Should prevent frame ancestors
    expect(csp).toContain("frame-ancestors 'none'");
    
    // Should restrict base URI
    expect(csp).toContain("base-uri 'self'");
    
    // Should restrict form actions
    expect(csp).toContain("form-action 'self'");
  });
});