// Test script for global content access
// This will help us verify the backend service is working

import GlobalContentService from '../lib/globalContentService'

export async function testGlobalContentAccess() {
  console.log('🔍 Testing Global Content Service...')
  
  try {
    // Test getting streaming tracks
    console.log('📡 Fetching streaming tracks...')
    const { tracks, error } = await GlobalContentService.getStreamingTracks(10)
    
    if (error) {
      console.error('❌ Error fetching tracks:', error)
      return { success: false, error }
    }
    
    console.log(`✅ Successfully loaded ${tracks.length} tracks`)
    
    // Log first track details for verification
    if (tracks.length > 0) {
      const firstTrack = tracks[0]
      console.log('🎵 First track details:', {
        id: firstTrack.id,
        title: firstTrack.title,
        artist: firstTrack.artist,
        audioUrl: firstTrack.audioUrl ? 'URL Generated ✅' : 'No URL ❌',
        duration: firstTrack.duration,
        hasFeatures: !!firstTrack.audioFeatures,
        hasMoodTags: !!firstTrack.moodTags
      })
    }
    
    // Test streaming URL creation for first track
    if (tracks.length > 0) {
      console.log('🌐 Testing streaming URL accessibility...')
      try {
        const response = await fetch(tracks[0].audioUrl, { method: 'HEAD' })
        console.log(`🔗 Streaming URL test: ${response.ok ? '✅ Accessible' : '❌ Not accessible'}`)
        console.log(`📊 Response status: ${response.status} ${response.statusText}`)
      } catch (fetchError) {
        console.error('❌ Streaming URL test failed:', fetchError)
      }
    }
    
    return { success: true, tracks }
    
  } catch (error) {
    console.error('💥 Global content test failed:', error)
    return { success: false, error }
  }
}

// Test specific user's tracks (dmstest49@gmail)
export async function testUserTracks() {
  console.log('👤 Testing specific user tracks (dmstest49@gmail)...')
  
  try {
    const { data: tracks, error } = await GlobalContentService.getTracksByUserEmail('dmstest49@gmail')
    
    if (error) {
      console.error('❌ Error fetching user tracks:', error)
      return { success: false, error }
    }
    
    console.log(`✅ Found ${tracks?.length || 0} tracks for dmstest49@gmail`)
    
    if (tracks && tracks.length > 0) {
      tracks.forEach((track, index) => {
        console.log(`🎵 Track ${index + 1}:`, {
          title: track.title,
          artist: (track as any).artists?.artist_name || (track as any).artist_profiles?.artist_name || 'Unknown',
          file_path: track.file_path
        })
      })
    }
    
    return { success: true, tracks }
    
  } catch (error) {
    console.error('💥 User tracks test failed:', error)
    return { success: false, error }
  }
}