import { useCallback, useState } from 'react'
import { DB } from '../data/types'
import { askAI, AIRequest } from '../ai/client'
import { AIResult } from '../ai/fallback'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'ai' | 'local'>('ai')

  const run = useCallback(async (db: DB, req: AIRequest): Promise<AIResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const { result, source: src, error: err } = await askAI(db, req)
      setSource(src)
      if (err) setError(err)
      return result
    } catch {
      setError('Something went wrong while analysing. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, source, run }
}