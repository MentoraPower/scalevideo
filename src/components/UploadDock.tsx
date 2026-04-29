import { useUploads } from '../lib/UploadContext'
import { formatBytes } from '../lib/format'

export default function UploadDock() {
  const { jobs, dismissJob } = useUploads()
  if (jobs.length === 0) return null

  return (
    <div className="upload-dock">
      <div className="upload-dock-head">
        <strong>Envios em andamento</strong>
        <span>{jobs.length}</span>
      </div>
      <ul>
        {jobs.map((j) => (
          <li key={j.id} className={`upload-dock-item status-${j.status}`}>
            <div className="upload-dock-row">
              <span className="upload-dock-name">{j.videoName}</span>
              <span className="upload-dock-pct">
                {j.status === 'done' ? '✓' : j.status === 'error' ? '!' : `${j.progress.toFixed(0)}%`}
              </span>
              <button
                className="upload-dock-x"
                onClick={() => dismissJob(j.id)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="progress-track small">
              <div className="progress-bar" style={{ width: `${j.progress}%` }} />
            </div>
            <div className="upload-dock-meta">
              <span>{j.projectName}</span>
              <span>
                {formatBytes(j.bytesUp)} / {formatBytes(j.size)}
              </span>
            </div>
            {j.error && <div className="upload-dock-error">{j.error}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}
