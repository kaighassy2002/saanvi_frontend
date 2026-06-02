import { useCallback, useLayoutEffect, useRef } from 'react'
import { USE_LOCAL_API } from './config'

/**
 * Guards localStorage writes and API sync so an empty initial reducer state
 * cannot wipe stored data before hydration (page refresh / scope change).
 */
export function useCustomerListPersistence(storageScope) {
  const skipNextLocalWriteRef = useRef(true)
  const serverSyncReadyRef = useRef(USE_LOCAL_API || storageScope === 'guest')

  useLayoutEffect(() => {
    skipNextLocalWriteRef.current = true
    serverSyncReadyRef.current = USE_LOCAL_API || storageScope === 'guest'
  }, [storageScope])

  const shouldWriteLocal = useCallback(() => {
    if (skipNextLocalWriteRef.current) {
      skipNextLocalWriteRef.current = false
      return false
    }
    return true
  }, [])

  const beginServerSync = useCallback(() => {
    if (USE_LOCAL_API || storageScope === 'guest') {
      serverSyncReadyRef.current = true
      return false
    }
    serverSyncReadyRef.current = false
    return true
  }, [storageScope])

  const endServerSync = useCallback(() => {
    serverSyncReadyRef.current = true
  }, [])

  const shouldSyncToServer = useCallback(() => {
    return !USE_LOCAL_API && storageScope !== 'guest' && serverSyncReadyRef.current
  }, [storageScope])

  return { shouldWriteLocal, beginServerSync, endServerSync, shouldSyncToServer }
}
