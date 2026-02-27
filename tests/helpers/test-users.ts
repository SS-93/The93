/**
 * ============================================================================
 * TEST USERS - E2E Testing Infrastructure
 * ============================================================================
 * Purpose: Define test user accounts for hybrid Playwright E2E testing
 * Strategy: Service role creates users → Playwright uses real sessions
 * ============================================================================
 */

import { v4 as uuidv4 } from 'uuid';

export interface TestUser {
    id: string;
    email: string;
    password: string;
    role: 'fan' | 'artist' | 'brand' | 'admin';
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    displayName: string;
    // Artist-specific
    artistId?: string;
    genres?: string[];
    location?: string;
    // MediaID
    mediaId?: string;
}

/**
 * Test User Registry
 * These users will be created once during global setup
 */
export const TEST_USERS: Record<string, TestUser> = {
    // ========================================================================
    // LISTENERS (Fans)
    // ========================================================================

    listener1: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'e2e-listener-1@buckets.test',
        password: 'test-password-123',
        role: 'fan',
        plan: 'free',
        displayName: 'Test Listener 1',
    },

    listener2: {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'e2e-listener-2@buckets.test',
        password: 'test-password-123',
        role: 'fan',
        plan: 'basic',
        displayName: 'Test Listener 2 (Basic Plan)',
    },

    listener3: {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'e2e-listener-3@buckets.test',
        password: 'test-password-123',
        role: 'fan',
        plan: 'pro',
        displayName: 'Test Listener 3 (Pro Plan)',
    },

    // ========================================================================
    // ARTISTS
    // ========================================================================

    artistIndie: {
        id: '00000000-0000-0000-0000-000000000010',
        email: 'e2e-artist-indie@buckets.test',
        password: 'test-password-123',
        role: 'artist',
        plan: 'pro',
        displayName: 'Indie Artist Test',
        artistId: '10000000-0000-0000-0000-000000000001',
        genres: ['indie', 'rock', 'alternative'],
        location: 'Los Angeles, CA',
    },

    artistHipHop: {
        id: '00000000-0000-0000-0000-000000000011',
        email: 'e2e-artist-hiphop@buckets.test',
        password: 'test-password-123',
        role: 'artist',
        plan: 'pro',
        displayName: 'Hip-Hop Artist Test',
        artistId: '10000000-0000-0000-0000-000000000002',
        genres: ['hip-hop', 'rap', 'urban'],
        location: 'Atlanta, GA',
    },

    artistElectronic: {
        id: '00000000-0000-0000-0000-000000000012',
        email: 'e2e-artist-electronic@buckets.test',
        password: 'test-password-123',
        role: 'artist',
        plan: 'pro',
        displayName: 'Electronic Artist Test',
        artistId: '10000000-0000-0000-0000-000000000003',
        genres: ['electronic', 'edm', 'house'],
        location: 'Berlin, Germany',
    },

    artistJazz: {
        id: '00000000-0000-0000-0000-000000000013',
        email: 'e2e-artist-jazz@buckets.test',
        password: 'test-password-123',
        role: 'artist',
        plan: 'basic',
        displayName: 'Jazz Artist Test',
        artistId: '10000000-0000-0000-0000-000000000004',
        genres: ['jazz', 'blues', 'soul'],
        location: 'New Orleans, LA',
    },

    artistPop: {
        id: '00000000-0000-0000-0000-000000000014',
        email: 'e2e-artist-pop@buckets.test',
        password: 'test-password-123',
        role: 'artist',
        plan: 'enterprise',
        displayName: 'Pop Artist Test',
        artistId: '10000000-0000-0000-0000-000000000005',
        genres: ['pop', 'dance', 'top-40'],
        location: 'New York, NY',
    },

    // ========================================================================
    // BRANDS
    // ========================================================================

    brand1: {
        id: '00000000-0000-0000-0000-000000000020',
        email: 'e2e-brand-1@buckets.test',
        password: 'test-password-123',
        role: 'brand',
        plan: 'enterprise',
        displayName: 'Test Brand 1',
    },

    // ========================================================================
    // ADMIN
    // ========================================================================

    admin: {
        id: '00000000-0000-0000-0000-000000000099',
        email: 'e2e-admin@buckets.test',
        password: 'test-password-123',
        role: 'admin',
        plan: 'enterprise',
        displayName: 'E2E Test Admin',
    },
};

/**
 * Get test user by email
 */
export function getTestUserByEmail(email: string): TestUser | undefined {
    return Object.values(TEST_USERS).find(user => user.email === email);
}

/**
 * Get all artists
 */
export function getTestArtists(): TestUser[] {
    return Object.values(TEST_USERS).filter(user => user.role === 'artist');
}

/**
 * Get all listeners
 */
export function getTestListeners(): TestUser[] {
    return Object.values(TEST_USERS).filter(user => user.role === 'fan');
}

/**
 * Get user by plan
 */
export function getTestUsersByPlan(plan: TestUser['plan']): TestUser[] {
    return Object.values(TEST_USERS).filter(user => user.plan === plan);
}

/**
 * Session storage paths for Playwright
 */
export const SESSION_PATHS = {
    listener1: 'playwright/.auth/listener1.json',
    listener2: 'playwright/.auth/listener2.json',
    listener3: 'playwright/.auth/listener3.json',
    artistIndie: 'playwright/.auth/artist-indie.json',
    artistHipHop: 'playwright/.auth/artist-hiphop.json',
    artistElectronic: 'playwright/.auth/artist-electronic.json',
    artistJazz: 'playwright/.auth/artist-jazz.json',
    artistPop: 'playwright/.auth/artist-pop.json',
    brand1: 'playwright/.auth/brand1.json',
    admin: 'playwright/.auth/admin.json',
};

export default TEST_USERS;
