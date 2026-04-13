// src/lib/encryptText.ts

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
    .replace(/\+/g, '-')   // ← URL-safe
    .replace(/\//g, '_')   // ← URL-safe
    .replace(/=/g, '')     // ← hapus padding
}

export async function encryptSecret(plaintext: string, password?: string) {
  const encoder = new TextEncoder()
  const ivBytes = crypto.getRandomValues(new Uint8Array(12))
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))

  let key: CryptoKey

  if (password) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
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

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    encoder.encode(plaintext)
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
  }
}