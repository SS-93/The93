// Audio Intelligence Service
// Handles audio analysis, mood tagging, and processing job management

import { supabase } from './supabaseClient'

// Types for audio intelligence
export interface AudioFeatures {
  bpm?: number
  key?: string
  mode?: 'major' | 'minor'
  energy?: number
  valence?: number
  danceability?: number
  loudness?: number
  confidence?: number
  source: string
  raw_analysis?: any
}

export interface MoodTags {
  tags: string[]
  confidence: number
  derived_from: {
    audio: boolean
    lyrics: boolean
    engagement: boolean
  }
  rationale?: string[]
}

export interface ProcessingJob {
  id: string
  content_id: string
  job_type: 'audio_features' | 'mood_analysis' | 'lyric_extraction'
  status: 'queued' | 'running' | 'completed' | 'failed'
  attempts: number
  error_message?: string
}

// Provider interface for audio analysis services
export interface AudioAnalysisProvider {
  name: string
  analyze(audioUrl: string): Promise<AudioFeatures>
  isAvailable(): Promise<boolean>
}

// Mock implementation for development (Phase 1)
export class MockAudioProvider implements AudioAnalysisProvider {
  name = 'mock'

  async isAvailable(): Promise<boolean> {
    return true
  }

  async analyze(audioUrl: string): Promise<AudioFeatures> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate mock audio features
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const modes = ['major', 'minor']
    
    return {
      bpm: Math.floor(Math.random() * (180 - 60) + 60), // 60-180 BPM
      key: keys[Math.floor(Math.random() * keys.length)],
      mode: modes[Math.floor(Math.random() * modes.length)] as 'major' | 'minor',
      energy: Math.random(),
      valence: Math.random(),
      danceability: Math.random(),
      loudness: Math.random() * -60, // Negative dB
      confidence: 0.8 + Math.random() * 0.2, // 80-100% confidence
      source: 'mock'
    }
  }
}

// Rule-based mood analyzer (Phase 1)
export class RuleBasedMoodAnalyzer {
  analyzeTrack(features: AudioFeatures): MoodTags {
    const tags: string[] = []
    const rationale: string[] = []

    // Energy-based tags
    if (features.energy && features.bpm) {
      if (features.energy > 0.7 && features.bpm > 120) {
        tags.push('high-energy', 'festival-ready')
        rationale.push(`High energy (${(features.energy * 100).toFixed(0)}%) + fast tempo (${features.bpm} BPM) indicates festival-ready track`)
      } else if (features.energy < 0.3 && features.bpm < 100) {
        tags.push('low-energy', 'chill', 'relaxing')
        rationale.push(`Low energy (${(features.energy * 100).toFixed(0)}%) + slow tempo (${features.bpm} BPM) suggests relaxing track`)
      }
    }

    // Key/mode based mood
    if (features.mode && features.valence) {
      if (features.mode === 'major' && features.valence > 0.6) {
        tags.push('uplifting', 'positive', 'happy')
        rationale.push(`Major key + high valence (${(features.valence * 100).toFixed(0)}%) suggests uplifting mood`)
      } else if (features.mode === 'minor' && features.valence < 0.4) {
        tags.push('melancholic', 'introspective', 'emotional')
        rationale.push(`Minor key + low valence (${(features.valence * 100).toFixed(0)}%) suggests melancholic mood`)
      }
    }

    // Danceability tags
    if (features.danceability) {
      if (features.danceability > 0.7) {
        tags.push('danceable', 'groovy')
        rationale.push(`High danceability (${(features.danceability * 100).toFixed(0)}%) makes this track groovy`)
      } else if (features.danceability < 0.3) {
        tags.push('contemplative', 'atmospheric')
        rationale.push(`Low danceability (${(features.danceability * 100).toFixed(0)}%) suggests contemplative nature`)
      }
    }

    // BPM-specific tags
    if (features.bpm) {
      if (features.bpm > 140) {
        tags.push('intense', 'driving')
      } else if (features.bpm < 80) {
        tags.push('slow', 'ambient')
      } else if (features.bpm >= 110 && features.bpm <= 130) {
        tags.push('mid-tempo', 'steady')
      }
    }

    // Remove duplicates and calculate confidence
    const uniqueTags = Array.from(new Set(tags))
    const confidence = this.calculateConfidence(features, uniqueTags.length)

    return {
      tags: uniqueTags,
      confidence,
      derived_from: {
        audio: true,
        lyrics: false,
        engagement: false
      },
      rationale
    }
  }

  private calculateConfidence(features: AudioFeatures, tagCount: number): number {
    let confidence = 0.5 // Base confidence

    // Higher confidence if we have more features
    if (features.bpm) confidence += 0.15
    if (features.key && features.mode) confidence += 0.15
    if (features.energy !== undefined) confidence += 0.1
    if (features.valence !== undefined) confidence += 0.1
    if (features.danceability !== undefined) confidence += 0.1

    // Adjust based on tag count (sweet spot around 3-5 tags)
    if (tagCount >= 3 && tagCount <= 5) {
      confidence += 0.1
    } else if (tagCount > 6) {
      confidence -= 0.05 // Too many tags might indicate uncertainty
    }

    // Use provider confidence if available
    if (features.confidence) {
      confidence = (confidence + features.confidence) / 2
    }

    return Math.min(1.0, Math.max(0.1, confidence))
  }
}

