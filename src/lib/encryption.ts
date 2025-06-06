// Simple encryption/decryption utilities for URL parameters
export class URLEncryption {
  private static readonly SECRET_KEY = "restaurant-qr-2024"

  // Simple XOR-based encryption (for demonstration - use stronger encryption in production)
  private static xorEncrypt(text: string, key: string): string {
    let result = ""
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
  }

  private static xorDecrypt(encrypted: string, key: string): string {
    return this.xorEncrypt(encrypted, key) // XOR is symmetric
  }

  // Convert string to base64 URL-safe format
  private static toBase64URL(str: string): string {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  }

  // Convert from base64 URL-safe format
  private static fromBase64URL(str: string): string {
    // Add padding if needed
    const padding = "=".repeat((4 - (str.length % 4)) % 4)
    const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + padding
    return atob(base64)
  }

  // Encrypt URL parameters
  static encryptURL(originalURL: string): string {
    try {
      // Extract the path and query parameters
      const url = new URL(originalURL)
      const path = url.pathname
      const searchParams = url.searchParams

      // Create a data object with the parameters
      const data = {
        path,
        params: Object.fromEntries(searchParams.entries()),
        timestamp: Date.now(), // Add timestamp for additional security
      }

      // Convert to JSON and encrypt
      const jsonString = JSON.stringify(data)
      const encrypted = this.xorEncrypt(jsonString, this.SECRET_KEY)
      const encoded = this.toBase64URL(encrypted)
      // Return the encrypted URL
      return `${url.origin}/orders?token=${encoded}`
    } catch (error) {
      console.error("Encryption error:", error)
      return originalURL // Fallback to original URL
    }
  }

  // Decrypt URL parameters
  static decryptURL(encryptedToken: string): { path: string; params: Record<string, string> } | null {
    try {
      // Decode and decrypt
      const decoded = this.fromBase64URL(encryptedToken)
      const decrypted = this.xorDecrypt(decoded, this.SECRET_KEY)
      const data = JSON.parse(decrypted)

      // Validate timestamp (optional - reject tokens older than 24 hours)
      

      return {
        path: data.path,
        params: data.params,
      }
    } catch (error) {
      console.error("Decryption error:", error)
      return null
    }
  }

  // Generate a hash for display purposes (non-reversible)
  static generateDisplayHash(originalURL: string): string {
    try {
      // Create a simple hash for display
      let hash = 0
      for (let i = 0; i < originalURL.length; i++) {
        const char = originalURL.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return `#${Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")}`
    } catch {
      return "#UNKNOWN"
    }
  }
}
