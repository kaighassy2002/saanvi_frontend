const EMPTY_SPECS = { material: '', color: '', weight: '', length: '', certification: '' }

export function productToForm(product) {
  if (!product) {
    return {
      name: '',
      category: '',
      price: '',
      originalPrice: '',
      images: [],
      description: '',
      material: '',
      color: '',
      weight: '',
      length: '',
      certification: '',
      stock: '10',
      published: true,
    }
  }
  const specs = product.specifications || EMPTY_SPECS
  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? [...product.images]
      : product.image
        ? [product.image]
        : []
  return {
    name: product.name || '',
    category: product.category || '',
    price: String(product.price ?? ''),
    originalPrice: product.originalPrice ? String(product.originalPrice) : '',
    images,
    description: product.description || '',
    material: specs.material || '',
    color: specs.color || '',
    weight: specs.weight || '',
    length: specs.length || '',
    certification: specs.certification || '',
    stock: String(product.stock ?? 10),
    published: product.published !== false,
  }
}

export function validateProductForm(form) {
  const errors = {}
  if (!String(form.name || '').trim()) errors.name = 'Name is required'
  if (!String(form.category || '').trim()) errors.category = 'Category is required'
  const price = Number(form.price)
  if (!Number.isFinite(price) || price < 0) errors.price = 'Valid price is required'
  const images = Array.isArray(form.images) ? form.images.filter(Boolean) : []
  if (images.length === 0) errors.images = 'Add at least one product image'
  const stock = Number(form.stock)
  if (!Number.isFinite(stock) || stock < 0) errors.stock = 'Valid stock is required'
  return errors
}

export function formToApiBody(form) {
  const specs = {
    material: String(form.material || '').trim(),
    color: String(form.color || '').trim(),
    weight: String(form.weight || '').trim(),
    length: String(form.length || '').trim(),
    certification: String(form.certification || '').trim(),
  }
  const images = (Array.isArray(form.images) ? form.images : [])
    .map((u) => String(u || '').trim())
    .filter(Boolean)
  const body = {
    name: String(form.name || '').trim(),
    category: String(form.category || '').trim(),
    price: Number(form.price),
    images,
    description: String(form.description || '').trim(),
    specifications: specs,
    stock: Number(form.stock),
    published: !!form.published,
  }
  const orig = Number(form.originalPrice)
  if (Number.isFinite(orig) && orig > 0) body.originalPrice = orig
  return body
}
