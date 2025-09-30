// Test script for event creation and artist addition
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://iutnwgvzwyupsuguxnls.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dG53Z3Z6d3l1cHN1Z3V4bmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MzQ4MTgsImV4cCI6MjA2NTExMDgxOH0.aC_YpMkzDJrhgf2KkGf2iFB6kZeCUCEk9dm-disMT7U'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testEventAndArtist() {
  console.log('🎉 Starting Concierto Event & Artist Test...')

  try {
    // First, let's create a test artist profile
    const { data: testArtist, error: artistError } = await supabase
      .from('artist_profiles')
      .insert({
        artist_name: 'Test Artist ' + Date.now(),
        bio: 'A test artist for event demonstration',
        banner_url: null,
        social_links: { instagram: '@testartist' }
      })
      .select()
      .single()

    if (artistError) {
      console.error('❌ Error creating test artist:', artistError)
      return
    }

    console.log('✅ Created test artist:', testArtist)

    // Now create a test event (this will fail due to RLS, but we can see the structure)
    const eventData = {
      title: 'Test Event ' + Date.now(),
      description: 'Testing the complete workflow',
      start_date: new Date(Date.now() + 24*60*60*1000).toISOString(), // Tomorrow
      end_date: new Date(Date.now() + 27*60*60*1000).toISOString(), // Tomorrow +3h
      shareable_code: 'TEST' + Date.now().toString().slice(-4),
      host_user_id: '00000000-0000-0000-0000-000000000000', // This will cause RLS failure
      status: 'draft'
    }

    console.log('📋 Attempting to create event with data:', eventData)

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single()

    if (eventError) {
      console.log('⚠️  Expected event creation error (RLS):', eventError.message)
      console.log('💡 This is expected since we need proper authentication for event creation')
    } else {
      console.log('✅ Event created:', event)

      // Add the artist to the event
      const { data: eventArtist, error: linkError } = await supabase
        .from('event_artists')
        .insert({
          event_id: event.id,
          artist_profile_id: testArtist.id,
          registration_status: 'confirmed'
        })
        .select()
        .single()

      if (linkError) {
        console.error('❌ Error linking artist to event:', linkError)
      } else {
        console.log('✅ Artist added to event:', eventArtist)
      }
    }

    // Test reading existing data
    console.log('\n📊 Testing data retrieval...')

    const { data: events, error: readError } = await supabase
      .from('events')
      .select('*')
      .limit(3)

    if (readError) {
      console.error('❌ Error reading events:', readError)
    } else {
      console.log('✅ Found', events.length, 'events')
      events.forEach(evt => console.log('  -', evt.title, `(${evt.status})`))
    }

    const { data: artists, error: artistReadError } = await supabase
      .from('artist_profiles')
      .select('id, artist_name')
      .limit(5)

    if (artistReadError) {
      console.error('❌ Error reading artists:', artistReadError)
    } else {
      console.log('✅ Found', artists.length, 'artists:')
      artists.forEach(artist => console.log('  -', artist.artist_name))
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }

  console.log('\n🎯 Test completed!')
}

testEventAndArtist()