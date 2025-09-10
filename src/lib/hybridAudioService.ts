// Hybrid Audio Processing Service
// Industry-standard architecture combining client-side and server-side processing

import { supabase } from './supabaseClient'
import { ffmpegAudioService } from './ffmpegService'

export interface AudioProcessingOptions {
  preferClient?: boolean // Force client-side processing
  preferServer?: boolean // Force server-side processing
  quality?: 'draft' | 'standard' | 'high'
  realTime?: boolean // For real-time features
}

export interface ProcessingResult {
  waveform?: {
    peaks: number[]
    duration: number
    sampleRate: number
  }
  analysis?: {
    duration: number
    channels: number
    sampleRate: number
    bitrate?: number
    format: string
    rms: number
  }
  features?: {
    bpm?: number
    key?: string
    mode?: 'major' | 'minor'
    energy?: number
    valence?: number
    confidence?: number
  }
  source: 'client' | 'server' | 'hybrid'
  processingTime: number
}

class HybridAudioService {
  private static instance: HybridAudioService
  private clientAvailable = false
  private serverAvailable = true // Assuming Supabase is always available

  constructor() {
    this.checkClientCapabilities()
  }

  static getInstance(): HybridAudioService {
    if (!HybridAudioService.instance) {
      HybridAudioService.instance = new HybridAudioService()
    }
    return HybridAudioService.instance
  }

  private async checkClientCapabilities(): Promise<void> {
    try {
      // Check if client-side FFmpeg is available
      this.clientAvailable = typeof SharedArrayBuffer !== 'undefined' && 
                           typeof crossOriginIsolated !== 'undefined' &&
                           crossOriginIsolated === true
      
      console.log('🔍 Client FFmpeg available:', this.clientAvailable)
    } catch (error) {
      console.warn('⚠️ Client FFmpeg check failed:', error)
      this.clientAvailable = false
    }
  }

  async processAudio(
    audioFile: File, 
    contentId: string,
    options: AudioProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now()
    
    console.log('🎬 Starting hybrid audio processing for:', audioFile.name)
    console.log('📊 Processing options:', options)

    // Determine processing strategy
    const strategy = this.determineProcessingStrategy(audioFile, options)
    console.log('🎯 Processing strategy:', strategy)

    let result: ProcessingResult

    switch (strategy) {
      case 'client-only':
        result = await this.processClientSide(audioFile, options)
        break
      case 'server-only':
        result = await this.processServerSide(audioFile, contentId, options)
        break
      case 'hybrid':
        result = await this.processHybrid(audioFile, contentId, options)
        break
      case 'fallback':
        result = await this.processFallback(audioFile, contentId)
        break
      default:
        throw new Error(`Unknown processing strategy: ${strategy}`)
    }

    const processingTime = Date.now() - startTime
    result.processingTime = processingTime

    console.log('✅ Audio processing completed:', result)
    return result
  }

  private determineProcessingStrategy(
    audioFile: File, 
    options: AudioProcessingOptions
  ): 'client-only' | 'server-only' | 'hybrid' | 'fallback' {
    // Force client if requested and available
    if (options.preferClient && this.clientAvailable) {
      return 'client-only'
    }

    // Force server if requested
    if (options.preferServer) {
      return 'server-only'
    }

    // Real-time processing prefers client
    if (options.realTime && this.clientAvailable) {
      return 'client-only'
    }

    // Large files (> 50MB) go to server
    if (audioFile.size > 50 * 1024 * 1024) {
      return 'server-only'
    }

    // High quality processing goes to server
    if (options.quality === 'high') {
      return 'server-only'
    }

    // If client is available, use hybrid for best of both worlds
    if (this.clientAvailable && this.serverAvailable) {
      return 'hybrid'
    }

    // Server only if client not available
    if (this.serverAvailable) {
      return 'server-only'
    }

    // Last resort fallback
    return 'fallback'
  }

  private async processClientSide(
    audioFile: File, 
    options: AudioProcessingOptions
  ): Promise<ProcessingResult> {
    console.log('🖥️ Processing client-side...')

    try {
      const [waveform, analysis] = await Promise.all([
        ffmpegAudioService.generateWaveform(audioFile, {
          width: 800,
          height: 100,
          samples: options.quality === 'high' ? 500 : 200,
          color: '#f59e0b'
        }),
        ffmpegAudioService.analyzeAudio(audioFile)
      ])

      return {
        waveform,
        analysis,
        source: 'client',
        processingTime: 0 // Will be set by caller
      }
    } catch (error) {
      console.error('❌ Client-side processing failed:', error)
      // Fallback to server
      return this.processServerSide(audioFile, '', options)
    }
  }

