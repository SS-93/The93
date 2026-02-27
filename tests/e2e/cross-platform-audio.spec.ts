import { test, expect } from '@playwright/test';

/**
 * ============================================================================
 * CROSS-PLATFORM AUDIO TRACKING E2E TESTS
 * ============================================================================
 * Purpose: Verify audio play tracking works correctly across all platforms
 * Platforms: Web (desktop), iOS Safari, Android Chrome, iPad
 * ============================================================================
 */

test.describe('Cross-Platform Audio Tracking', () => {
  
  // Helper: Setup mock content and capture Passport events
  async function setupTest(page: any) {
    // Mock content_items
    await page.route('**/rest/v1/content_items*', async (route: any) => {
      const url = route.request().url();
      if (url.includes('count=exact')) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-track-id',
            title: 'Cross-Platform Test Track',
            content_type: 'audio',
            file_path: 'test/track.mp3',
            duration_seconds: 180,
            artist_id: 'test-artist-id',
            is_published: true,
            metadata: {},
            artist_profiles: {
              id: 'test-artist-id',
              artist_name: 'Test Artist',
              user_id: 'artist-user-id'
            },
            audio_features: [],
            mood_tags: []
          }
        ])
      });
    });

    // Mock storage URL
    await page.route('**/storage/v1/object/sign/artist-content*', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          signedUrl: 'https://example.com/fake-audio.mp3'
        })
      });
    });

    // Capture Passport events
    let capturedEvent: any = null;
    await page.route('**/rest/v1/passport_entries', async (route: any) => {
      if (route.request().method() === 'POST') {
        const postData = route.request().postDataJSON();
        const events = Array.isArray(postData) ? postData : [postData];
        const event = events.find((e: any) => e.event_type === 'player.track_played');
        if (event) {
          capturedEvent = event;
        }
      }
      await route.continue();
    });

    return { capturedEvent };
  }

  test('Web platform detection (desktop)', async ({ page }) => {
    const { capturedEvent } = await setupTest(page);
    
    // Navigate to player
    await page.goto('/player');
    await expect(page.getByText('Cross-Platform Test Track')).toBeVisible();
    
    // Wait for event
    await expect.poll(() => capturedEvent, { timeout: 10000 }).toBeTruthy();
    
    // Verify web platform
    expect(capturedEvent.metadata.source).toBe('web');
    expect(capturedEvent.metadata.platform.deviceType).toBe('desktop');
    expect(capturedEvent.metadata.platform.userAgent).toContain('Chrome'); // Playwright uses Chromium
  });

  test('iOS Safari platform detection (iPhone)', async ({ page }) => {
    // Set iOS iPhone user agent
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    );
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const { capturedEvent } = await setupTest(page);
    
    await page.goto('/player');
    await expect(page.getByText('Cross-Platform Test Track')).toBeVisible();
    
    await expect.poll(() => capturedEvent, { timeout: 10000 }).toBeTruthy();
    
    // Verify iOS platform
    expect(capturedEvent.metadata.source).toBe('ios');
    expect(capturedEvent.metadata.platform.deviceType).toBe('mobile');
    expect(capturedEvent.metadata.platform.os).toBe('iOS');
    expect(capturedEvent.metadata.platform.osVersion).toBeDefined();
  });

  test('iPad platform detection (tablet)', async ({ page }) => {
    // Set iPad user agent
    await page.setUserAgent(
      'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    );
    
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const { capturedEvent } = await setupTest(page);
    
    await page.goto('/player');
    await expect(page.getByText('Cross-Platform Test Track')).toBeVisible();
    
    await expect.poll(() => capturedEvent, { timeout: 10000 }).toBeTruthy();
    
    // Verify iPad platform
    expect(capturedEvent.metadata.source).toBe('ios');
    expect(capturedEvent.metadata.platform.deviceType).toBe('tablet');
    expect(capturedEvent.metadata.platform.os).toBe('iOS');
  });

  test('Android Chrome platform detection (phone)', async ({ page }) => {
    // Set Android Chrome user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    );
    
    // Set mobile viewport
    await page.setViewportSize({ width: 360, height: 640 });
    
    const { capturedEvent } = await setupTest(page);
    
    await page.goto('/player');
    await expect(page.getByText('Cross-Platform Test Track')).toBeVisible();
    
    await expect.poll(() => capturedEvent, { timeout: 10000 }).toBeTruthy();
    
    // Verify Android platform
    expect(capturedEvent.metadata.source).toBe('android');
    expect(capturedEvent.metadata.platform.deviceType).toBe('mobile');
    expect(capturedEvent.metadata.platform.os).toBe('Android');
    expect(capturedEvent.metadata.platform.osVersion).toBeDefined();
    expect(capturedEvent.metadata.platform.browser).toBe('Chrome');
  });

  test('Android Chrome platform detection (tablet)', async ({ page }) => {
    // Set Android tablet user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 10; SM-T860) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36'
    );
    
    // Set tablet viewport
    await page.setViewportSize({ width: 800, height: 1280 });
    
    const { capturedEvent } = await setupTest(page);
    
    await page.goto('/player');
    await expect(page.getByText('Cross-Platform Test Track')).toBeVisible();
    
    await expect.poll(() => capturedEvent, { timeout: 10000 }).toBeTruthy();
    
    // Verify Android tablet platform
    expect(capturedEvent.metadata.source).toBe('android');
    expect(capturedEvent.metadata.platform.deviceType).toBe('tablet');
    expect(capturedEvent.metadata.platform.os).toBe('Android');
  });

  test('Platform metadata consistency across platforms', async ({ page }) => {
    const { capturedEvent } = await setupTest(page);
    
    await page.goto('/player');
    await expect(page.getByText('Cross-Platform Test Track')).toBeVisible();
    
    await expect.poll(() => capturedEvent, { timeout: 10000 }).toBeTruthy();
    
    // Verify all required metadata fields are present
    const platform = capturedEvent.metadata.platform;
    
    expect(platform).toBeDefined();
    expect(platform.source).toBeDefined();
    expect(platform.userAgent).toBeDefined();
    expect(platform.screenWidth).toBeGreaterThan(0);
    expect(platform.screenHeight).toBeGreaterThan(0);
    expect(platform.language).toBeDefined();
    expect(platform.platform).toBeDefined();
    expect(platform.vendor).toBeDefined();
    expect(platform.deviceType).toBeOneOf(['mobile', 'tablet', 'desktop']);
    
    // Verify source matches platform
    expect(['web', 'ios', 'android']).toContain(platform.source);
  });
});
