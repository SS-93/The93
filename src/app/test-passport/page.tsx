"use client";

import { usePassport } from "@/hooks/usePassport";
import { useState } from "react";

/**
 * TEST PASSPORT HARNESS
 * Route: /test-passport
 * 
 * Purpose:
 * Provides deterministic UI elements for E2E tests to trigger usePassport logs.
 * This decouples testing from the main application UI logic.
 */
export default function TestPassportPage() {
    const { logEvent } = usePassport();
    const [status, setStatus] = useState<string>("Ready");
    const [lastEventId, setLastEventId] = useState<string>("");

    const handleLogPlay = async () => {
        setStatus("Logging Play Event...");
        try {
            await logEvent("player.track_played", {
                trackId: "track-indie-1",
                artistId: "10000000-0000-0000-0000-000000000001", // artistIndie
                duration: 180,
                progress: 180, // Also useful for local UI
                completion_pct: 1.0, // REQUIRED by Buckets_SB Backend for Thymine Score
                source: "test_harness",
                artist_genres: ["indie", "rock"] // Explicit genre for A-Domain
            });
            setStatus("Play Event Logged");
            setLastEventId(Date.now().toString()); // Just a signal that it finished
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
    };

    const handleLogFollow = async () => {
        setStatus("Logging Follow Event...");
        try {
            await logEvent("social.user_followed", {
                targetUserId: "00000000-0000-0000-0000-000000000010", // artistIndie User ID
                source: "test_harness_profile",
            });
            setStatus("Follow Event Logged");
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Passport E2E Test Harness</h1>

            <div className="bg-gray-100 p-4 rounded text-sm font-mono" data-testid="status-display">
                Status: <span className="font-bold">{status}</span>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">A-Domain (Culture)</h2>
                <button
                    onClick={handleLogPlay}
                    data-testid="btn-log-play"
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                    Log Track Play
                </button>

                <h2 className="text-xl font-semibold">T-Domain (Behavior)</h2>
                <button
                    onClick={handleLogFollow}
                    data-testid="btn-log-follow"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Log Artist Follow
                </button>
            </div>

            <div className="mt-8 pt-8 border-t text-xs text-gray-400">
                This page is for internal verification only.
            </div>
        </div>
    );
}
