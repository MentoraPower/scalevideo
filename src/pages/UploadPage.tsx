import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProjectBySlug, type Project } from '../lib/projects'
import { useUploads } from '../lib/UploadContext'

const MAX_BYTES = 2 * 1024 * 1024 * 1024

type Step = 'idle' | 'meta'

export default function UploadPage() {
  const { slug = '' } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loadingProject, setLoadingProject] = useState(true)

  const [step, setStep] = useState<Step>('idle')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingMeta = useRef<{ name: string; description: string } | null>(null)
  const { startUpload } = useUploads()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingProject(true)
        const p = await getProjectBySlug(slug)
        if (mounted) setProject(p)
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoadingProject(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [slug])

  function openMetaModal() {
    setError(null)
    setSuccess(null)
    setName('')
    setDescription('')
    setStep('meta')
  }

  function closeMetaModal() {
    setStep('idle')
    setName('')
    setDescription('')
  }

  function onMetaSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    pendingMeta.current = { name: name.trim(), description: description.trim() }
    fileInputRef.current?.click()
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!file || !pendingMeta.current || !project) return

    if (file.size > MAX_BYTES) {
      setError('O vídeo ultrapassa o limite de 2GB.')
      return
    }

    const meta = pendingMeta.current
    pendingMeta.current = null

    startUpload({
      file,
      videoName: meta.name,
      description: meta.description,
      projectId: project.id,
      projectName: project.name,
    })

    setStep('idle')
    setName('')
    setDescription('')
    setSuccess(`Envio de "${meta.name}" iniciado. Você pode fechar ou navegar — o upload continua.`)
  }

  if (loadingProject) {
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
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={onFilePicked}
        className="file-input-hidden"
      />

      <main className="main">
        <header className="page-header centered">
          <h1>{project.name}</h1>
        </header>

        <div className="hero">
          <button type="button" className="upload-tile" onClick={openMetaModal}>
            <div className="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 16V4m0 0l-5 5m5-5l5 5M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="upload-text">
              <strong>Enviar vídeo</strong>
              <span>Clique para começar · até 2GB</span>
            </div>
          </button>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
        </div>
      </main>

      {step === 'meta' && (
        <div className="modal-backdrop" onClick={closeMetaModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Novo vídeo</h3>
              <button className="icon-btn modal-close" onClick={closeMetaModal} aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={onMetaSubmit} className="modal-body">
              <label className="field">
                <span>Nome</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Aula 01 — Introdução"
                  autoFocus
                  required
                />
              </label>

              <label className="field">
                <span>Descrição</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opcional"
                  rows={3}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="ghost" onClick={closeMetaModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary" disabled={!name.trim()}>
                  Escolher arquivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
