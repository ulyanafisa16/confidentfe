// src/components/secret/SecretAccessPage.tsx

'use client'

import { useEffect, useState } from 'react'
import { getSecretInfo, revealSecret } from '../../lib/api'
import type { SecretMetaResponse, RevealSecretResponse, RevealSecretPayload } from '../../types'
import ViewLocked from './ViewLocked'
import ViewRevealed from './ViewRevealed'
import ViewExpired from './ViewExpired'
import ViewLoading from './ViewLoading'

type PageState = 'loading' | 'locked' | 'revealed' | 'expired' | 'error'

interface Props {
  token: string
}

export default function SecretAccessPage({ token }: Props) {
  const [state, setState] = useState<PageState>('loading')
  const [meta, setMeta] = useState<SecretMetaResponse | null>(null)
  const [revealed, setRevealed] = useState<RevealSecretResponse | null>(null)
  const [revealError, setRevealError] = useState('')
  const [revealing, setRevealing] = useState(false)

  useEffect(() => {
  const fetchMeta = async () => {
    try {
      const data = await getSecretInfo(token)
      
      // Map response Django ke SecretMetaResponse
      const meta: SecretMetaResponse = {
        token: data.token,
        expires_at: data.expires_at,
        max_views: 0,
        views_remaining: data.views_remaining,
        is_password_protected: data.requires_password ?? false,
        is_email_restricted: data.requires_email ?? false,
        allow_preview: true,
        status: data.can_access ? 'active' : 'expired',
      }
      
      setMeta(meta)
      if (!data.can_access) {
        setState('expired')
      } else {
        setState('locked')
      }
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setState('expired')
      } else {
        setState('error')
      }
    }
  }
  fetchMeta()
}, [token])

  const handleReveal = async (password?: string, email?: string) => {
  setRevealing(true)
  setRevealError('')
  try {
    const payload: RevealSecretPayload = {}
    if (password) payload.access_password = password
    if (email) payload.email = email

    const data = await revealSecret(token, payload)
    setRevealed(data)
    setState('revealed')
  } catch (e: any) {
    const errData = e?.response?.data
    if (errData?.errors?.access_password) {
      setRevealError(errData.errors.access_password[0])
    } else {
      setRevealError(errData?.message || 'Gagal membuka secret.')
    }
  } finally {
    setRevealing(false)
  }
}

  if (state === 'loading') return <ViewLoading />
  if (state === 'expired' || state === 'error') return <ViewExpired />
  if (state === 'revealed' && revealed) return <ViewRevealed data={revealed} />
  if (state === 'locked' && meta) {
    return (
      <ViewLocked
        meta={meta}
        onReveal={handleReveal}
        loading={revealing}
        error={revealError}
      />
    )
  }

  return null
}