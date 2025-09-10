/**
 * OCR/NER Extraction Utilities for Bucket & MediaID
 * Automated metadata extraction from uploaded content and images
 */

import { BucketsTrackMetadata } from '../components/ArtistUploadManager'

// Country code mapping (sample - can be extended)
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  'united states': 'US',
  'usa': 'US',
  'america': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'britain': 'GB',
  'canada': 'CA',
  'australia': 'AU',
  'germany': 'DE',
  'france': 'FR',
  'japan': 'JP',
  'south korea': 'KR',
  'brazil': 'BR',
  'mexico': 'MX',
  'spain': 'ES',
  'italy': 'IT',
  'netherlands': 'NL',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI'
}

// Regex patterns for extraction
const PATTERNS = {
  URL: /https?:\/\/[^\s]+/g,
  DATE: /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g,
  ISRC: /\b[A-Z]{2}[A-Z0-9]{3}\d{7}\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
}

// Keyword mappings for boolean detection
const BOOLEAN_KEYWORDS = {
  explicit: ['explicit', 'explicit content', 'contains explicit', 'parental advisory'],
  enable_direct_downloads: ['direct download', 'download', 'downloadable'],
  offline_listening: ['offline', 'offline listening', 'offline playback'],
  include_in_rss: ['rss', 'feed', 'rss feed'],
  display_embed_code: ['embed', 'embed code', 'embeddable'],
  enable_app_playback: ['app playback', 'external apps', 'third party'],
  allow_comments: ['comments', 'allow comments', 'commenting'],
  show_comments_public: ['public comments', 'show comments'],
  show_insights_public: ['public insights', 'show insights', 'analytics public']
}

// License type detection
const LICENSE_KEYWORDS = {
  'all_rights_reserved': ['all rights reserved', 'copyright', '©'],
  'cc_by': ['creative commons by', 'cc by', 'attribution'],
  'cc_by_sa': ['creative commons by-sa', 'cc by-sa', 'sharealike'],
  'cc_by_nc': ['creative commons by-nc', 'cc by-nc', 'non-commercial'],
  'cc_by_nc_sa': ['creative commons by-nc-sa', 'cc by-nc-sa'],
  'cc_by_nd': ['creative commons by-nd', 'cc by-nd', 'no derivatives'],
  'cc_by_nc_nd': ['creative commons by-nc-nd', 'cc by-nc-nd']
}

/**
 * Extract metadata from OCR text blocks
 */
export interface ExtractionResult {
  metadata: Partial<BucketsTrackMetadata>
  confidence: Record<string, number>
  errors: string[]
}

export class MetadataExtractor {
  /**
   * Main extraction function
   */
  static extractFromText(ocrText: string): ExtractionResult {
    const text = ocrText.toLowerCase().trim()
    const result: ExtractionResult = {
      metadata: {},
      confidence: {},
      errors: []
    }

    try {
      // Extract URLs
      const urls = this.extractUrls(ocrText)
      if (urls.length > 0) {
        result.metadata.buy_link_url = urls[0]
        result.confidence.buy_link_url = 0.8
      }

      // Extract dates
      const dates = this.extractDates(ocrText)
      if (dates.length > 0) {
        result.metadata.release_date = dates[0]
        result.confidence.release_date = 0.7
      }

      // Extract ISRC
      const isrcCodes = this.extractISRC(ocrText)
      if (isrcCodes.length > 0) {
        result.metadata.isrc = isrcCodes[0]
        result.confidence.isrc = 0.9
      }

      // Extract boolean flags
      const booleanFlags = this.extractBooleanFlags(text)
      Object.assign(result.metadata, booleanFlags.metadata)
      Object.assign(result.confidence, booleanFlags.confidence)

      // Extract license information
      const license = this.extractLicense(text)
      if (license) {
        result.metadata.license_type = license.type
        result.confidence.license_type = license.confidence
      }

      // Extract regions/countries
      const regions = this.extractRegions(text)
      if (regions.length > 0) {
        result.metadata.availability_regions = regions
        result.metadata.availability_scope = 'exclusive_regions'
        result.confidence.availability_regions = 0.6
      }

      // Extract organizational info (labels, publishers)
      const orgInfo = this.extractOrganizationalInfo(ocrText)
      Object.assign(result.metadata, orgInfo.metadata)
      Object.assign(result.confidence, orgInfo.confidence)

    } catch (error) {
      result.errors.push(`Extraction error: ${error}`)
    }

    return result
  }

