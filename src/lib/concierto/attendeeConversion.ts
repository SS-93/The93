/**
 * Attendee Conversion Pipeline
 * 
 * Syncs data from registration forms and converts attendees to user accounts
 * Handles: event_participants, event_audience_members, event_artist_prospects
 */

import { supabase } from '../supabaseClient';
import { logEvent } from '../passport/passportClient';

// =============================================================================
// TYPES
// =============================================================================

export type AttendeeType = 'artist' | 'fan' | 'participant';

export type ConversionSource = 
  | 'ticket_purchase' 
  | 'rsvp' 
  | 'manual' 
  | 'invite' 
  | 'qr_scan'
  | 'registration_form';

export interface AttendeeRecord {
  id: string;
  event_id: string;
  type: AttendeeType;
  name: string;
  email: string | null;
  phone: string | null;
  instagram?: string | null;
  registered_at: string;
  converted_user_id?: string | null;
  converted_at?: string | null;
  conversion_source?: ConversionSource | null;
}

export interface ConversionResult {
  success: boolean;
  attendee_id: string;
  attendee_type: AttendeeType;
  user_id?: string;
  action: 'linked' | 'created' | 'skipped' | 'error';
  message: string;
}

// =============================================================================
// CONVERSION LOGIC
// =============================================================================

/**
 * Check if email exists in auth.users
 * 
 * Note: Since we can't directly query auth.users from client,
 * we'll use a backend RPC function or attempt sign-in check.
 * For production, implement backend RPC: check_user_email(email)
 */
export async function checkEmailExists(email: string): Promise<{ exists: boolean; userId?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Try RPC function if it exists (recommended approach)
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('check_user_email', { email_address: normalizedEmail });

      if (!rpcError && rpcResult) {
        return { exists: true, userId: rpcResult };
      }
    } catch (rpcErr) {
      // RPC might not exist - that's okay, try alternative
    }

    // Alternative: Use backend API endpoint
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/conversion/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.exists) {
          return { exists: true, userId: result.userId };
        }
      }
    } catch (apiErr) {
      // Backend endpoint might not exist - that's okay
    }

    // Fallback: Return false (email not found)
    // In production, implement one of the above methods
    console.warn('[Conversion] Email check: No RPC or backend endpoint available. Assuming email not found.');
    return { exists: false };
  } catch (error) {
    console.error('[Conversion] Error checking email:', error);
    return { exists: false };
  }
}

/**
 * Link attendee to existing user account
 */
