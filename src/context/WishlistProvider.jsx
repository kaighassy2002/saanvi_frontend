import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { CUSTOMER_SESSION_CHANGED_EVENT, STORAGE_KEYS } from '../services/config'
import {
  getCustomerStorageScope,
  scopedWishlistKey,
} from '../services/customerStorageScope'
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

function wishlistReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return Array.isArray(action.payload) ? action.payload : []
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

  const [items, dispatch] = useReducer(wishlistReducer, [])

  useEffect(() => {
    const syncScope = () => setStorageScope(getCustomerStorageScope())
    window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncScope)
    window.addEventListener('storage', syncScope)
    return () => {
      window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, syncScope)
      window.removeEventListener('storage', syncScope)
    }
  }, [])

  useEffect(() => {
    dispatch({ type: 'HYDRATE', payload: readWishlistForScope(storageScope) })
  }, [storageScope])

  useEffect(() => {
    scopeRef.current = storageScope
  }, [storageScope])

  useEffect(() => {
    writeWishlist(scopeRef.current, items)
  }, [items])

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

  const value = useMemo(
    () => ({
      items,
      toggle,
      remove,
      isInWishlist,
      count: items.length,
    }),
    [items, toggle, remove, isInWishlist]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
