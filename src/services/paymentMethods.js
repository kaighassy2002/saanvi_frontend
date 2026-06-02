/** Checkout value for Razorpay (UPI + card + netbanking in one popup). */
export const PAYMENT_RAZORPAY = 'razorpay'
export const PAYMENT_COD = 'cod'

export function isRazorpayCheckoutMethod(method) {
  const key = String(method || '').trim().toLowerCase()
  return key === PAYMENT_RAZORPAY || key === 'upi' || key === 'card' || key === 'online'
}
