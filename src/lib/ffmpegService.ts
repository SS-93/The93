// FFmpeg Service for Audio Processing
// Handles waveform generation, audio analysis, and format conversion

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export interface WaveformData {
  peaks: number[]
  duration: number
  sampleRate: number
}

export interface AudioAnalysis {
  duration: number
  channels: number
  sampleRate: number
  bitrate?: number
  format: string
  peaks: number[]
  rms: number
  lufs?: number
}

class FFmpegAudioService {
  private ffmpeg: FFmpeg | null = null
  private isLoaded = false

  async initialize(): Promise<void> {
    if (this.isLoaded) return

    try {
      console.log('🎬 Initializing FFmpeg...')
      this.ffmpeg = new FFmpeg()

      // Load FFmpeg with cross-origin isolated environment
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      this.isLoaded = true
      console.log('✅ FFmpeg loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load FFmpeg:', error)
      throw new Error('Failed to initialize FFmpeg')
    }
  }

  async generateWaveform(audioFile: File, options = { 
    width: 800, 
    height: 100, 
    samples: 200,
    color: '#f59e0b' 
  }): Promise<WaveformData> {
    if (!this.ffmpeg || !this.isLoaded) {
      await this.initialize()
    }

    try {
      console.log('🌊 Generating waveform for:', audioFile.name)
      
      // Write input file
      await this.ffmpeg!.writeFile('input.audio', await fetchFile(audioFile))

      // Generate audio analysis data
      await this.ffmpeg!.exec([
        '-i', 'input.audio',
        '-ac', '1', // Convert to mono
        '-ar', '44100', // Set sample rate
        '-f', 'wav',
        'mono.wav'
      ])

      // Extract raw audio data for waveform
      await this.ffmpeg!.exec([
        '-i', 'mono.wav',
        '-f', 's16le', // 16-bit signed little-endian
        '-ac', '1',
        '-ar', '4410', // Downsample for waveform
        'raw.pcm'
      ])

      // Get the raw PCM data
      const rawData = await this.ffmpeg!.readFile('raw.pcm')
      // Handle different return types from FFmpeg readFile
      const buffer = rawData instanceof Uint8Array ? rawData.buffer : rawData
      const pcmArray = new Int16Array(buffer as ArrayBuffer)

      // Generate peaks for waveform visualization
      const peaks = this.extractPeaks(pcmArray, options.samples)

      // Get duration
      const duration = await this.getAudioDuration(audioFile)

      // Cleanup
      await this.ffmpeg!.deleteFile('input.audio')
      await this.ffmpeg!.deleteFile('mono.wav')
      await this.ffmpeg!.deleteFile('raw.pcm')

      console.log('✅ Waveform generated:', { peaks: peaks.length, duration })

      return {
        peaks,
        duration,
        sampleRate: 4410
      }
    } catch (error) {
      console.error('❌ Waveform generation failed:', error)
      throw error
    }
  }

  async analyzeAudio(audioFile: File): Promise<AudioAnalysis> {
    if (!this.ffmpeg || !this.isLoaded) {
      await this.initialize()
    }

    try {
      console.log('🔍 Analyzing audio:', audioFile.name)

      // Write input file
      await this.ffmpeg!.writeFile('input.audio', await fetchFile(audioFile))

      // Get audio info using ffprobe-like functionality
      await this.ffmpeg!.exec([
        '-i', 'input.audio',
        '-f', 'null',
        '-'
      ])

      // Convert to standard format for analysis
      await this.ffmpeg!.exec([
        '-i', 'input.audio',
        '-ac', '2', // Stereo
        '-ar', '44100',
        '-f', 'wav',
        'analysis.wav'
      ])

      // Extract mono for peak analysis
      await this.ffmpeg!.exec([
        '-i', 'analysis.wav',
        '-ac', '1',
        '-f', 's16le',
        'mono.pcm'
      ])

      // Get the raw data for analysis
      const rawData = await this.ffmpeg!.readFile('mono.pcm')
      // Handle different return types from FFmpeg readFile
      const buffer = rawData instanceof Uint8Array ? rawData.buffer : rawData
      const pcmArray = new Int16Array(buffer as ArrayBuffer)

      // Analyze the audio
      const peaks = this.extractPeaks(pcmArray, 1000)
      const rms = this.calculateRMS(pcmArray)
      const duration = await this.getAudioDuration(audioFile)

      // Cleanup
      await this.ffmpeg!.deleteFile('input.audio')
      await this.ffmpeg!.deleteFile('analysis.wav')
      await this.ffmpeg!.deleteFile('mono.pcm')

      return {
        duration,
        channels: 2, // We standardize to stereo
        sampleRate: 44100,
        format: audioFile.type || 'audio/unknown',
        peaks,
        rms
      }
    } catch (error) {
      console.error('❌ Audio analysis failed:', error)
      throw error
    }
  }

