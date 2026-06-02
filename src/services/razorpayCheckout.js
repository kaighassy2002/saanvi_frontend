import { createRazorpayOrder, fetchRazorpayConfig, verifyRazorpayPayment } from './jewelleryApi'
import { PAYMENT_RAZORPAY } from './paymentMethods'

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

/** Razorpay Checkout — UPI, cards, netbanking; hide wallets/EMI. */
const RAZORPAY_CHECKOUT_OPTIONS = {
  method: {
    upi: true,
    card: true,
    netbanking: true,
    wallet: false,
    emi: false,
    paylater: false,
  },
}

export function loadRazorpayScript() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true)
  }
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = CHECKOUT_SCRIPT
    script.async = true
    script.onload = () => resolve(Boolean(window.Razorpay))
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * @param {{
 *   items: object[],
 *   total: number,
 *   shipping: object,
 *   paymentMethod: string,
 *   keyId?: string,
 *   storeName?: string,
 * }} params
 */
export async function payWithRazorpay({
  items,
  total,
  shipping,
  paymentMethod = PAYMENT_RAZORPAY,
  keyId: keyIdOverride,
  storeName = 'Aashmika Designs',
}) {
  const scriptOk = await loadRazorpayScript()
  if (!scriptOk || !window.Razorpay) {
    throw new Error('Could not load payment checkout. Check your connection and try again.')
  }

  const config = await fetchRazorpayConfig()
  if (!config?.enabled) {
    throw new Error('Online payment is not available. Choose Cash on Delivery or try later.')
  }

  const rpOrder = await createRazorpayOrder({ items, total })
  const keyId = keyIdOverride || rpOrder.keyId || config.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || ''
  if (!keyId) {
    throw new Error('Payment gateway key is missing. Contact the store.')
  }

  const customerName = `${shipping.firstName} ${shipping.lastName}`.trim()

  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      key: keyId,
      amount: rpOrder.amount,
      currency: rpOrder.currency || 'INR',
      name: storeName,
      description: 'Secure payment — UPI or card',
      order_id: rpOrder.razorpayOrderId,
      prefill: {
        name: customerName,
        email: shipping.email,
        contact: shipping.phone,
      },
      theme: { color: '#7a2c3a' },
      ...RAZORPAY_CHECKOUT_OPTIONS,
      handler: async (resp) => {
        try {
          const order = await verifyRazorpayPayment({
            razorpayOrderId: resp.razorpay_order_id,
            razorpayPaymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
            shipping,
            paymentMethod: PAYMENT_RAZORPAY,
            items,
            total,
          })
          resolve(order)
        } catch (err) {
          reject(err)
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled.')),
      },
    })
    rz.on('payment.failed', (resp) => {
      const reason =
        resp?.error?.description || resp?.error?.reason || 'Payment failed. Please try again.'
      reject(new Error(reason))
    })
    rz.open()
  })
}
