import { createContext, useCallback, useContext, useRef, useState } from 'react'
import {
  uploadVideoResumable,
  getNextSequence,
  insertVideoRow,
} from './uploadVideo'

export type UploadJob = {
  id: string
  projectId: string
  projectName: string
  videoName: string
  description: string
  fileName: string
  size: number
  bytesUp: number
  progress: number
  status: 'queued' | 'uploading' | 'done' | 'error'
  error?: string
  startedAt: number
}

type Ctx = {
  jobs: UploadJob[]
  startUpload: (args: {
    file: File
    videoName: string
    description: string
    projectId: string
    projectName: string
  }) => string
  dismissJob: (id: string) => void
}

const UploadCtx = createContext<Ctx | null>(null)

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const jobsRef = useRef<UploadJob[]>([])
  jobsRef.current = jobs

  const update = useCallback((id: string, patch: Partial<UploadJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }, [])

  const startUpload = useCallback<Ctx['startUpload']>(
    ({ file, videoName, description, projectId, projectName }) => {
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      const job: UploadJob = {
        id,
        projectId,
        projectName,
        videoName,
        description,
        fileName: file.name,
        size: file.size,
        bytesUp: 0,
        progress: 0,
        status: 'queued',
        startedAt: Date.now(),
      }
      setJobs((prev) => [...prev, job])
      ;(async () => {
        try {
          update(id, { status: 'uploading' })
          const sequence = await getNextSequence(projectId)
          const { objectName } = await uploadVideoResumable(file, videoName, projectId, {
            onProgress: (percent, bytesUploaded) => {
              update(id, { progress: percent, bytesUp: bytesUploaded })
            },
          })
          await insertVideoRow({
            name: videoName,
            description: description || undefined,
            objectName,
            sequence,
            sizeBytes: file.size,
            projectId,
          })
          update(id, { status: 'done', progress: 100 })
          setTimeout(() => {
            setJobs((prev) => prev.filter((j) => j.id !== id))
          }, 4000)
        } catch (err) {
          console.error(err)
          update(id, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Falha ao enviar.',
          })
        }
      })()
      return id
    },
    [update],
  )

  const dismissJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }, [])

  return (
    <UploadCtx.Provider value={{ jobs, startUpload, dismissJob }}>
      {children}
    </UploadCtx.Provider>
  )
}

export function useUploads() {
  const ctx = useContext(UploadCtx)
  if (!ctx) throw new Error('useUploads must be used inside UploadProvider')
  return ctx
}
