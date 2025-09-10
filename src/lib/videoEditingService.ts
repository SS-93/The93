// Video Editing Service - Core architecture for Buckets video editing
import { supabase } from './supabaseClient'

export interface VideoClip {
  id: string
  file: File
  duration: number
  startTime: number
  endTime: number
  filters?: VideoFilter[]
  transitions?: VideoTransition[]
}

export interface VideoFilter {
  type: 'color' | 'blur' | 'vintage' | 'cinematic' | 'glow'
  intensity: number
  parameters?: Record<string, any>
}

export interface VideoTransition {
  type: 'fade' | 'slide' | 'zoom' | 'wipe'
  duration: number
}

export interface VideoProject {
  id: string
  title: string
  clips: VideoClip[]
  audio?: {
    file: File
    volume: number
    fadeIn?: boolean
    fadeOut?: boolean
  }
  text?: TextOverlay[]
  effects?: VideoEffect[]
  outputSettings: {
    resolution: '1080p' | '4K' | 'vertical_1080' | 'square_1080'
    format: 'mp4' | 'mov' | 'webm'
    quality: 'high' | 'medium' | 'compressed'
  }
}

export interface TextOverlay {
  text: string
  font: string
  size: number
  color: string
  position: { x: number; y: number }
  animation: 'none' | 'fadeIn' | 'slideUp' | 'typewriter'
  startTime: number
  duration: number
}

export interface VideoEffect {
  type: 'particles' | 'lens_flare' | 'light_leaks' | 'bokeh'
  intensity: number
  timing: { start: number; duration: number }
}

class VideoEditingService {
  private ffmpegLoaded = false

  // Initialize video editing capabilities
  async initialize(): Promise<boolean> {
    try {
      // Check if FFmpeg is already loaded from audio service
      const { hybridAudioService } = await import('./hybridAudioService')
      this.ffmpegLoaded = await hybridAudioService.canProcessClientSide()
      
      if (!this.ffmpegLoaded) {
        console.log('🎬 Loading FFmpeg for video editing...')
        // Load FFmpeg.wasm for video processing
        const { FFmpeg } = await import('@ffmpeg/ffmpeg')
        const ffmpeg = new FFmpeg()
        await ffmpeg.load()
        this.ffmpegLoaded = true
      }
      
      console.log('🎬 Video editing service initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize video editing service:', error)
      return false
    }
  }

  // Create new video project
  createProject(title: string): VideoProject {
    return {
      id: `project_${Date.now()}`,
      title,
      clips: [],
      text: [],
      effects: [],
      outputSettings: {
        resolution: '1080p',
        format: 'mp4',
        quality: 'high'
      }
    }
  }