  private async processServerSide(
    audioFile: File, 
    contentId: string,
    options: AudioProcessingOptions
  ): Promise<ProcessingResult> {
    console.log('☁️ Processing server-side...')

    try {
      // Call Supabase Edge Function for processing
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: {
          fileUrl: contentId, // Content ID for file reference
          options: {
            generateWaveform: true,
            analyzeAudio: true,
            extractFeatures: true,
            quality: options.quality || 'standard'
          }
        }
      })

      if (error) {
        throw new Error(`Server processing failed: ${error.message}`)
      }

      return {
        waveform: data.waveform,
        analysis: data.analysis,
        features: data.features,
        source: 'server',
        processingTime: 0 // Will be set by caller
      }
    } catch (error) {
      console.error('❌ Server-side processing failed:', error)
      // Fallback to basic processing
      return this.processFallback(audioFile, contentId)
    }
  }

  private async processHybrid(
    audioFile: File, 
    contentId: string,
    options: AudioProcessingOptions
  ): Promise<ProcessingResult> {
    console.log('🔄 Processing hybrid (client + server)...')

    try {
      // Start both client and server processing in parallel
      const [clientResult, serverPromise] = await Promise.allSettled([
        // Client: Fast waveform for immediate UI feedback
        this.generateClientWaveform(audioFile),
        // Server: Comprehensive analysis
        this.processServerSide(audioFile, contentId, { ...options, quality: 'high' })
      ])

      // Use client waveform immediately, server analysis when ready
      const waveform = clientResult.status === 'fulfilled' ? clientResult.value : undefined
      
      let serverResult: ProcessingResult | undefined
      if (serverPromise.status === 'fulfilled') {
        serverResult = serverPromise.value
      }

      return {
        waveform: waveform || serverResult?.waveform,
        analysis: serverResult?.analysis,
        features: serverResult?.features,
        source: 'hybrid',
        processingTime: 0 // Will be set by caller
      }
    } catch (error) {
      console.error('❌ Hybrid processing failed:', error)
      return this.processFallback(audioFile, contentId)
    }
  }

  private async generateClientWaveform(audioFile: File) {
    try {
      return await ffmpegAudioService.generateWaveform(audioFile, {
        width: 400,
        height: 60,
        samples: 100, // Fast, low-res for immediate feedback
        color: '#f59e0b'
      })
    } catch (error) {
      console.warn('⚠️ Client waveform generation failed:', error)
      return undefined
    }
  }

  private async processFallback(
    audioFile: File, 
    contentId: string
  ): Promise<ProcessingResult> {
    console.log('🛡️ Using fallback processing...')

    // Basic Web Audio API analysis
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    try {
      const arrayBuffer = await audioFile.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Generate basic waveform from audio buffer
      const channelData = audioBuffer.getChannelData(0)
      const samples = 200
      const blockSize = Math.floor(channelData.length / samples)
      const peaks: number[] = []

      for (let i = 0; i < samples; i++) {
        const start = i * blockSize
        const end = Math.min(start + blockSize, channelData.length)
        
        let max = 0
        for (let j = start; j < end; j++) {
          max = Math.max(max, Math.abs(channelData[j]))
        }
        peaks.push(max)
      }

      return {
        waveform: {
          peaks,
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate
        },
        analysis: {
          duration: audioBuffer.duration,
          channels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate,
          format: audioFile.type || 'unknown',
          rms: 0.5 // Estimated
        },
        source: 'client',
        processingTime: 0
      }
    } catch (error) {
      console.error('❌ Fallback processing failed:', error)
      
      // Absolute fallback - basic file info only
      return {
        analysis: {
          duration: 0,
          channels: 2,
          sampleRate: 44100,
          format: audioFile.type || 'unknown',
          rms: 0.5
        },
        source: 'client',
        processingTime: 0
      }
    } finally {
      audioContext.close()
    }
  }

  // Quick check methods
  async canProcessClientSide(): Promise<boolean> {
    return this.clientAvailable
  }

  async canProcessServerSide(): Promise<boolean> {
    try {
      // Test Supabase Edge Functions availability
      const { error } = await supabase.functions.invoke('health-check')
      return !error
    } catch {
      return false
    }
  }

  // Get processing capabilities
  getCapabilities() {
    return {
      client: {
        available: this.clientAvailable,
        features: ['waveform', 'basic-analysis', 'real-time'],
        limitations: ['browser-dependent', 'memory-limited']
      },
      server: {
        available: this.serverAvailable,
        features: ['comprehensive-analysis', 'ai-features', 'batch-processing'],
        limitations: ['network-dependent', 'processing-time']
      },
      recommended: this.clientAvailable && this.serverAvailable ? 'hybrid' : 
                   this.serverAvailable ? 'server' : 'fallback'
    }
  }
}

// Export singleton instance
export const hybridAudioService = HybridAudioService.getInstance()
export default HybridAudioService