// Audio Intelligence Service
export class AudioIntelligenceService {
  private audioProvider: AudioAnalysisProvider
  private moodAnalyzer: RuleBasedMoodAnalyzer

  constructor() {
    // For Phase 1, use mock provider
    this.audioProvider = new MockAudioProvider()
    this.moodAnalyzer = new RuleBasedMoodAnalyzer()
  }

  // Process a single audio file
  async processAudioFile(contentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get content item details
      const { data: contentItem, error: fetchError } = await supabase
        .from('content_items')
        .select('file_path, title')
        .eq('id', contentId)
        .single()

      if (fetchError || !contentItem) {
        throw new Error(`Failed to fetch content item: ${fetchError?.message}`)
      }

      // Get signed URL for processing
      const { data: signedUrlData } = await supabase.storage
        .from('artist-content')
        .createSignedUrl(contentItem.file_path, 3600) // 1 hour expiry

      if (!signedUrlData?.signedUrl) {
        throw new Error('Failed to get signed URL for audio file')
      }

      // Analyze audio features
      console.log(`🎵 Analyzing audio features for: ${contentItem.title}`)
      const audioFeatures = await this.audioProvider.analyze(signedUrlData.signedUrl)

      // Store audio features (upsert to handle duplicates)
      const { error: featuresError } = await supabase
        .from('audio_features')
        .upsert({
          content_id: contentId,
          bpm: audioFeatures.bpm,
          key: audioFeatures.key,
          mode: audioFeatures.mode,
          energy: audioFeatures.energy,
          valence: audioFeatures.valence,
          danceability: audioFeatures.danceability,
          loudness: audioFeatures.loudness,
          confidence: audioFeatures.confidence,
          source: audioFeatures.source,
          raw_analysis: audioFeatures.raw_analysis,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'content_id'
        })

      if (featuresError) {
        throw new Error(`Failed to store audio features: ${featuresError.message}`)
      }

      // Analyze mood tags
      console.log(`🎯 Analyzing mood tags for: ${contentItem.title}`)
      const moodTags = this.moodAnalyzer.analyzeTrack(audioFeatures)

      // Store mood tags (upsert to handle duplicates)
      const { error: moodError } = await supabase
        .from('mood_tags')
        .upsert({
          content_id: contentId,
          tags: moodTags.tags,
          confidence: moodTags.confidence,
          derived_from: moodTags.derived_from,
          rationale: moodTags.rationale,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'content_id'
        })

      if (moodError) {
        throw new Error(`Failed to store mood tags: ${moodError.message}`)
      }

      // Update content processing status
      await supabase
        .from('content_items')
        .update({ processing_status: 'completed' })
        .eq('id', contentId)

      console.log(`✅ Audio intelligence processing completed for: ${contentItem.title}`)
      console.log(`   Features: ${audioFeatures.bpm} BPM, ${audioFeatures.key} ${audioFeatures.mode}`)
      console.log(`   Mood: ${moodTags.tags.join(', ')} (${(moodTags.confidence * 100).toFixed(0)}% confidence)`)

      return { success: true }

    } catch (error) {
      console.error('Audio processing error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Get processing queue status
  async getQueueStatus(): Promise<{
    queued: number
    running: number
    completed: number
    failed: number
  }> {
    const { data, error } = await supabase
      .from('audio_processing_jobs')
      .select('status')

    if (error) {
      console.error('Failed to get queue status:', error)
      return { queued: 0, running: 0, completed: 0, failed: 0 }
    }

    const statusCounts = data.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      queued: statusCounts.queued || 0,
      running: statusCounts.running || 0,
      completed: statusCounts.completed || 0,
      failed: statusCounts.failed || 0
    }
  }

  // Process all queued jobs (for development testing)
  async processQueuedJobs(limit: number = 5): Promise<void> {
    console.log(`🔄 Processing up to ${limit} queued audio jobs...`)

    const { data: jobs, error } = await supabase
      .from('audio_processing_jobs')
      .select('id, content_id, job_type')
      .eq('status', 'queued')
      .lt('attempts', 3)
      .limit(limit)

    if (error) {
      console.error('Failed to fetch queued jobs:', error)
      return
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No queued jobs to process')
      return
    }

    for (const job of jobs) {
      if (job.job_type === 'audio_features' || job.job_type === 'mood_analysis') {
        // Mark job as running
        await supabase
          .from('audio_processing_jobs')
          .update({ 
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('id', job.id)

        // Process the audio file
        const result = await this.processAudioFile(job.content_id)

        // Update job status
        const { data: currentJob } = await supabase
          .from('audio_processing_jobs')
          .select('attempts')
          .eq('id', job.id)
          .single()

        await supabase
          .from('audio_processing_jobs')
          .update({
            status: result.success ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            error_message: result.error || null,
            attempts: (currentJob?.attempts || 0) + 1
          })
          .eq('id', job.id)
      }
    }

    console.log(`✅ Processed ${jobs.length} audio jobs`)
  }
}

// Export singleton instance
export const audioIntelligenceService = new AudioIntelligenceService()
