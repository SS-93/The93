// Dynamic Player Theme - Phase 1
// Extracts dominant colors from album art for theming

import React, { useEffect, useState } from 'react'

interface DynamicPlayerThemeProps {
  albumArt?: string
  onColorExtracted: (color: string) => void
}

const DynamicPlayerTheme: React.FC<DynamicPlayerThemeProps> = ({ 
  albumArt, 
  onColorExtracted 
}) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    // Create canvas for color extraction
    const canvasElement = document.createElement('canvas')
    canvasElement.width = 1
    canvasElement.height = 1
    setCanvas(canvasElement)
  }, [])

  useEffect(() => {
    if (!albumArt || !canvas) {
      // Default theme color
      onColorExtracted('#3b82f6')
      return
    }

    extractDominantColor(albumArt, canvas, onColorExtracted)
  }, [albumArt, canvas, onColorExtracted])

  return null // This is a utility component with no UI
}

function extractDominantColor(
  imageSrc: string, 
  canvas: HTMLCanvasElement, 
  callback: (color: string) => void
) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  img.onload = () => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Scale image to small size for faster processing
    const size = 50
    canvas.width = size
    canvas.height = size
    
    ctx.drawImage(img, 0, 0, size, size)
    
    try {
      const imageData = ctx.getImageData(0, 0, size, size)
      const data = imageData.data
      
      // Color frequency map
      const colorMap = new Map<string, number>()
      
      // Sample pixels
      for (let i = 0; i < data.length; i += 4 * 4) { // Sample every 4th pixel
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        
        // Skip transparent or very dark/light pixels
        if (a < 128 || (r + g + b) < 50 || (r + g + b) > 700) continue
        
        // Quantize colors to reduce noise
        const qr = Math.round(r / 32) * 32
        const qg = Math.round(g / 32) * 32
        const qb = Math.round(b / 32) * 32
        
        const colorKey = `${qr},${qg},${qb}`
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
      }
      
      if (colorMap.size === 0) {
        callback('#3b82f6')
        return
      }
      
      // Find most frequent color
      let maxCount = 0
      let dominantColor = '3b82f6'
      
      for (const [color, count] of Array.from(colorMap.entries())) {
        if (count > maxCount) {
          maxCount = count
          const [r, g, b] = color.split(',').map(Number)
          
          // Ensure color has good contrast and saturation
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          const saturation = getSaturation(r, g, b)
          
          if (luminance > 0.1 && luminance < 0.9 && saturation > 0.2) {
            dominantColor = rgbToHex(r, g, b)
          }
        }
      }
      
      callback(`#${dominantColor}`)
      
    } catch (error) {
      console.warn('Could not extract color from image:', error)
      callback('#3b82f6')
    }
  }
  
  img.onerror = () => {
    callback('#3b82f6')
  }
  
  img.src = imageSrc
}

function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  
  return `${toHex(r)}${toHex(g)}${toHex(b)}`
}

export default DynamicPlayerTheme