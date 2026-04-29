import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  listVideos,
  deleteVideo,
  updateVideo,
  getPublicUrl,
  type VideoRow,
} from '../lib/uploadVideo'
import { getProjectBySlug, type Project } from '../lib/projects'
import { formatBytes } from '../lib/format'
import { supabase } from '../lib/supabase'

export default function ViewPage() {
  const { slug = '' } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  async function refresh(p: Project) {
    setLoading(true)
    try {
      const list = (await listVideos(p.id)) as VideoRow[]
      setVideos(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    let channel: ReturnType<typeof supabase.channel> | null = null

    ;(async () => {
      try {
        const p = await getProjectBySlug(slug)
        if (!mounted) return
        setProject(p)
        if (!p) {
          setLoading(false)
          return
        }
        await refresh(p)

        channel = supabase
          .channel(`videos-${p.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'videos', filter: `project_id=eq.${p.id}` },
            () => {
              if (mounted) refresh(p)
            },
          )
          .subscribe()
      } catch (e) {
        console.error(e)
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [slug])

  function startEdit(v: VideoRow) {
    setEditingId(v.id)
    setEditName(v.name)
    setEditDesc(v.description ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditDesc('')
  }

  async function saveEdit(v: VideoRow) {
    try {
      await updateVideo(v.id, {
        name: editName.trim() || v.name,
        description: editDesc.trim() ? editDesc.trim() : null,
      })
      cancelEdit()
      if (project) await refresh(project)
    } catch (e) {
      console.error(e)
    }
  }

  async function onDelete(v: VideoRow) {
    if (!confirm(`Excluir "${v.name}"?`)) return
    try {
      await deleteVideo(v.id, v.storage_path)
      if (project) await refresh(project)
    } catch (e) {
      console.error(e)
    }
  }

  function downloadVideo(v: VideoRow) {
    const url = getPublicUrl(v.storage_path)
    const a = document.createElement('a')
    a.href = url
    a.download = v.name
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="app">
        <main className="main">
          <p className="muted">Carregando…</p>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="app">
        <main className="main">
          <div className="empty-state card">
            <h2>Link inválido</h2>
            <p className="muted">Este link não existe ou foi removido.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <main className="main">
        <header className="page-header centered">
          <h1>{project.name}</h1>
        </header>

        <section className="list-card card">
          <div className="card-head">
            <h2>Vídeos</h2>
            <span className="card-head-count">{videos.length}</span>
          </div>

          {videos.length === 0 ? (
            <p className="muted">Nenhum vídeo enviado ainda.</p>
          ) : (
            <ol className="videos">
              {videos.map((v) => {
                const isEditing = editingId === v.id
                return (
                  <li key={v.id} className="video-item view">
                    <span className="seq">{String(v.sequence).padStart(2, '0')}</span>

                    {isEditing ? (
                      <div className="video-edit">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nome"
                          autoFocus
                        />
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Descrição"
                          rows={2}
                        />
                        <div className="video-edit-actions">
                          <button className="ghost" onClick={cancelEdit}>
                            Cancelar
                          </button>
                          <button className="primary" onClick={() => saveEdit(v)}>
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="video-info">
                        <span className="video-name">{v.name}</span>
                        {v.description && (
                          <span className="video-desc">{v.description}</span>
                        )}
                        <span className="video-meta">
                          {formatBytes(v.size_bytes ?? 0)}
                        </span>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="video-actions">
                        <button
                          className="icon-btn"
                          onClick={() => downloadVideo(v)}
                          aria-label="Baixar"
                          title="Baixar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => startEdit(v)}
                          aria-label="Editar"
                          title="Editar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M4 20h4l10-10-4-4L4 16v4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                            <path d="M14 6l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </button>
                        <button
                          className="icon-btn delete-btn"
                          onClick={() => onDelete(v)}
                          aria-label="Excluir"
                          title="Excluir"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </main>
    </div>
  )
}
