import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { CUSTOMER_SESSION_CHANGED_EVENT, STORAGE_KEYS } from '../services/config'
import {
  getCustomerStorageScope,
  scopedCartKey,
} from '../services/customerStorageScope'
import { CartContext } from './cartContext'

function parseCart(raw) {
  try {
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readCartForScope(scope) {
  const key = scopedCartKey(scope)
  let data = parseCart(localStorage.getItem(key))
  if (data.length === 0 && scope === 'guest') {
    const legacy = localStorage.getItem(STORAGE_KEYS.shopCart)
    if (legacy) {
      const migrated = parseCart(legacy)
      if (migrated.length > 0) {
        localStorage.setItem(key, JSON.stringify(migrated))
        data = migrated
      }
    }
  }
  return data
}

function writeCart(scope, items) {
  localStorage.setItem(scopedCartKey(scope), JSON.stringify(items))
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return Array.isArray(action.payload) ? action.payload : []
    case 'ADD': {
      const { productId, name, image, price, quantity, maxStock = 9999 } = action.payload
      const idx = state.findIndex((i) => i.productId === productId)
      const current = idx >= 0 ? state[idx].quantity : 0
      const existingCap = idx >= 0 ? state[idx].maxStock : undefined
      const cap = Math.min(maxStock ?? 9999, existingCap ?? maxStock ?? 9999)
      const nextQty = Math.min(cap, current + quantity)
      if (nextQty <= 0) return state
      const line = {
        productId,
        name,
        image,
        price: Number(price),
        quantity: nextQty,
        maxStock: cap,
      }
      if (idx >= 0) {
        const next = [...state]
        next[idx] = line
        return next
      }
      return [...state, line]
    }
    case 'SET_QTY': {
      const { productId, quantity, maxStock: maxArg } = action.payload
      const line = state.find((i) => i.productId === productId)
      const cap = maxArg ?? line?.maxStock ?? 9999
      const q = Math.max(0, Math.min(cap, quantity))
      if (q === 0) return state.filter((i) => i.productId !== productId)
      return state.map((i) => (i.productId === productId ? { ...i, quantity: q } : i))
    }
    case 'REMOVE':
      return state.filter((i) => i.productId !== action.payload)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [storageScope, setStorageScope] = useState(() => getCustomerStorageScope())
  const scopeRef = useRef(storageScope)

  const [items, dispatch] = useReducer(cartReducer, [])

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
    dispatch({ type: 'HYDRATE', payload: readCartForScope(storageScope) })
  }, [storageScope])

  useEffect(() => {
    scopeRef.current = storageScope
  }, [storageScope])

  useEffect(() => {
    writeCart(scopeRef.current, items)
  }, [items])

  const addItem = useCallback((payload) => {
    dispatch({ type: 'ADD', payload })
  }, [])

  const setQuantity = useCallback((productId, quantity, maxStock) => {
    dispatch({ type: 'SET_QTY', payload: { productId, quantity, maxStock } })
  }, [])

  const removeItem = useCallback((productId) => {
    dispatch({ type: 'REMOVE', payload: productId })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const shipping = subtotal > 0 ? 0 : 0
    const tax = 0
    return { subtotal, shipping, tax, total: subtotal + shipping + tax }
  }, [items])

  const totalQuantity = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  const value = useMemo(
    () => ({
      items,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      totals,
      totalQuantity,
    }),
    [items, addItem, setQuantity, removeItem, clearCart, totals, totalQuantity]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