export async function linkAttendeeToUser(
  attendeeId: string,
  attendeeType: AttendeeType,
  eventId: string,
  userId: string,
  conversionSource: ConversionSource = 'registration_form'
): Promise<ConversionResult> {
  try {
    let updateResult;

    // Update based on attendee type
    if (attendeeType === 'artist') {
      const { data, error } = await supabase
        .from('event_artist_prospects')
        .update({
          migrated_to_user_id: userId,
          migration_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', attendeeId)
        .select()
        .single();

      updateResult = { data, error };
    } else if (attendeeType === 'fan' || attendeeType === 'participant') {
      // Try event_participants first
      const { data: participantData, error: participantError } = await supabase
        .from('event_participants')
        .update({
          user_account_id: userId,
          user_account_created: true,
          conversion_source: conversionSource,
          conversion_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', attendeeId)
        .select()
        .single();

      if (!participantError && participantData) {
        updateResult = { data: participantData, error: null };
      } else {
        // Try event_audience_members
        const { data: audienceData, error: audienceError } = await supabase
          .from('event_audience_members')
          .update({
            user_account_id: userId,
            user_account_created: true,
            conversion_source: conversionSource,
            conversion_timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', attendeeId)
          .select()
          .single();

        updateResult = { data: audienceData, error: audienceError };
      }
    }

    if (updateResult?.error) {
      throw updateResult.error;
    }

    // Create conversion record
    await createConversionRecord({
      eventId,
      attendeeType,
      attendeeId,
      originalEmail: updateResult?.data?.email || '',
      originalName: updateResult?.data?.name || updateResult?.data?.artist_name || '',
      convertedUserId: userId,
      conversionSource
    });

    // Log to Passport
    await logEvent('concierto.attendee_converted_to_user', {
      event_id: eventId,
      attendee_id: attendeeId,
      attendee_type: attendeeType,
      user_id: userId,
      conversion_source: conversionSource
    });

    return {
      success: true,
      attendee_id: attendeeId,
      attendee_type: attendeeType,
      user_id: userId,
      action: 'linked',
      message: 'Successfully linked attendee to user account'
    };
  } catch (error: any) {
    console.error('[Conversion] Error linking attendee:', error);
    return {
      success: false,
      attendee_id: attendeeId,
      attendee_type: attendeeType,
      action: 'error',
      message: error.message || 'Failed to link attendee to user account'
    };
  }
}

/**
 * Create new user account from attendee data
 * 
 * NOTE: User creation requires backend/admin API access.
 * This function should call a backend endpoint or Edge Function.
 * For now, it returns an error directing to use backend.
 */
export async function createUserFromAttendee(
  attendeeId: string,
  attendeeType: AttendeeType,
  eventId: string,
  email: string,
  name: string,
  phone?: string,
  conversionSource: ConversionSource = 'registration_form'
): Promise<ConversionResult> {
  try {
    // TODO: Call backend endpoint for user creation
    // POST /api/conversion/create-user
    // This requires admin privileges and should be done server-side
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/conversion/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attendeeId,
        attendeeType,
        eventId,
        email: email.toLowerCase().trim(),
        name,
        phone,
        conversionSource
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create user' }));
      throw new Error(errorData.message || 'Failed to create user account');
    }

    const result = await response.json();

    if (!result.success || !result.userId) {
      throw new Error(result.message || 'User creation failed');
    }

    // Link attendee to user
    const linkResult = await linkAttendeeToUser(
      attendeeId,
      attendeeType,
      eventId,
      result.userId,
      conversionSource
    );

    if (!linkResult.success) {
      throw new Error(linkResult.message);
    }

    // Log to Passport
    await logEvent('concierto.user_account_created_from_attendee', {
      event_id: eventId,
      attendee_id: attendeeId,
      attendee_type: attendeeType,
      user_id: result.userId,
      conversion_source: conversionSource
    });

    return {
      success: true,
      attendee_id: attendeeId,
      attendee_type: attendeeType,
      user_id: result.userId,
      action: 'created',
      message: 'Successfully created user account and linked attendee'
    };
  } catch (error: any) {
    console.error('[Conversion] Error creating user:', error);
    
    // If backend endpoint doesn't exist, return helpful error
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        success: false,
        attendee_id: attendeeId,
        attendee_type: attendeeType,
        action: 'error',
        message: 'User creation requires backend API. Please implement /api/conversion/create-user endpoint.'
      };
    }
    
    return {
      success: false,
      attendee_id: attendeeId,
      attendee_type: attendeeType,
      action: 'error',
      message: error.message || 'Failed to create user account'
    };
  }
}

/**
 * Create conversion record in attendee_conversions table
 */
async function createConversionRecord(params: {
  eventId: string;
  attendeeType: AttendeeType;
  attendeeId: string;
  originalEmail: string;
  originalName: string;
  convertedUserId: string;
  conversionSource: ConversionSource;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('attendee_conversions')
      .insert({
        event_id: params.eventId,
        attendee_type: params.attendeeType,
        attendee_id: params.attendeeId,
        original_email: params.originalEmail,
        original_name: params.originalName,
        converted_user_id: params.convertedUserId,
        conversion_source: params.conversionSource,
        conversion_timestamp: new Date().toISOString(),
        metadata: {
          converted_at: new Date().toISOString()
        }
      });

    if (error) {
      // Table might not exist yet - log but don't fail
      console.warn('[Conversion] Could not create conversion record (table may not exist):', error);
    }
  } catch (error) {
    console.warn('[Conversion] Error creating conversion record:', error);
  }
}

/**
 * Sync attendee from registration form
 * 
 * This is called automatically when:
 * - User registers via AudienceRegistration form
 * - Artist registers via ArtistRegistration form
 * - Participant votes via voting interface
 */
export async function syncAttendeeFromRegistration(
  eventId: string,
  attendeeType: AttendeeType,
  attendeeData: {
    id: string;
    email?: string | null;
    name: string;
    phone?: string | null;
  },
  conversionSource: ConversionSource = 'registration_form'
): Promise<ConversionResult> {
  try {
    // Skip if no email
    if (!attendeeData.email) {
      return {
        success: false,
        attendee_id: attendeeData.id,
        attendee_type: attendeeType,
        action: 'skipped',
        message: 'No email provided - cannot convert without email'
      };
    }

    // Check if email exists
    const emailCheck = await checkEmailExists(attendeeData.email);

    if (emailCheck.exists && emailCheck.userId) {
      // Link to existing user
      return await linkAttendeeToUser(
        attendeeData.id,
        attendeeType,
        eventId,
        emailCheck.userId,
        conversionSource
      );
    } else {
      // Option 1: Auto-create user account (if enabled)
      // Option 2: Queue for manual conversion (default)
      
      // For now, we'll queue for manual conversion
      // But log the potential conversion
      await logEvent('concierto.attendee_registered', {
        event_id: eventId,
        attendee_id: attendeeData.id,
        attendee_type: attendeeType,
        email: attendeeData.email,
        conversion_ready: true,
        conversion_source: conversionSource
      });

      return {
        success: true,
        attendee_id: attendeeData.id,
        attendee_type: attendeeType,
        action: 'skipped',
        message: 'Attendee registered - ready for conversion (email not found in system)'
      };
    }
  } catch (error: any) {
    console.error('[Conversion] Error syncing attendee:', error);
    return {
      success: false,
      attendee_id: attendeeData.id,
      attendee_type: attendeeType,
      action: 'error',
      message: error.message || 'Failed to sync attendee from registration'
    };
  }
}

/**
 * Bulk convert attendees
 */
export async function bulkConvertAttendees(
  eventId: string,
  attendeeIds: string[],
  attendeeType: AttendeeType,
  autoCreate: boolean = false
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];

  for (const attendeeId of attendeeIds) {
    try {
      // Fetch attendee data
      let attendeeData: any;

      if (attendeeType === 'artist') {
        const { data, error } = await supabase
          .from('event_artist_prospects')
          .select('id, email, artist_name as name, phone')
          .eq('id', attendeeId)
          .single();

        if (error) throw error;
        attendeeData = data;
      } else {
        // Try event_participants
        const { data: participantData, error: participantError } = await supabase
          .from('event_participants')
          .select('id, email, name, phone')
          .eq('id', attendeeId)
          .single();

        if (!participantError && participantData) {
          attendeeData = participantData;
        } else {
          // Try event_audience_members
          const { data: audienceData, error: audienceError } = await supabase
            .from('event_audience_members')
            .select('id, email, name, phone')
            .eq('id', attendeeId)
            .single();

          if (audienceError) throw audienceError;
          attendeeData = audienceData;
        }
      }

      if (!attendeeData.email) {
        results.push({
          success: false,
          attendee_id: attendeeId,
          attendee_type: attendeeType,
          action: 'skipped',
          message: 'No email provided'
        });
        continue;
      }

      // Check email
      const emailCheck = await checkEmailExists(attendeeData.email);

      if (emailCheck.exists && emailCheck.userId) {
        // Link
        const result = await linkAttendeeToUser(
          attendeeId,
          attendeeType,
          eventId,
          emailCheck.userId,
          'manual'
        );
        results.push(result);
      } else if (autoCreate) {
        // Create
        const result = await createUserFromAttendee(
          attendeeId,
          attendeeType,
          eventId,
          attendeeData.email,
          attendeeData.name,
          attendeeData.phone,
          'manual'
        );
        results.push(result);
      } else {
        results.push({
          success: false,
          attendee_id: attendeeId,
          attendee_type: attendeeType,
          action: 'skipped',
          message: 'Email not found - enable auto-create to create accounts'
        });
      }
    } catch (error: any) {
      results.push({
        success: false,
        attendee_id: attendeeId,
        attendee_type: attendeeType,
        action: 'error',
        message: error.message || 'Failed to convert attendee'
      });
    }
  }

  return results;
}

/**
 * Get conversion status for attendee
 */
export async function getConversionStatus(
  attendeeId: string,
  attendeeType: AttendeeType
): Promise<{
  converted: boolean;
  userId?: string;
  convertedAt?: string;
  conversionSource?: ConversionSource;
}> {
  try {
    if (attendeeType === 'artist') {
      const { data, error } = await supabase
        .from('event_artist_prospects')
        .select('migrated_to_user_id, migration_completed_at')
        .eq('id', attendeeId)
        .single();

      if (error) throw error;

      return {
        converted: !!data?.migrated_to_user_id,
        userId: data?.migrated_to_user_id || undefined,
        convertedAt: data?.migration_completed_at || undefined,
        conversionSource: data?.migrated_to_user_id ? 'manual' : undefined
      };
    } else {
      // Try event_participants
      const { data: participantData, error: participantError } = await supabase
        .from('event_participants')
        .select('user_account_id, user_account_created, conversion_timestamp, conversion_source')
        .eq('id', attendeeId)
        .single();

      if (!participantError && participantData) {
        return {
          converted: participantData.user_account_created || false,
          userId: participantData.user_account_id || undefined,
          convertedAt: participantData.conversion_timestamp || undefined,
          conversionSource: participantData.conversion_source as ConversionSource | undefined
        };
      }

      // Try event_audience_members
      const { data: audienceData, error: audienceError } = await supabase
        .from('event_audience_members')
        .select('user_account_id, user_account_created, conversion_timestamp, conversion_source')
        .eq('id', attendeeId)
        .single();

      if (audienceError) throw audienceError;

      return {
        converted: audienceData.user_account_created || false,
        userId: audienceData.user_account_id || undefined,
        convertedAt: audienceData.conversion_timestamp || undefined,
        conversionSource: audienceData.conversion_source as ConversionSource | undefined
      };
    }
  } catch (error) {
    console.error('[Conversion] Error getting conversion status:', error);
    return { converted: false };
  }
}

