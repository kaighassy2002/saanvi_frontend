import React, { useCallback, useMemo, useState } from 'react'
import { CartDrawerContext } from './cartDrawerContext'
import CartDrawer from '../User_pages/Components/CartDrawer'

export function CartDrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  const openDrawer = useCallback(() => setIsOpen(true), [])
  const closeDrawer = useCallback(() => setIsOpen(false), [])
  const toggleDrawer = useCallback(() => setIsOpen((v) => !v), [])

  const value = useMemo(
    () => ({ isOpen, openDrawer, closeDrawer, toggleDrawer }),
    [isOpen, openDrawer, closeDrawer, toggleDrawer]
  )

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawer open={isOpen} onClose={closeDrawer} />
    </CartDrawerContext.Provider>
  )
}
