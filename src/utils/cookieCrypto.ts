import crypto from "crypto"

const ENCRYPTION_KEY = process.env.COOKIE_ENCRYPTION_KEY || "your-fallback-key-here" // 32 bytes
const IV_LENGTH = 16 // For AES, this is always 16

export function encryptData(data: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(data)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

export function decryptData(data: string): string {
  const textParts = data.split(":")
  const iv = Buffer.from(textParts.shift()!, "hex")
  const encryptedText = Buffer.from(textParts.join(":"), "hex")
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

