import { useSyncExternalStore } from 'react'

let selectedChildId: string | null = null
const listeners = new Set<() => void>()

export function getSelectedChildId(): string | null {
  return selectedChildId
}

export function setSelectedChildId(id: string | null) {
  selectedChildId = id
  listeners.forEach((l) => l())
}

export function useSelectedChildId(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => selectedChildId,
    () => null
  )
}