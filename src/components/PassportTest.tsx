/**
 * Passport Event Tracking Test Component
 *
 * Quick test page to verify Passport → Backend → Database flow
 */

import React, { useState } from 'react';
import { usePassport } from '../hooks/usePassport';
import { useAuth } from '../hooks/useAuth';

export default function PassportTest() {
  const { user } = useAuth();
  const { logEvent } = usePassport();
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testEvents = [
    {
      name: '🎵 Track Played',
      payload: {
        type: 'player.track_played' as const,
        trackId: 'test-track-123',
        artistId: 'test-artist-456',
        durationSeconds: 180,
      }
    },
    {
      name: '🗳️ Vote Cast',
      payload: {
        type: 'coliseum.vote_cast' as const,
        artistId: 'test-artist-456',
        eventId: 'test-event-789',
        channel: 'web' as const,
        weight: 1,
      }
    },
    {
      name: '🎟️ Event Attended',
      payload: {
        type: 'concierto.event_attended' as const,
        eventId: 'test-event-789',
        city: 'Boston',
        method: 'scan' as const,
      }
    },
    {
      name: '❤️ Track Favorited',
      payload: {
        type: 'player.track_favorited' as const,
        trackId: 'test-track-123',
        artistId: 'test-artist-456',
      }
    }
  ];

  const handleTest = async (eventData: any) => {
    if (!user) {
      setStatus('❌ No user logged in!');
      return;
    }

    setLoading(true);
    setStatus(`⏳ Logging ${eventData.name}...`);

    try {
      const payload = {
        ...eventData.payload,
        userId: user.id,
        at: new Date().toISOString(),
      };

      await logEvent(eventData.payload.type, payload);

      setStatus(`Play Event Logged`);
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBackendDirect = async () => {
    if (!user) {
      setStatus('❌ No user logged in!');
      return;
    }

    setLoading(true);
    setStatus('⏳ Testing direct backend call...');

    try {
      const response = await fetch('http://localhost:8000/api/passport/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'player.track_played',
          userId: user.id,
          trackId: 'direct-test-track',
          artistId: 'direct-test-artist',
          at: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`✅ Backend responded! Latency: ${data.latency}ms, ID: ${data.id}`);
      } else {
        setStatus(`❌ Backend error: ${data.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ Connection error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkStats = async () => {
    setLoading(true);
    setStatus('⏳ Fetching Passport stats...');

    try {
      const response = await fetch('http://localhost:8000/api/passport/stats');
      const data = await response.json();

      setStatus(`📊 Stats: ${data.total_entries} total, ${data.unprocessed_entries} unprocessed`);
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Passport E2E Test Harness</h1>
        <p className="text-gray-400 mb-8">
          Test the Passport → Backend → Database pipeline
        </p>

        {/* User Info */}
        <div className="mb-8 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <h2 className="text-lg font-bold mb-2">👤 Current User</h2>
          {user ? (
            <div className="text-sm">
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>ID:</strong> {user.id}</div>
            </div>
          ) : (
            <div className="text-red-400">❌ Not logged in</div>
          )}
        </div>

        {/* Status Display - with data-testid */}
        <div className="mb-8 p-4 bg-gray-900 border border-gray-700 rounded-lg" data-testid="status-display">
          <div className="font-mono text-sm">
            Status: <span className="font-bold">{status || 'Ready'}</span>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold mb-4">🧪 Test Events</h2>

          {testEvents.map((event, index) => (
            <button
              key={index}
              onClick={() => handleTest(event)}
              disabled={loading || !user}
              data-testid={index === 0 ? 'btn-log-play' : undefined}
              className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-bold">{event.name}</div>
              <div className="text-sm text-gray-400 mt-1">
                Event: {event.payload.type}
              </div>
            </button>
          ))}
        </div>

        {/* Debug Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">🔧 Debug Actions</h2>

          <button
            onClick={testBackendDirect}
            disabled={loading || !user}
            className="w-full p-4 bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg text-left transition-colors disabled:opacity-50"
          >
            <div className="font-bold">🔌 Test Backend Direct</div>
            <div className="text-sm text-gray-400 mt-1">
              Bypass hook, call fetch() directly
            </div>
          </button>

          <button
            onClick={checkStats}
            disabled={loading}
            className="w-full p-4 bg-purple-900 hover:bg-purple-800 border border-purple-700 rounded-lg text-left transition-colors disabled:opacity-50"
          >
            <div className="font-bold">📊 Check Passport Stats</div>
            <div className="text-sm text-gray-400 mt-1">
              GET /api/passport/stats
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <h3 className="font-bold mb-2">📝 How to Verify</h3>
          <ol className="text-sm space-y-2 list-decimal list-inside text-gray-300">
            <li>Click a test event button above</li>
            <li>Check backend console for logs (📥 [Passport API])</li>
            <li>Check database: <code className="bg-black px-2 py-1 rounded">SELECT * FROM passport_entries ORDER BY created_at DESC LIMIT 10;</code></li>
            <li>Click "Check Passport Stats" to see total entries</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