  /**
   * Extract URLs from text
   */
  private static extractUrls(text: string): string[] {
    const matches = text.match(PATTERNS.URL)
    return matches ? matches.filter(url => this.isValidUrl(url)) : []
  }

  /**
   * Extract and normalize dates
   */
  private static extractDates(text: string): string[] {
    const matches = text.match(PATTERNS.DATE)
    if (!matches) return []

    return matches.map(dateStr => {
      const [, month, day, year] = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/) || []
      if (!month || !day || !year) return null

      // Convert to YYYY-MM-DD format
      const fullYear = year.length === 2 ? `20${year}` : year
      const paddedMonth = month.padStart(2, '0')
      const paddedDay = day.padStart(2, '0')
      
      return `${fullYear}-${paddedMonth}-${paddedDay}`
    }).filter(Boolean) as string[]
  }

  /**
   * Extract ISRC codes
   */
  private static extractISRC(text: string): string[] {
    const matches = text.toUpperCase().match(PATTERNS.ISRC)
    return matches ? matches.filter(isrc => this.isValidISRC(isrc)) : []
  }

  /**
   * Extract boolean flags from text
   */
  private static extractBooleanFlags(text: string): {
    metadata: Partial<BucketsTrackMetadata>
    confidence: Record<string, number>
  } {
    const metadata: Partial<BucketsTrackMetadata> = {}
    const confidence: Record<string, number> = {}

    Object.entries(BOOLEAN_KEYWORDS).forEach(([key, keywords]) => {
      const found = keywords.some(keyword => {
        const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        return pattern.test(text)
      })

      if (found) {
        // Check for negative indicators
        const negativeWords = ['not', 'disable', 'off', 'false', 'no']
        const hasNegative = negativeWords.some(neg => {
          const negPattern = new RegExp(`${neg}\\s+${keywords[0]}`, 'i')
          return negPattern.test(text)
        })

        ;(metadata as any)[key] = !hasNegative
        confidence[key] = hasNegative ? 0.6 : 0.8
      }
    })

    return { metadata, confidence }
  }

  /**
   * Extract license type
   */
  private static extractLicense(text: string): { type: any, confidence: number } | null {
    for (const [licenseType, keywords] of Object.entries(LICENSE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return {
            type: licenseType as any,
            confidence: keyword === 'all rights reserved' ? 0.9 : 0.7
          }
        }
      }
    }
    return null
  }

  /**
   * Extract country regions and convert to ISO codes
   */
  private static extractRegions(text: string): string[] {
    const regions: Set<string> = new Set()

    // Check for country names
    Object.entries(COUNTRY_NAME_TO_ISO).forEach(([countryName, isoCode]) => {
      if (text.includes(countryName)) {
        regions.add(isoCode)
      }
    })

    // Check for existing ISO codes
    const isoPattern = /\b[A-Z]{2}\b/g
    const isoMatches = text.toUpperCase().match(isoPattern)
    if (isoMatches) {
      isoMatches.forEach(code => {
        if (Object.values(COUNTRY_NAME_TO_ISO).includes(code)) {
          regions.add(code)
        }
      })
    }

    return Array.from(regions).slice(0, 20) // Limit to 20 regions
  }

  /**
   * Extract organizational information (labels, publishers)
   */
  private static extractOrganizationalInfo(text: string): {
    metadata: Partial<BucketsTrackMetadata>
    confidence: Record<string, number>
  } {
    const metadata: Partial<BucketsTrackMetadata> = {}
    const confidence: Record<string, number> = {}

    // Look for record label patterns
    const labelPatterns = [
      /record label[:\s]+([^\n\r]+)/i,
      /label[:\s]+([^\n\r]+)/i,
      /released by[:\s]+([^\n\r]+)/i
    ]

    for (const pattern of labelPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        metadata.record_label = match[1].trim()
        confidence.record_label = 0.7
        break
      }
    }

    // Look for publisher patterns
    const publisherPatterns = [
      /publisher[:\s]+([^\n\r]+)/i,
      /published by[:\s]+([^\n\r]+)/i,
      /music publisher[:\s]+([^\n\r]+)/i
    ]

    for (const pattern of publisherPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        metadata.publisher = match[1].trim()
        confidence.publisher = 0.7
        break
      }
    }

    return { metadata, confidence }
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate ISRC format
   */
  private static isValidISRC(isrc: string): boolean {
    return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc)
  }

  /**
   * Apply extracted metadata with confidence thresholds
   */
  static applyExtractedMetadata(
    currentMetadata: BucketsTrackMetadata,
    extractionResult: ExtractionResult,
    confidenceThreshold: number = 0.7
  ): BucketsTrackMetadata {
    const updatedMetadata = { ...currentMetadata }

    Object.entries(extractionResult.metadata).forEach(([key, value]) => {
      const confidence = extractionResult.confidence[key] || 0
      
      if (confidence >= confidenceThreshold && value !== undefined) {
        ;(updatedMetadata as any)[key] = value
      }
    })

    return updatedMetadata
  }
}

