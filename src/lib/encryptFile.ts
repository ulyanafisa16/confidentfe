// src/lib/encryptFile.ts

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

export interface EncryptedFile {
  encrypted_payload: string
  encryption_iv: string
  encryption_tag: string
  encryption_salt: string
  raw_key_b64: string
  original_filename: string
  mime_type: string
  file_size_bytes: number
}

export async function encryptFile(
  file: File,
  password?: string
): Promise<EncryptedFile> {
  const ivBytes = crypto.getRandomValues(new Uint8Array(12))
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))

  let key: CryptoKey

  if (password) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )
    key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    )
  } else {
    key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    )
  }

  // Baca file sebagai ArrayBuffer
  const fileBuffer = await file.arrayBuffer()

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    fileBuffer
  )

  const cipherBytes = new Uint8Array(cipherBuffer)
  const tagOffset = cipherBytes.length - 16
  const ciphertextBytes = cipherBytes.slice(0, tagOffset)
  const tagBytes = cipherBytes.slice(tagOffset)
  const rawKey = await crypto.subtle.exportKey('raw', key)

  return {
    encrypted_payload: bufferToBase64(ciphertextBytes),
    encryption_iv: bufferToBase64(ivBytes),
    encryption_tag: bufferToBase64(tagBytes),
    encryption_salt: bufferToBase64(saltBytes),
    raw_key_b64: bufferToBase64(rawKey),
    original_filename: file.name,
    mime_type: file.type || 'application/octet-stream',
    file_size_bytes: file.size,
  }
}