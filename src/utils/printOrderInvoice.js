/** Opens browser print dialog with invoice-only layout (save as PDF). */
export function printOrderInvoice(orderId) {
  if (!orderId) return
  const prev = document.title
  document.title = `Invoice-${orderId}`
  const restore = () => {
    document.title = prev
  }
  window.addEventListener('afterprint', restore, { once: true })
  window.print()
  setTimeout(restore, 2000)
}
