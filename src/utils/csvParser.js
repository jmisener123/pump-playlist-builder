import Papa from 'papaparse'

/**
 * Decode base64 string to UTF-8 text
 */
export function decodeBase64(base64String) {
  try {
    // Handle both browser atob and potential Node.js Buffer
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    // Decode as UTF-8
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(bytes)
  } catch (e) {
    console.error('Error decoding base64:', e)
    return null
  }
}

/**
 * Parse CSV string into array of track objects
 */
export function parseCSV(csvString) {
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  })

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors)
  }

  return result.data
}

/**
 * Normalize text using NFC normalization for proper accent handling
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return text
  return text.normalize('NFC')
}
