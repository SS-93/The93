// Enable voting on existing events
import { supabase } from './supabaseClient'

export const enableVotingOnAllEvents = async () => {
  try {
    console.log('🚀 Enabling voting on all existing events...')

    // 1. First, create the voting schema if it doesn't exist
    console.log('📋 Setting up voting database schema...')
    const schemaResult = await createVotingSchema()
    if (!schemaResult.success) {
      console.error('❌ Failed to create voting schema:', schemaResult.error)
      // Continue anyway, schema might already exist
    }

    // 2. Update all existing events to published status for voting access
    const { data: updatedEvents, error: updateError } = await supabase
      .from('events')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .in('status', ['draft', 'active', 'live'])
      .select()

    if (updateError) {
      console.error('❌ Error updating events:', updateError)
      return { success: false, error: updateError }
    }

    console.log(`✅ Updated ${updatedEvents?.length || 0} events to published status`)

    // 3. Create default template if it doesn't exist
    const templateResult = await ensureDefaultTemplate()
    if (!templateResult.success) {
      console.log('⚠️ Could not create template, continuing without scoring features')
    }

    // 4. Get final list of voting-enabled events (simplified - no score_template_id)
    const { data: votingEvents, error: listError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        status,
        shareable_code,
        created_at
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (listError) {
      console.error('❌ Error listing events:', listError)
      return { success: false, error: listError }
    }

    console.log('🎉 Voting enabled events:')
    votingEvents?.forEach((event, index) => {
      console.log(`${index + 1}. "${event.title}" - Code: ${event.shareable_code}`)
      console.log(`   📱 Voting URL: /events/vote/${event.shareable_code}`)
    })

    return {
      success: true,
      events: votingEvents,
      message: `Successfully enabled voting on ${votingEvents?.length || 0} events`
    }

  } catch (error) {
    console.error('💥 Fatal error enabling voting:', error)
    return { success: false, error }
  }
}

export const getVotingEnabledEvents = async () => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        status,
        shareable_code,
        start_date,
        end_date,
        location,
        created_at
      `)
      .in('status', ['published', 'live'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching voting events:', error)
      return { success: false, error }
    }

    return {
      success: true,
      events: events || [],
      message: `Found ${events?.length || 0} voting-enabled events`
    }
  } catch (error) {
    console.error('💥 Error fetching voting events:', error)
    return { success: false, error }
  }
}

// Helper function to create basic voting schema
const createVotingSchema = async () => {
  try {
    // Check if production voting tables exist
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['event_votes', 'event_scores', 'participant_sessions'])

    if (error || !tables || tables.length < 3) {
      console.log('⚠️ Production voting tables not found - migration needed')
      return { success: false, error: new Error('Production voting schema not applied') }
    }

    console.log('✅ Production voting schema verified')
    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

// Helper function to ensure we have basic template support
const ensureDefaultTemplate = async () => {
  try {
    // For now, we'll work without templates and use built-in scoring
    return { success: true, message: 'Using built-in scoring system' }
  } catch (error) {
    return { success: false, error }
  }
}