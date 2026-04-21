'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/app/context/ThemeContext'
import api from '@/app/lib/axios'
import Image from 'next/image'

interface MediaFile {
  id: string
  url: string
  filename: string
  type: string
  size: number
}

interface MediaPickerProps {
  onSelect: (url: string) => void
  onClose: () => void
}

export default function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const { dark } = useTheme()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const res = await api.get('/api/media')
      setFiles(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const res = await api.post('/api/media/upload', formData)
      setFiles(prev => [res.data, ...prev])
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const t = {
    dark,
    BG_MODAL: dark ? '#111116' : '#ffffff',
    BG_INPUT: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)',
    BORDER_INP: dark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.12)',
    TEXT_MAIN: dark ? '#f0ede8' : '#1a1918',
    TEXT_MUTED: dark ? 'rgba(255,255,255,.42)' : 'rgba(0,0,0,.45)',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 700, maxWidth: '90vw', height: '80vh', background: t.BG_MODAL, borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${t.BORDER_INP}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: t.TEXT_MAIN, margin: 0 }}>Médiathèque</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${t.BORDER_INP}`, background: 'none', color: t.TEXT_MUTED, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '1rem', borderBottom: `1px solid ${t.BORDER_INP}` }}>
          <label style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, background: '#EF9F27', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            {uploading ? 'Upload...' : '+ Uploader un fichier'}
            <input type="file" onChange={handleUpload} style={{ display: 'none' }} accept="image/*,video/*" />
          </label>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: t.TEXT_MUTED }}>Chargement...</div>
          ) : files.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: t.TEXT_MUTED }}>Aucun fichier</div>
          ) : (
            files.map(file => (
              <div
                key={file.id}
                onClick={() => onSelect(file.url)}
                style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: `1px solid ${t.BORDER_INP}`, transition: 'transform 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {file.type.startsWith('image/') ? (
                  <img src={file.url} alt={file.filename} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: 100, background: t.BG_INPUT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🎬</div>
                )}
                <div style={{ padding: '6px 8px', fontSize: 10, color: t.TEXT_MUTED, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}