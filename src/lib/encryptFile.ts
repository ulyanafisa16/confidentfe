// src/lib/encryptFile.ts

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export interface EncryptedFile {
  encrypted_payload: string
  encryption_iv: string
  encryption_tag: string
  encryption_salt: string
  raw_key_b64: string | null
  mode: 'url-key' | 'passphrase'
  original_filename: string
  mime_type: string
  file_size_bytes: number
}

export async function encryptFile(
  file: File,
  passphrase?: string
): Promise<EncryptedFile> {
  console.log("ENCRYPT FILE CALLED") 
  const encoder = new TextEncoder()
  const ivBytes = crypto.getRandomValues(new Uint8Array(12))
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))

  let key: CryptoKey
  let mode: 'url-key' | 'passphrase'

  if (passphrase && passphrase.trim()) {
    mode = 'passphrase'
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase.trim()),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )
    key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: 310000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )
  } else {
    mode = 'url-key'
    key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    )
  }

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

  let raw_key_b64: string | null = null
  if (mode === 'url-key') {
    const rawKey = await crypto.subtle.exportKey('raw', key)
    raw_key_b64 = bufferToBase64(rawKey)
  }

  return {
    encrypted_payload: bufferToBase64(ciphertextBytes),
    encryption_iv: bufferToBase64(ivBytes),
    encryption_tag: bufferToBase64(tagBytes),
    encryption_salt: bufferToBase64(saltBytes),
    raw_key_b64,
    mode,
    original_filename: file.name,
    mime_type: file.type || 'application/octet-stream',
    file_size_bytes: file.size,
  }
}