  async convertAudio(
    audioFile: File, 
    outputFormat: string = 'mp3',
    options: { bitrate?: string; quality?: string } = {}
  ): Promise<Blob> {
    if (!this.ffmpeg || !this.isLoaded) {
      await this.initialize()
    }

    try {
      console.log(`🔄 Converting ${audioFile.name} to ${outputFormat}`)

      // Write input file
      await this.ffmpeg!.writeFile('input.audio', await fetchFile(audioFile))

      const outputFile = `output.${outputFormat}`
      const ffmpegArgs = ['-i', 'input.audio']

      // Add quality options
      if (options.bitrate) {
        ffmpegArgs.push('-b:a', options.bitrate)
      }
      if (options.quality) {
        ffmpegArgs.push('-q:a', options.quality)
      }

      // Set output format
      ffmpegArgs.push('-f', outputFormat, outputFile)

      await this.ffmpeg!.exec(ffmpegArgs)

      // Read the converted file
      const convertedData = await this.ffmpeg!.readFile(outputFile)
      const blob = new Blob([convertedData], { type: `audio/${outputFormat}` })

      // Cleanup
      await this.ffmpeg!.deleteFile('input.audio')
      await this.ffmpeg!.deleteFile(outputFile)

      console.log('✅ Audio conversion completed')
      return blob
    } catch (error) {
      console.error('❌ Audio conversion failed:', error)
      throw error
    }
  }

  async extractAudioFromVideo(videoFile: File): Promise<Blob> {
    if (!this.ffmpeg || !this.isLoaded) {
      await this.initialize()
    }

    try {
      console.log('🎬 Extracting audio from video:', videoFile.name)

      await this.ffmpeg!.writeFile('input.video', await fetchFile(videoFile))

      await this.ffmpeg!.exec([
        '-i', 'input.video',
        '-vn', // No video
        '-acodec', 'mp3',
        '-ab', '192k',
        'output.mp3'
      ])

      const audioData = await this.ffmpeg!.readFile('output.mp3')
      const blob = new Blob([audioData], { type: 'audio/mp3' })

      // Cleanup
      await this.ffmpeg!.deleteFile('input.video')
      await this.ffmpeg!.deleteFile('output.mp3')

      console.log('✅ Audio extraction completed')
      return blob
    } catch (error) {
      console.error('❌ Audio extraction failed:', error)
      throw error
    }
  }

  async normalizeAudio(audioFile: File): Promise<Blob> {
    if (!this.ffmpeg || !this.isLoaded) {
      await this.initialize()
    }

    try {
      console.log('🔊 Normalizing audio:', audioFile.name)

      await this.ffmpeg!.writeFile('input.audio', await fetchFile(audioFile))

      // Apply audio normalization
      await this.ffmpeg!.exec([
        '-i', 'input.audio',
        '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5',
        '-c:a', 'mp3',
        '-b:a', '192k',
        'normalized.mp3'
      ])

      const normalizedData = await this.ffmpeg!.readFile('normalized.mp3')
      const blob = new Blob([normalizedData], { type: 'audio/mp3' })

      // Cleanup
      await this.ffmpeg!.deleteFile('input.audio')
      await this.ffmpeg!.deleteFile('normalized.mp3')

      console.log('✅ Audio normalization completed')
      return blob
    } catch (error) {
      console.error('❌ Audio normalization failed:', error)
      throw error
    }
  }

  // Helper methods
  private extractPeaks(pcmData: Int16Array, numSamples: number): number[] {
    const peaks: number[] = []
    const blockSize = Math.floor(pcmData.length / numSamples)

    for (let i = 0; i < numSamples; i++) {
      const start = i * blockSize
      const end = Math.min(start + blockSize, pcmData.length)
      
      let max = 0
      for (let j = start; j < end; j++) {
        const amplitude = Math.abs(pcmData[j]) / 32768 // Normalize to 0-1
        max = Math.max(max, amplitude)
      }
      
      peaks.push(max)
    }

    return peaks
  }

  private calculateRMS(pcmData: Int16Array): number {
    let sum = 0
    for (let i = 0; i < pcmData.length; i++) {
      const normalized = pcmData[i] / 32768
      sum += normalized * normalized
    }
    return Math.sqrt(sum / pcmData.length)
  }

  private async getAudioDuration(audioFile: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio(URL.createObjectURL(audioFile))
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration)
        URL.revokeObjectURL(audio.src)
      })
    })
  }

  // Check if FFmpeg is supported
  static isSupported(): boolean {
    return typeof SharedArrayBuffer !== 'undefined' && 
           typeof crossOriginIsolated !== 'undefined' &&
           crossOriginIsolated === true
  }
}

// Export singleton instance
export const ffmpegAudioService = new FFmpegAudioService()
export default FFmpegAudioService
