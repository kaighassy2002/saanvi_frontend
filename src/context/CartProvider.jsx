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
  getCustomerStorageScope,
  scopedCartKey,
} from '../services/customerStorageScope'
import { useCustomerListPersistence } from '../services/customerListPersistence'
import { customerGetCart, customerPutCart } from '../services/jewelleryApi'
import { cartLineKey, parseCartLineKey } from '../services/productVariants'
import { CartContext } from './cartContext'
import { useStoreSettings } from './storeSettingsContext'

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

function normalizeCartItems(input) {
  if (!Array.isArray(input)) return []
  return input
    .map((row) => {
      const productId = row?.productId
      const variantKey = String(row?.variantKey || row?.variantName || '').trim()
      const lineKey = String(row?.lineKey || '').trim() || cartLineKey(productId, variantKey)
      const parsed = parseCartLineKey(lineKey)
      return {
        lineKey,
        productId: parsed.productId || productId,
        variantName: parsed.variantKey || variantKey,
        variantKey: parsed.variantKey || variantKey,
        variantLabel: String(row?.variantLabel || '').trim(),
        name: String(row?.name || ''),
        image: String(row?.image || ''),
        price: Number(row?.price) || 0,
        quantity: Math.max(1, Number(row?.quantity) || 1),
        maxStock: Math.max(1, Number(row?.maxStock) || 9999),
      }
    })
    .filter((row) => row.productId !== undefined && row.productId !== null && row.lineKey)
}

function mergeCartItems(localItems, serverItems) {
  const map = new Map()
  for (const row of normalizeCartItems(serverItems)) {
    map.set(row.lineKey, row)
  }
  for (const row of normalizeCartItems(localItems)) {
    const key = row.lineKey
    const prev = map.get(key)
    if (!prev) {
      map.set(key, row)
      continue
    }
    map.set(key, {
      ...prev,
      quantity: Math.max(Number(prev.quantity) || 1, Number(row.quantity) || 1),
      maxStock: Math.max(Number(prev.maxStock) || 1, Number(row.maxStock) || 1),
      name: prev.name || row.name,
      image: prev.image || row.image,
      price: Number(prev.price) || Number(row.price) || 0,
      variantLabel: prev.variantLabel || row.variantLabel,
      variantName: prev.variantName || row.variantName,
    })
  }
  return [...map.values()]
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return normalizeCartItems(action.payload)
    case 'ADD': {
      const {
        productId,
        variantKey: payloadVariantKey = '',
        variantName: payloadVariantName = '',
        variantLabel = '',
        name,
        image,
        price,
        quantity,
        maxStock = 9999,
      } = action.payload
      const variantKey = String(payloadVariantKey || payloadVariantName || '').trim()
      const lineKey = cartLineKey(productId, variantKey)
      const idx = state.findIndex((i) => i.lineKey === lineKey)
      const current = idx >= 0 ? state[idx].quantity : 0
      const existingCap = idx >= 0 ? state[idx].maxStock : undefined
      const cap = Math.min(maxStock ?? 9999, existingCap ?? maxStock ?? 9999)
      const nextQty = Math.min(cap, current + quantity)
      if (nextQty <= 0) return state
      const line = {
        lineKey,
        productId,
        variantName: variantKey,
        variantKey,
        variantLabel: String(variantLabel || '').trim(),
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
      const { lineKey, quantity, maxStock: maxArg } = action.payload
      const line = state.find((i) => i.lineKey === lineKey)
      const cap = maxArg ?? line?.maxStock ?? 9999
      const q = Math.max(0, Math.min(cap, quantity))
      if (q === 0) return state.filter((i) => i.lineKey !== lineKey)
      return state.map((i) => (i.lineKey === lineKey ? { ...i, quantity: q } : i))
    }
    case 'REMOVE':
      return state.filter((i) => i.lineKey !== action.payload)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const { shippingFee, freeShippingThreshold } = useStoreSettings()
  const [storageScope, setStorageScope] = useState(() => getCustomerStorageScope())
  const scopeRef = useRef(storageScope)
  const persistence = useCustomerListPersistence(storageScope)

  const [items, dispatch] = useReducer(cartReducer, null, () =>
    normalizeCartItems(readCartForScope(getCustomerStorageScope()))
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
    dispatch({ type: 'HYDRATE', payload: readCartForScope(storageScope) })
  }, [storageScope])

  useEffect(() => {
    if (!persistence.shouldWriteLocal()) return
    writeCart(scopeRef.current, items)
  }, [items, persistence.shouldWriteLocal])

  useEffect(() => {
    let cancelled = false
    async function syncFromServer() {
      if (!persistence.beginServerSync()) return
      try {
        const serverItems = await customerGetCart()
        if (cancelled) return
        const guestItems = storageScope !== 'guest' ? readCartForScope('guest') : []
        const localItems = readCartForScope(storageScope)
        const merged = mergeCartItems(mergeCartItems(localItems, serverItems), guestItems)
        dispatch({ type: 'HYDRATE', payload: merged })
        writeCart(storageScope, merged)
        if (guestItems.length > 0) writeCart('guest', [])
        await customerPutCart(merged)
      } catch {
        // Keep local cart on transient sync failure.
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
    let active = true
    async function syncToServer() {
      try {
        await customerPutCart(items)
      } catch {
        if (!active) return
      }
    }
    syncToServer()
    return () => {
      active = false
    }
  }, [items, persistence.shouldSyncToServer])

  const addItem = useCallback((payload) => {
    dispatch({ type: 'ADD', payload })
  }, [])

  const setQuantity = useCallback((lineKey, quantity, maxStock) => {
    dispatch({ type: 'SET_QTY', payload: { lineKey, quantity, maxStock } })
  }, [])

  const removeItem = useCallback((lineKey) => {
    dispatch({ type: 'REMOVE', payload: lineKey })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const shipping =
      subtotal > 0 && subtotal < freeShippingThreshold ? shippingFee : 0
    const tax = 0
    return { subtotal, shipping, tax, total: subtotal + shipping + tax }
  }, [items, shippingFee, freeShippingThreshold])

  const totalQuantity = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const itemCount = items.length

  const value = useMemo(
    () => ({
      items,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      totals,
      totalQuantity,
      itemCount,
    }),
    [items, addItem, setQuantity, removeItem, clearCart, totals, totalQuantity, itemCount]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
