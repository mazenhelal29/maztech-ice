import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtime(table, onUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onUpdate()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [table])
}

export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const result = await fetchFn()
      setData(result || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, deps)

  return { data, loading, error, refetch: load }
}
