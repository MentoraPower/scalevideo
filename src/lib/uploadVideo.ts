import * as tus from 'tus-js-client'
import { SUPABASE_URL, SUPABASE_ANON_KEY, VIDEOS_BUCKET, supabase } from './supabase'

export type UploadCallbacks = {
  onProgress?: (percent: number, bytesUploaded: number, bytesTotal: number) => void
  onSuccess?: (objectName: string) => void
  onError?: (error: Error) => void
}

function sanitizeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function uploadVideoResumable(
  file: File,
  videoName: string,
  projectId: string,
  callbacks: UploadCallbacks = {},
): Promise<{ objectName: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token ?? SUPABASE_ANON_KEY

  const safeName = sanitizeName(videoName || file.name)
  const objectName = `${projectId}/${Date.now()}_${safeName}_${sanitizeName(file.name)}`

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: VIDEOS_BUCKET,
        objectName,
        contentType: file.type || 'video/mp4',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024,
      onError(error) {
        callbacks.onError?.(error as Error)
        reject(error)
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percent = Number(((bytesUploaded / bytesTotal) * 100).toFixed(2))
        callbacks.onProgress?.(percent, bytesUploaded, bytesTotal)
      },
      onSuccess() {
        callbacks.onSuccess?.(objectName)
        resolve({ objectName })
      },
    })

    upload.findPreviousUploads().then((previous) => {
      if (previous.length > 0) {
        upload.resumeFromPreviousUpload(previous[0])
      }
      upload.start()
    })
  })
}

export async function getNextSequence(projectId: string): Promise<number> {
  const { data, error } = await supabase
    .from('videos')
    .select('sequence')
    .eq('project_id', projectId)
    .order('sequence', { ascending: false })
    .limit(1)
  if (error) throw error
  const max = data?.[0]?.sequence ?? 0
  return max + 1
}

export async function insertVideoRow(args: {
  name: string
  description?: string
  objectName: string
  sequence: number
  sizeBytes: number
  projectId: string
}) {
  const { error } = await supabase.from('videos').insert({
    name: args.name,
    description: args.description ?? null,
    storage_path: args.objectName,
    sequence: args.sequence,
    size_bytes: args.sizeBytes,
    project_id: args.projectId,
  })
  if (error) throw error
}

export async function listVideos(projectId: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('project_id', projectId)
    .order('sequence', { ascending: true })
  if (error) throw error
  return data
}

export async function updateVideo(id: string, patch: { name?: string; description?: string | null }) {
  const { error } = await supabase.from('videos').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteVideo(id: string, storagePath: string) {
  const { error: storageErr } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .remove([storagePath])
  if (storageErr) console.warn('storage remove warn:', storageErr.message)
  const { error } = await supabase.from('videos').delete().eq('id', id)
  if (error) throw error
}

export function getPublicUrl(path: string) {
  const { data } = supabase.storage.from(VIDEOS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export type VideoRow = {
  id: string
  name: string
  description: string | null
  sequence: number
  storage_path: string
  size_bytes: number | null
  created_at: string
}
