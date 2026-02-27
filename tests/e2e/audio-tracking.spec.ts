import { test, expect } from '@playwright/test';

test.describe('Audio Tracking Verification', () => {

    test('Player logs track_played event on playback', async ({ page }) => {
        // 1. Mock content_items to ensure track availability
        await page.route('**/rest/v1/content_items*', async route => {
            const url = route.request().url();
            if (url.includes('count=exact')) {
                await route.continue();
                return;
            }

            console.log('Mocking content_items response');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'test-track-id',
                        title: 'Verification Track',
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

        // 2. Intercept storage/v1/object/sign to return a valid dummy URL
        await page.route('**/storage/v1/object/sign/artist-content*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    signedUrl: 'https://example.com/fake-audio.mp3'
                })
            });
        });

        // 3. Spy on passport_entries POST requests
        let trackPlayedEvent = null;
        await page.route('**/rest/v1/passport_entries', async route => {
            if (route.request().method() === 'POST') {
                const postData = route.request().postDataJSON();
                // Check if this is our event (it might be a batch or single)
                // postData could be array or object
                const events = Array.isArray(postData) ? postData : [postData];
                const event = events.find(e => e.event_type === 'player.track_played');

                if (event) {
                    console.log('Captured player.track_played event:', event);
                    trackPlayedEvent = event;
                }
            }
            await route.continue();
        });

        // 4. Navigate to /player
        // We assume the environment has some auth state, but if not, logic 
        // inside AudioPlayerContext relies on `user` object.
        // If this test fails due to "No user authenticated", we need to inject auth.
        await page.goto('/player');

        // 5. Interact to play
        // PlayerPage auto-plays if tracks are found. 
        // But we might need to click if auto-play is blocked.

        // Wait for the track to appear
        await expect(page.getByText('Verification Track')).toBeVisible();

        // Verify event capture (waitFor poll)
        await expect.poll(() => trackPlayedEvent, { timeout: 10000 }).toBeTruthy();

        // Verify payload
        expect(trackPlayedEvent).toMatchObject({
            trackId: 'test-track-id',
            artistId: 'test-artist-id'
        });
    });

    test('Player logs platform metadata on track_played', async ({ page }) => {
        // Mock content_items
        await page.route('**/rest/v1/content_items*', async route => {
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
                        title: 'Verification Track',
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
        await page.route('**/storage/v1/object/sign/artist-content*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    signedUrl: 'https://example.com/fake-audio.mp3'
                })
            });
        });

        // Intercept Passport POST to capture platform metadata
        let trackPlayedEvent = null;
        await page.route('**/rest/v1/passport_entries', async route => {
            if (route.request().method() === 'POST') {
                const postData = route.request().postDataJSON();
                const events = Array.isArray(postData) ? postData : [postData];
                const event = events.find(e => e.event_type === 'player.track_played');
                if (event) {
                    trackPlayedEvent = event;
                }
            }
            await route.continue();
        });

        // Navigate to player
        await page.goto('/player');

        // Wait for track to appear
        await expect(page.getByText('Verification Track')).toBeVisible();

        // Wait for event capture
        await expect.poll(() => trackPlayedEvent, { timeout: 10000 }).toBeTruthy();

        // Verify platform detection
        expect(trackPlayedEvent.metadata).toBeDefined();
        expect(trackPlayedEvent.metadata.source).toBeOneOf(['web', 'ios', 'android']);
        expect(trackPlayedEvent.metadata.platform).toBeDefined();
        expect(trackPlayedEvent.metadata.platform.userAgent).toBeDefined();
        expect(trackPlayedEvent.metadata.platform.screenWidth).toBeGreaterThan(0);
        expect(trackPlayedEvent.metadata.platform.screenHeight).toBeGreaterThan(0);
        expect(trackPlayedEvent.metadata.platform.deviceType).toBeOneOf(['mobile', 'tablet', 'desktop']);
        expect(trackPlayedEvent.metadata.platform.language).toBeDefined();
    });
});
