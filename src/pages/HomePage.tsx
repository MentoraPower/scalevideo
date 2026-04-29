import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="app">
      <main className="main">
        <div className="empty-state card">
          <h2>Video Uploader</h2>
          <p className="muted">Acesse o painel admin para criar projetos e gerar links.</p>
          <div style={{ marginTop: 18 }}>
            <Link to="/admin" className="primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
              Ir para o admin
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
