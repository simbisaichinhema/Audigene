import type { SonificationRequest, SonificationTimeline, CompareRequest, CompareResponse } from '../types'

const API_BASE = '/api'

export async function fetchSonification(
  sequence: string,
  method: string,
): Promise<SonificationTimeline> {
  const body: SonificationRequest = { sequence, method }
  const res = await fetch(`${API_BASE}/sonification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function fetchCompare(
  reference: string,
  sample: string,
  method: string,
): Promise<CompareResponse> {
  const body: CompareRequest = { reference, sample, method }
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}