/**
 * Utility functions for manual validation and correction
 */
export class MetadataValidator {
  /**
   * Validate ISRC format
   */
  static validateISRC(isrc: string): { valid: boolean; formatted?: string; error?: string } {
    if (!isrc) return { valid: true } // Optional field
    
    const cleaned = isrc.replace(/[\s-]/g, '').toUpperCase()
    
    if (!/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(cleaned)) {
      return {
        valid: false,
        error: 'ISRC must be in format: CC-XXX-YY-NNNNN (Country-Registrant-Year-Designation)'
      }
    }
    
    return { valid: true, formatted: cleaned }
  }

  /**
   * Validate release date
   */
  static validateReleaseDate(date: string): { valid: boolean; formatted?: string; error?: string } {
    if (!date) return { valid: true } // Optional field
    
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      return { valid: false, error: 'Invalid date format' }
    }
    
    if (parsed > new Date()) {
      return { valid: false, error: 'Release date cannot be in the future' }
    }
    
    return { valid: true, formatted: date }
  }

  /**
   * Validate buy link URL
   */
  static validateBuyLink(url: string): { valid: boolean; error?: string } {
    if (!url) return { valid: true } // Optional field
    
    try {
      new URL(url)
      return { valid: true }
    } catch {
      return { valid: false, error: 'Invalid URL format' }
    }
  }

  /**
   * Validate country codes
   */
  static validateRegions(regions: string[]): { valid: boolean; error?: string } {
    const validCodes = Object.values(COUNTRY_NAME_TO_ISO)
    const invalidCodes = regions.filter(code => !validCodes.includes(code))
    
    if (invalidCodes.length > 0) {
      return {
        valid: false,
        error: `Invalid country codes: ${invalidCodes.join(', ')}`
      }
    }
    
    return { valid: true }
  }
}

// Example usage and testing
export const ExampleUsage = {
  // Sample OCR text for testing
  sampleOcrText: `
    Title: My Amazing Track
    Buy Link: https://store.example.com/track/123
    Record Label: Silver Street Records
    Release Date: 09/08/2025
    Publisher: Northlight Publishing
    ISRC: USABC2500123
    
    Permissions:
    ✓ Enable direct downloads
    ✓ Offline listening
    ✗ Show insights to public
    
    License: All rights reserved
    
    Available in: United States, Canada, United Kingdom
  `,
  
  // Test extraction
  test: () => {
    const result = MetadataExtractor.extractFromText(ExampleUsage.sampleOcrText)
    console.log('🔍 Extraction Result:', result)
    return result
  }
}