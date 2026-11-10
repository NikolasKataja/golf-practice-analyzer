import { getCsrfToken, getError } from './auth'

export type CsvPreview = {
    shotCount: number
    clubs: string[]
    shots: {
        shotNumber: number
        club: string
        carry: number
        carrySide: number
    }[]
}

export type ImportedPracticeSession = {
  id: number
  name: string
  practiceDate: string
  shotCount: number
}

async function postCsv<T>(path: string, formData: FormData): Promise<T> {
  const token = await getCsrfToken()

  const response = await fetch(`/api/practice-sessions/import${path}`, {
    method: 'POST',
    headers: { 'X-CSRF-Token': token },
    // Let the browser set Content-Type and the multipart boundary.
    body: formData,
  })

  if (response.status === 401) {
    throw new Error('Your session has expired. Sign in again to import a file.')
  }

  if (response.status === 413) {
    throw new Error('This file is too large. Choose a smaller CSV file.')
  }

  if (!response.ok) {
    throw new Error(await getError(response))
  }

  return response.json()
}

export function previewCsv(file: File): Promise<CsvPreview> {
  const formData = new FormData()
  formData.append('file', file)

  return postCsv<CsvPreview>('/preview', formData)
}

export function importCsv(
  file: File,
  name: string,
  practiceDate: string,
): Promise<ImportedPracticeSession> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name)
  formData.append('practiceDate', practiceDate)

  return postCsv<ImportedPracticeSession>('', formData)
}

export type PracticeSessionSummary = {
  id: number
  name: string
  practiceDate: string
  shotCount: number
}

export async function getPracticeSessions(
  signal?: AbortSignal,
): Promise<PracticeSessionSummary[]> {
  const response = await fetch('/api/practice-sessions', {
    signal,
    cache: 'no-store'
  })

  if (!response.ok) {
    throw new Error(await getError(response))
  }
  return response.json()
}
