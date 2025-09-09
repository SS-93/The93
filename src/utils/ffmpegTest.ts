// FFmpeg Browser Support Test
// Use this to verify FFmpeg capabilities in different environments

export function checkFFmpegSupport() {
  const support = {
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated === true,
    webAssembly: typeof WebAssembly !== 'undefined',
    workers: typeof Worker !== 'undefined'
  }

  console.log('🔍 FFmpeg Support Check:', support)
  
  const isFullySupported = Object.values(support).every(Boolean)
  
  if (!support.sharedArrayBuffer) {
    console.warn('⚠️ SharedArrayBuffer not available - FFmpeg will not work')
  }
  
  if (!support.crossOriginIsolated) {
    console.warn('⚠️ Cross-Origin Isolation not enabled - FFmpeg requires COOP/COEP headers')
    console.log('💡 To enable: run "npm run start:ffmpeg" or add headers to your server')
  }

  if (!support.webAssembly) {
    console.warn('⚠️ WebAssembly not supported - FFmpeg requires WASM')
  }

  console.log(isFullySupported ? '✅ FFmpeg fully supported!' : '❌ FFmpeg not supported in this environment')
  
  return {
    supported: isFullySupported,
    details: support,
    recommendations: [
      !support.crossOriginIsolated && 'Enable Cross-Origin Isolation with COOP/COEP headers',
      !support.sharedArrayBuffer && 'Use a modern browser that supports SharedArrayBuffer',
      !support.webAssembly && 'Use a browser with WebAssembly support'
    ].filter(Boolean)
  }
}

export function displaySupportInfo() {
  const result = checkFFmpegSupport()
  
  if (result.supported) {
    alert('✅ FFmpeg fully supported! You can use all audio processing features.')
  } else {
    const recommendations = result.recommendations.join('\n• ')
    alert(`❌ FFmpeg not fully supported.\n\nMissing requirements:\n• ${recommendations}\n\nFor development, run: npm run start:ffmpeg`)
  }
  
  return result
}

// Test function for development
export async function testFFmpegBasics() {
  try {
    const { ffmpegAudioService } = await import('../lib/ffmpegService')
    
    console.log('🧪 Testing FFmpeg initialization...')
    await ffmpegAudioService.initialize()
    console.log('✅ FFmpeg initialized successfully!')
    
    return true
  } catch (error) {
    console.error('❌ FFmpeg test failed:', error)
    return false
  }
}
