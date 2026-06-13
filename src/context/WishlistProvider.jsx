import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { CUSTOMER_SESSION_CHANGED_EVENT, STORAGE_KEYS, USE_LOCAL_API } from '../services/config'
import {
  clearExpiredCustomerSession,
  getCustomerStorageScope,
  scopedWishlistKey,
} from '../services/customerStorageScope'
import { useCustomerListPersistence } from '../services/customerListPersistence'
import { customerGetWishlist, customerPutWishlist } from '../services/jewelleryApi'
import { WishlistContext } from './wishlistContext'

function parseList(raw) {
  try {
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readWishlistForScope(scope) {
  const key = scopedWishlistKey(scope)
  let data = parseList(localStorage.getItem(key))
  if (data.length === 0 && scope === 'guest') {
    const legacy = localStorage.getItem(STORAGE_KEYS.shopWishlist)
    if (legacy) {
      const migrated = parseList(legacy)
      if (migrated.length > 0) {
        localStorage.setItem(key, JSON.stringify(migrated))
        data = migrated
      }
    }
  }
  return data
}

function writeWishlist(scope, items) {
  localStorage.setItem(scopedWishlistKey(scope), JSON.stringify(items))
}

function normalizeWishlistItems(input) {
  if (!Array.isArray(input)) return []
  return input
    .map((row) => ({
      productId: row?.productId,
      name: String(row?.name || ''),
      image: String(row?.image || ''),
      category: String(row?.category || ''),
      price: Number(row?.price) || 0,
    }))
    .filter((row) => row.productId !== undefined && row.productId !== null)
}

function mergeWishlist(localItems, serverItems) {
  const map = new Map()
  for (const row of normalizeWishlistItems(serverItems)) {
    map.set(String(row.productId), row)
  }
  for (const row of normalizeWishlistItems(localItems)) {
    const key = String(row.productId)
    if (!map.has(key)) map.set(key, row)
  }
  return [...map.values()]
}

function wishlistReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return normalizeWishlistItems(action.payload)
    case 'TOGGLE': {
      const row = action.payload
      const pid = row.productId
      const exists = state.some((i) => i.productId === pid)
      if (exists) return state.filter((i) => i.productId !== pid)
      return [...state, row]
    }
    case 'REMOVE':
      return state.filter((i) => i.productId !== action.payload)
    default:
      return state
  }
}

export function WishlistProvider({ children }) {
  const [storageScope, setStorageScope] = useState(() => getCustomerStorageScope())
  const scopeRef = useRef(storageScope)
  const persistence = useCustomerListPersistence(storageScope)

  const [items, dispatch] = useReducer(wishlistReducer, null, () =>
    normalizeWishlistItems(readWishlistForScope(getCustomerStorageScope()))
  )

  useEffect(() => {
    const syncScope = () => setStorageScope(getCustomerStorageScope())
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncScope)
    window.addEventListener('storage', syncScope)
    return () => {
      window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncScope)
      window.removeEventListener('storage', syncScope)
    }
  }, [])

  useLayoutEffect(() => {
    scopeRef.current = storageScope
    dispatch({ type: 'HYDRATE', payload: readWishlistForScope(storageScope) })
  }, [storageScope])

  useEffect(() => {
    if (!persistence.shouldWriteLocal()) return
    writeWishlist(scopeRef.current, items)
  }, [items, persistence.shouldWriteLocal])

  useEffect(() => {
    let cancelled = false
    async function syncFromServer() {
      if (!persistence.beginServerSync()) return
      try {
        const serverItems = await customerGetWishlist()
        if (cancelled) return
        const guestItems = storageScope !== 'guest' ? readWishlistForScope('guest') : []
        const localItems = readWishlistForScope(storageScope)
        const merged = mergeWishlist(mergeWishlist(localItems, serverItems), guestItems)
        dispatch({ type: 'HYDRATE', payload: merged })
        writeWishlist(storageScope, merged)
        if (guestItems.length > 0) writeWishlist('guest', [])
        await customerPutWishlist(merged)
      } catch (err) {
        if (clearExpiredCustomerSession(err)) return
        // Keep local wishlist when sync fails.
      } finally {
        if (!cancelled) persistence.endServerSync()
      }
    }
    syncFromServer()
    return () => {
      cancelled = true
    }
  }, [storageScope, persistence.beginServerSync, persistence.endServerSync])

  useEffect(() => {
    if (!persistence.shouldSyncToServer()) return
    async function syncToServer() {
      try {
        await customerPutWishlist(items)
      } catch (err) {
        clearExpiredCustomerSession(err)
      }
    }
    syncToServer()
  }, [items, persistence.shouldSyncToServer])

  const toggle = useCallback((row) => {
    dispatch({ type: 'TOGGLE', payload: row })
  }, [])

  const remove = useCallback((productId) => {
    dispatch({ type: 'REMOVE', payload: productId })
  }, [])

  const isInWishlist = useCallback(
    (productId) => items.some((i) => i.productId === Number(productId) || i.productId === productId),
    [items]
  )

  const itemCount = useMemo(
    () => new Set(items.map((i) => String(i.productId))).size,
    [items]
  )

  const value = useMemo(
    () => ({
      items,
      toggle,
      remove,
      isInWishlist,
      count: itemCount,
      itemCount,
    }),
    [items, toggle, remove, isInWishlist, itemCount]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
