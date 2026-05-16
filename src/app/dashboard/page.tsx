'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Clock, Eye, Trash2, CheckCircle,
  XCircle, AlertCircle, Copy, Check,
  FileText, File, ChevronLeft, ChevronRight
} from 'lucide-react'
import { getMySecrets, revokeSecret, getProfile, deleteSecret } from '../../lib/api'
import type { MySecret, UserProfile } from '../../types'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

type StatusFilter = 'all' | 'active' | 'expired' | 'revoked'

const PER_PAGE = 5

function StatusBadge({ status }: { status: MySecret['status'] }) {
  const map = {
    active: { icon: CheckCircle, label: 'Active', cls: 'bg-[#e1f5ee] dark:bg-[#0f3d30] text-[#0f6e56]' },
    expired: { icon: AlertCircle, label: 'Expired', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
    destroyed: { icon: XCircle, label: 'Destroyed', cls: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
    revoked: { icon: XCircle, label: 'Revoked', cls: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
  }
  const { icon: Icon, label, cls } = map[status] ?? map.expired
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      <Icon size={11} />{label}
    </span>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

function timeUntil(dateStr: string | null) {
  if (!dateStr) return 'No expiry'
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d left`
  return `${h}h left`
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [secrets, setSecrets] = useState<MySecret[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    secretId: string
    title: string
    message: string
  } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    secretId: string
  } | null>(null)
  const [errorDialog, setErrorDialog] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.replace('/login'); return }
    const fetchAll = async () => {
      try {
        const [prof, secsRaw] = await Promise.all([getProfile(), getMySecrets()])
        setProfile(prof)
        setSecrets(Array.isArray(secsRaw) ? secsRaw : [])
      } catch {
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [router])

  useEffect(() => { setPage(1) }, [filter])

  const handleRevoke = (id: string) => {
    setConfirmDialog({
      open: true,
      secretId: id,
      title: 'Revoke secret ini?',
      message: 'Secret dan semua link-nya akan dimatikan permanen. Penerima tidak akan bisa membuka link tersebut lagi. Tindakan ini tidak bisa dibatalkan.',
    })
  }

  const confirmRevoke = async () => {
    if (!confirmDialog) return
    const id = confirmDialog.secretId
    setConfirmDialog(null)
    setRevoking(id)
    try {
      await revokeSecret(id)
      setSecrets((prev) =>
        prev.map((s) => s.id === id ? { ...s, status: 'revoked' as const } : s)
      )
    } catch {
      alert('Gagal merevoke secret.')
    } finally {
      setRevoking(null)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, secretId: id })
  }

  const confirmDelete = async () => {
    if (!deleteDialog) return
    const id = deleteDialog.secretId
    setDeleteDialog(null)
    try {
      await deleteSecret(id)
      setSecrets((prev) => prev.filter((s) => s.id !== id))
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal menghapus riwayat.'
      setErrorDialog(msg)
    }
  }

  const handleCopyLink = (secret: MySecret) => {
    const activeLink = secret.links.find(l => l.is_active) ?? secret.links[0]
    if (!activeLink) return
    navigator.clipboard.writeText(`${window.location.origin}/s/${activeLink.token}`)
    setCopiedId(secret.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const filtered = secrets.filter((s) => filter === 'all' || s.status === filter)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const stats = {
    total: secrets.length,
    active: secrets.filter((s) => s.status === 'active').length,
    expired: secrets.filter((s) => s.status === 'expired' || s.status === 'revoked').length,
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1d9e75] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Welcome back, {profile?.full_name || profile?.email}
          </p>
        </div>
        <Link href="/"><Button variant="primary" size="md"><Plus size={14} />New secret</Button></Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total secrets', value: stats.total },
          { label: 'Active', value: stats.active, color: 'text-[#0f6e56]' },
          { label: 'Expired / Revoked', value: stats.expired, color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5 w-fit">
        {(['all', 'active', 'expired', 'revoked'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 rounded-lg capitalize font-medium transition-all ${
              filter === f
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {f}{f === 'all' && <span className="text-xs text-gray-400 ml-1">({stats.total})</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {paginated.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <p className="text-gray-400 text-sm mb-3">No secrets found</p>
          <Link href="/"><Button variant="outline" size="sm"><Plus size={13} />Create your first secret</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((secret) => {
            const activeLink = secret.links.find(l => l.is_active) ?? secret.links[0]
            const isFile = secret.secret_type === 'file'
            return (
              <div key={secret.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <StatusBadge status={secret.status} />
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        {isFile ? <File size={11} /> : <FileText size={11} />}
                        {isFile ? (secret.original_filename || 'File') : 'Text secret'}
                      </span>
                      <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-xs text-gray-400">{timeAgo(secret.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {secret.current_views}/{secret.max_views === 9999 ? '∞' : secret.max_views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {secret.status === 'active' ? timeUntil(secret.expires_at) : timeAgo(secret.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions — di dalam map, bisa akses secret */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {secret.status === 'active' && activeLink && (
                      <>
                        <button
                          onClick={() => handleRevoke(secret.id)}
                          disabled={revoking === secret.id}
                          title="Revoke secret"
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}

                    {/* Tombol delete untuk secret yang sudah tidak active */}
                    {secret.status !== 'active' && (
                      <button
                        onClick={() => handleDelete(secret.id)}
                        title="Hapus riwayat"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-400">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  page === p
                    ? 'bg-[#1a6b5e] text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Revoke Dialog */}
      {confirmDialog?.open && (
        <ConfirmDialog
          isOpen={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel="Ya, revoke secret"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={confirmRevoke}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deleteDialog?.open && (
        <ConfirmDialog
          isOpen={deleteDialog.open}
          title="Hapus riwayat secret?"
          message="Riwayat secret ini akan dihapus permanen dari dashboard. Tindakan ini tidak bisa dibatalkan."
          confirmLabel="Ya, hapus riwayat"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteDialog(null)}
        />
      )}

      {errorDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Tidak bisa dihapus"
          message={errorDialog}
          confirmLabel="OK"
          cancelLabel={undefined}
          variant="warning"
          onConfirm={() => setErrorDialog(null)}
          onCancel={() => setErrorDialog(null)}
        />
      )}

    </div>
  )
}