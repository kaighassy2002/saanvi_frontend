import { test, expect } from '@playwright/test'

const STORE_SLUG = 'e2e-test-store'

test('authenticated checkout page shows order placement UI', async ({ page }) => {
  await page.addInitScript((slug) => {
    const demoToken = 'local-demo-token'
    const profile = {
      id: 'e2e-user',
      email: 'e2e@example.com',
      firstName: 'E2E',
      lastName: 'Tester',
      name: 'E2E Tester',
    }
    const cartKey = `${slug}_shop_cart::__scope_guest`
    const tokenKey = `${slug}_customer_token`
    const profileKey = `${slug}_customer_profile`
    localStorage.setItem(tokenKey, demoToken)
    localStorage.setItem(profileKey, JSON.stringify(profile))
    localStorage.setItem(
      cartKey,
      JSON.stringify([
        {
          productId: 'demo-product-1',
          name: 'E2E Gold Ring',
          price: 1999,
          quantity: 1,
          image: '',
        },
      ])
    )
  }, STORE_SLUG)

  await page.goto('/checkout')

  await expect(page.getByRole('heading', { name: /complete your order/i })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('button', { name: /place order/i })).toBeVisible()
})
