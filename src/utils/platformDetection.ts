/**
 * ============================================================================
 * PLATFORM DETECTION UTILITY
 * ============================================================================
 * Purpose: Detect platform (web/ios/android) for cross-platform audio tracking
 * Usage: Used by AudioPlayerContext to set correct source in Passport events
 * ============================================================================
 */

export type PlatformSource = 'web' | 'ios' | 'android' | 'unknown'

export interface PlatformMetadata {
  source: PlatformSource
  userAgent: string
  screenWidth: number
  screenHeight: number
  language: string
  platform: string
  vendor: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  os?: string
  osVersion?: string
  browser?: string
  browserVersion?: string
}

/**
 * Detect platform source from user agent
 */
export function getPlatformSource(): PlatformSource {
  if (typeof window === 'undefined') return 'web'
  
  const ua = navigator.userAgent.toLowerCase()
  
  // iOS detection (iPhone, iPad, iPod)
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios'
  }
  
  // Android detection
  if (/android/.test(ua)) {
    return 'android'
  }
  
  // Default to web for desktop browsers
  return 'web'
}

/**
 * Get device type (mobile/tablet/desktop)
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const ua = navigator.userAgent.toLowerCase()
  const width = window.screen.width
  
  // Mobile detection
  if (/iphone|ipod|android.*mobile/.test(ua) || (width < 768 && /android/.test(ua))) {
    return 'mobile'
  }
  
  // Tablet detection
  if (/ipad|android(?!.*mobile)/.test(ua) || (width >= 768 && width < 1024)) {
    return 'tablet'
  }
  
  // Desktop
  return 'desktop'
}

/**
 * Extract OS version from user agent
 */
export function getOSVersion(): { os?: string; osVersion?: string } {
  if (typeof window === 'undefined') return {}
  
  const ua = navigator.userAgent
  
  // iOS version
  const iosMatch = ua.match(/OS (\d+)_(\d+)_?(\d+)?/)
  if (iosMatch) {
    return {
      os: 'iOS',
      osVersion: `${iosMatch[1]}.${iosMatch[2]}${iosMatch[3] ? `.${iosMatch[3]}` : ''}`
    }
  }
  
  // Android version
  const androidMatch = ua.match(/Android (\d+(?:\.\d+)?)/)
  if (androidMatch) {
    return {
      os: 'Android',
      osVersion: androidMatch[1]
    }
  }
  
  return {}
}

/**
 * Extract browser info from user agent
 */
export function getBrowserInfo(): { browser?: string; browserVersion?: string } {
  if (typeof window === 'undefined') return {}
  
  const ua = navigator.userAgent
  
  // Chrome
  const chromeMatch = ua.match(/Chrome\/(\d+)/)
  if (chromeMatch && !ua.match(/Edg|OPR/)) {
    return {
      browser: 'Chrome',
      browserVersion: chromeMatch[1]
    }
  }
  
  // Safari
  const safariMatch = ua.match(/Version\/(\d+).*Safari/)
  if (safariMatch && !ua.match(/Chrome|CriOS/)) {
    return {
      browser: 'Safari',
      browserVersion: safariMatch[1]
    }
  }
  
  // Firefox
  const firefoxMatch = ua.match(/Firefox\/(\d+)/)
  if (firefoxMatch) {
    return {
      browser: 'Firefox',
      browserVersion: firefoxMatch[1]
    }
  }
  
  // Edge
  const edgeMatch = ua.match(/Edg\/(\d+)/)
  if (edgeMatch) {
    return {
      browser: 'Edge',
      browserVersion: edgeMatch[1]
    }
  }
  
  return {}
}

/**
 * Get comprehensive platform metadata
 */
export function getPlatformMetadata(): PlatformMetadata {
  const source = getPlatformSource()
  const deviceType = getDeviceType()
  const osInfo = getOSVersion()
  const browserInfo = getBrowserInfo()
  
  return {
    source,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    language: typeof window !== 'undefined' ? navigator.language : 'en',
    platform: typeof window !== 'undefined' ? navigator.platform : '',
    vendor: typeof window !== 'undefined' ? navigator.vendor : '',
    deviceType,
    ...osInfo,
    ...browserInfo
  }
}

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  return getDeviceType() === 'mobile'
}

/**
 * Check if running on tablet device
 */
export function isTablet(): boolean {
  return getDeviceType() === 'tablet'
}

/**
 * Check if running on desktop
 */
export function isDesktop(): boolean {
  return getDeviceType() === 'desktop'
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return getPlatformSource() === 'ios'
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatformSource() === 'android'
}

/**
 * Check if running on web (desktop browser)
 */
export function isWeb(): boolean {
  return getPlatformSource() === 'web'
}