  // Add clip to project
  addClip(project: VideoProject, file: File): Promise<VideoClip> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        const clip: VideoClip = {
          id: `clip_${Date.now()}`,
          file,
          duration: video.duration,
          startTime: 0,
          endTime: video.duration,
          filters: [],
          transitions: []
        }
        project.clips.push(clip)
        resolve(clip)
      }
      video.src = URL.createObjectURL(file)
    })
  }

  // Apply filter to clip
  async applyFilter(clip: VideoClip, filter: VideoFilter): Promise<Blob> {
    if (!this.ffmpegLoaded) {
      throw new Error('Video editing not initialized')
    }

    // FFmpeg filter mapping
    const filterMap: Record<string, string> = {
      vintage: 'curves=vintage',
      cinematic: 'colorbalance=rs=0.2:gs=0.1:bs=-0.1',
      glow: 'gblur=sigma=3:steps=1,blend=all_mode=screen',
      blur: `gblur=sigma=${filter.intensity * 10}`,
      color: `hue=s=${filter.intensity}:b=${filter.intensity * 0.5}`
    }

    const filterString = filterMap[filter.type] || 'null'
    
    try {
      // Apply filter using FFmpeg
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      
      const inputName = 'input.mp4'
      const outputName = 'output.mp4'
      
      await ffmpeg.load()
      await ffmpeg.writeFile(inputName, await fetchFile(clip.file))
      await ffmpeg.exec(['-i', inputName, '-vf', filterString, outputName])
      
      const data = await ffmpeg.readFile(outputName)
      const buffer = data instanceof Uint8Array ? data.buffer : data
      return new Blob([buffer], { type: 'video/mp4' })
    } catch (error) {
      console.error('Filter application failed:', error)
      throw error
    }
  }

  // Add text overlay
  addTextOverlay(project: VideoProject, textOverlay: TextOverlay): void {
    project.text = project.text || []
    project.text.push(textOverlay)
  }

  // Generate social media formats
  async exportForSocialMedia(project: VideoProject, platform: 'tiktok' | 'instagram_story' | 'instagram_post' | 'youtube_shorts'): Promise<Blob> {
    const platformSettings = {
      tiktok: { resolution: 'vertical_1080' as const, aspect: '9:16', duration: 60 },
      instagram_story: { resolution: 'vertical_1080' as const, aspect: '9:16', duration: 15 },
      instagram_post: { resolution: 'square_1080' as const, aspect: '1:1', duration: 90 },
      youtube_shorts: { resolution: 'vertical_1080' as const, aspect: '9:16', duration: 60 }
    }

    const settings = platformSettings[platform]
    project.outputSettings.resolution = settings.resolution

    return this.renderProject(project)
  }

  // Render final video
  async renderProject(project: VideoProject): Promise<Blob> {
    if (!this.ffmpegLoaded) {
      throw new Error('Video editing not initialized')
    }

    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      
      await ffmpeg.load()

      // Build FFmpeg command for multi-clip rendering
      const commands: string[] = ['-y'] // Overwrite output

      // Input files
      for (let i = 0; i < project.clips.length; i++) {
        const inputName = `input${i}.mp4`
        await ffmpeg.writeFile(inputName, await fetchFile(project.clips[i].file))
        commands.push('-i', inputName)
      }

      // Audio input if present
      if (project.audio) {
        const audioName = 'audio.mp3'
        await ffmpeg.writeFile(audioName, await fetchFile(project.audio.file))
        commands.push('-i', audioName)
      }

      // Video filter complex for transitions and effects
      let filterComplex = ''
      if (project.clips.length > 1) {
        // Create transitions between clips
        for (let i = 0; i < project.clips.length - 1; i++) {
          const transition = project.clips[i].transitions?.[0]
          if (transition) {
            filterComplex += `[${i}:v][${i+1}:v]xfade=transition=${transition.type}:duration=${transition.duration}:offset=${project.clips[i].duration - transition.duration}[v${i}];`
          }
        }
      }

      // Add text overlays
      if (project.text && project.text.length > 0) {
        project.text.forEach((text, index) => {
          filterComplex += `[v${index}]drawtext=text='${text.text}':fontfile=${text.font}:fontsize=${text.size}:fontcolor=${text.color}:x=${text.position.x}:y=${text.position.y}:enable='between(t,${text.startTime},${text.startTime + text.duration})'[v${index + 1}];`
        })
      }

      if (filterComplex) {
        commands.push('-filter_complex', filterComplex)
      }

      // Output settings
      commands.push(
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', project.outputSettings.quality === 'high' ? '18' : '23',
        'output.mp4'
      )

      await ffmpeg.exec(commands)
      
      const data = await ffmpeg.readFile('output.mp4')
      const buffer = data instanceof Uint8Array ? data.buffer : data
      return new Blob([buffer], { type: 'video/mp4' })
    } catch (error) {
      console.error('Video rendering failed:', error)
      throw error
    }
  }

  // Save project to Supabase
  async saveProject(project: VideoProject, userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('video_projects')
      .insert([{
        id: project.id,
        user_id: userId,
        title: project.title,
        project_data: JSON.stringify(project),
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  // Load project from Supabase
  async loadProject(projectId: string): Promise<VideoProject> {
    const { data, error } = await supabase
      .from('video_projects')
      .select('project_data')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return JSON.parse(data.project_data)
  }
}

export const videoEditingService = new VideoEditingService()