import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProjects, createProject, deleteProject, type Project } from '../lib/projects'

export default function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function refresh() {
    try {
      setLoading(true)
      setProjects(await listProjects())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      setCreating(true)
      setError(null)
      const created = await createProject(name.trim())
      setName('')
      await refresh()
      navigate(`/admin/${created.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar.')
    } finally {
      setCreating(false)
    }
  }

  async function onDelete(p: Project, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Excluir "${p.name}" e todos os vídeos dele?`)) return
    try {
      await deleteProject(p.id)
      await refresh()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="app">
      <main className="main main-wide">
        <header className="page-header">
          <h1>Admin</h1>
          <p className="subtitle">Crie projetos para receber vídeos dos seus clientes.</p>
        </header>

        <section className="card create-card">
          <div className="card-head">
            <h2>Cadastrar projeto</h2>
          </div>
          <form onSubmit={onCreate} className="create-form">
            <label className="field">
              <span>Nome</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Cliente Maria — Curso 01"
                disabled={creating}
                required
              />
            </label>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="card-actions">
              <button type="submit" className="primary" disabled={creating || !name.trim()}>
                {creating ? 'Criando…' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </section>

        <section className="list-card card">
          <div className="card-head">
            <h2>Projetos</h2>
            <span className="card-head-count">{projects.length}</span>
          </div>

          {loading ? (
            <p className="muted">Carregando…</p>
          ) : projects.length === 0 ? (
            <p className="muted">Nenhum projeto ainda. Cadastre o primeiro acima.</p>
          ) : (
            <ul className="projects projects-grid">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="project-card"
                  onClick={() => navigate(`/admin/${p.slug}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/admin/${p.slug}`)
                  }}
                >
                  <div className="project-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </div>
                  <div className="project-card-body">
                    <strong>{p.name}</strong>
                    <span className="project-slug">/{p.slug}</span>
                  </div>
                  <button
                    className="icon-btn delete-btn"
                    onClick={(e) => onDelete(p, e)}
                    aria-label="Excluir"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
