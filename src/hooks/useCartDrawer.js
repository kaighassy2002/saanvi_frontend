import { useContext } from 'react'
import { CartDrawerContext } from '../context/cartDrawerContext'

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext)
  if (!ctx) {
    throw new Error('useCartDrawer must be used within CartDrawerProvider')
  }
  return ctx
}
