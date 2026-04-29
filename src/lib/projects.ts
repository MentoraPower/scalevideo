import { supabase } from './supabase'

export type Project = {
  id: string
  name: string
  slug: string
  created_at: string
}

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

export function generateSlug(length = 10) {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[arr[i] % ALPHABET.length]
  return out
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Project[]
}

export async function createProject(name: string): Promise<Project> {
  const slug = generateSlug()
  const { data, error } = await supabase
    .from('projects')
    .insert({ name: name.trim(), slug })
    .select()
    .single()
  if (error) {
    const parts = [error.message, error.details, error.hint, error.code ? `(${error.code})` : '']
      .filter(Boolean)
      .join(' — ')
    throw new Error(parts || 'Erro desconhecido')
  }
  return data as Project
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data as Project) ?? null
}
