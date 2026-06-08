import {
  matrixFormToVariants,
  matrixHasContent,
  parseSizesInput,
  totalMatrixStock,
  variantsToMatrixForm,
} from '../../services/variantMatrixForm'

const EMPTY_SPECS = { material: '', color: '', weight: '', length: '', certification: '' }
const EMPTY_SHIPPING = { weight: '', length: '', width: '', height: '', unit: 'cm', freeShipping: false }
function formatPublishAtInput(raw) {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function productToForm(product) {
  if (!product) {
    return {
      name: '',
      sku: '',
      category: '',
      subcategory: '',
      tags: '',
      price: '',
      originalPrice: '',
      stock: '10',
      lowStockThreshold: '5',
      published: true,
      featured: false,
      imagesMeta: [],
      description: '',
      shortDescription: '',
      material: '',
      color: '',
      weight: '',
      length: '',
      sizeOptions: '',
      dimensionsLength: '',
      dimensionsWidth: '',
      dimensionsHeight: '',
      dimensionsUnit: 'mm',
      customAttributes: [],
      hasVariants: false,
      hasColorVariants: false,
      variantSizes: '',
      colorMatrix: [],
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      shippingWeight: '',
      shippingLength: '',
      shippingWidth: '',
      shippingHeight: '',
      shippingUnit: 'cm',
      freeShipping: false,
      sizeChartId: '',
      publishAt: '',
    }
  }

  const specs = product.specifications || EMPTY_SPECS
  const ship = product.shipping || EMPTY_SHIPPING
  const imagesMeta =
    Array.isArray(product.imagesMeta) && product.imagesMeta.length > 0
      ? product.imagesMeta
          .map((m) => ({
            url: String(m?.url || '').trim(),
            alt: String(m?.alt || '').trim(),
          }))
          .filter((m) => m.url)
      : []
  const imageUrls =
    imagesMeta.length > 0
      ? imagesMeta.map((m) => m.url)
      : Array.isArray(product.images) && product.images.length > 0
        ? [...product.images]
        : product.image
          ? [product.image]
          : []

  const matrix = variantsToMatrixForm(product.variants, product.sizeOptions)

  return {
    name: product.name || '',
    sku: product.sku || '',
    category: product.category || '',
    subcategory: product.subcategory || '',
    tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
    price: String(product.price ?? ''),
    originalPrice: product.originalPrice ? String(product.originalPrice) : '',
    stock: String(product.stock ?? 10),
    lowStockThreshold: String(product.lowStockThreshold ?? 5),
    published: product.published !== false,
    featured: !!product.featured,
    imagesMeta:
      imagesMeta.length > 0 ? imagesMeta : imageUrls.map((url) => ({ url, alt: '' })),
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    material: specs.material || product.material || '',
    color: specs.color || '',
    weight: specs.weight || product.weight || '',
    length: specs.length || '',
    sizeOptions: matrix.hasVariants ? '' : Array.isArray(product.sizeOptions) ? product.sizeOptions.join(', ') : '',
    dimensionsLength: product.dimensions?.length || '',
    dimensionsWidth: product.dimensions?.width || '',
    dimensionsHeight: product.dimensions?.height || '',
    dimensionsUnit: product.dimensions?.unit || 'mm',
    customAttributes: Array.isArray(product.customAttributes)
      ? product.customAttributes.map((x) => ({
          key: String(x?.key || ''),
          value: String(x?.value || ''),
        }))
      : [],
    hasVariants: matrix.hasVariants,
    hasColorVariants: matrix.hasVariants,
    variantSizes: matrix.variantSizes,
    colorMatrix: matrix.colorMatrix,
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || '',
    seoKeywords: Array.isArray(product.seoKeywords)
      ? product.seoKeywords.join(', ')
      : product.seoKeywords || '',
    shippingWeight: ship.weight || '',
    shippingLength: ship.length || '',
    shippingWidth: ship.width || '',
    shippingHeight: ship.height || '',
    shippingUnit: ship.unit || 'cm',
    freeShipping: !!ship.freeShipping,
    sizeChartId: String(product.sizeChartId || '').trim(),
    publishAt: formatPublishAtInput(product.publishAt),
  }
}

export function validateProductForm(form) {
  const errors = {}
  if (!String(form.name || '').trim()) errors.name = 'Product name is required'
  if (!String(form.category || '').trim()) errors.category = 'Category is required'
  const price = Number(form.price)
  if (!Number.isFinite(price) || price < 0) errors.price = 'Valid selling price is required'
  const orig = Number(form.originalPrice)
  if (form.originalPrice !== '' && form.originalPrice != null) {
    if (!Number.isFinite(orig) || orig < 0) {
      errors.originalPrice = 'Original price must be a valid number'
    } else if (orig > 0 && orig <= price) {
      errors.originalPrice = 'Original price should be higher than selling price to show a discount'
    }
  }

  const hasVariants = !!form.hasVariants
  const images = Array.isArray(form.imagesMeta) ? form.imagesMeta.filter((m) => m?.url) : []
  if (!hasVariants && images.length === 0) errors.images = 'Add at least one product image'

  const stock = Number(form.stock)
  if (!hasVariants && (!Number.isFinite(stock) || stock < 0)) {
    errors.stock = 'Valid stock quantity is required'
  }

  if (hasVariants) {
    if (!matrixHasContent(form)) {
      errors.variants = 'Add at least one colour variant.'
    }
    const sizes = parseSizesInput(form.variantSizes)
    const colors = Array.isArray(form.colorMatrix) ? form.colorMatrix : []
    const colorNames = new Set()

    colors.forEach((row, colorIndex) => {
      const colorName = String(row?.colorName || '').trim()
      if (!colorName) {
        if (Object.values(row?.stocks || {}).some((v) => String(v).trim() !== '')) {
          errors[`color-${colorIndex}`] = 'Colour name is required'
        }
        return
      }
      const key = colorName.toLowerCase()
      if (colorNames.has(key)) {
        errors[`color-${colorIndex}`] = 'Duplicate colour name'
        return
      }
      colorNames.add(key)

      const imgs = (Array.isArray(row.imagesMeta) ? row.imagesMeta : []).filter((m) => m?.url)
      if (imgs.length === 0) {
        errors[`color-images-${colorIndex}`] = 'Upload at least one image for this colour'
      }

      const stocks = row?.stocks || {}
      let hasStock = false
      if (sizes.length === 0) {
        const n = Number(stocks[''])
        if (Number.isFinite(n) && n > 0) hasStock = true
      } else {
        for (const size of sizes) {
          const n = Number(stocks[size])
          if (Number.isFinite(n) && n < 0) {
            errors[`color-${colorIndex}-size-${size}`] = 'Invalid stock'
          }
          if (Number.isFinite(n) && n > 0) hasStock = true
        }
      }
      if (!hasStock) {
        errors[`color-${colorIndex}`] = errors[`color-${colorIndex}`] || 'Enter stock for at least one size'
      }
    })

    if (totalMatrixStock(form) <= 0) {
      errors.variants = errors.variants || 'Total variant stock must be greater than zero.'
    }

    const first = colors[0]
    if (first && String(first.colorName || '').trim()) {
      const firstImgs = (Array.isArray(first.imagesMeta) ? first.imagesMeta : []).filter((m) => m?.url)
      if (firstImgs.length === 0) {
        errors['color-images-0'] =
          errors['color-images-0'] || 'First colour needs images (shop listing thumbnail).'
      }
    }
  }

  return errors
}

export function formToApiBody(form) {
  const material = String(form.material || '').trim()
  const weight = String(form.weight || '').trim()
  const hasVariants = !!form.hasVariants
  const specs = {
    material,
    color: hasVariants ? '' : String(form.color || '').trim(),
    weight,
    length: String(form.length || '').trim(),
    certification: '',
  }

  let imagesMeta = (Array.isArray(form.imagesMeta) ? form.imagesMeta : [])
    .map((m) => ({
      url: String(m?.url || '').trim(),
      alt: String(m?.alt || '').trim(),
    }))
    .filter((m) => m.url)

  const dimensions = {
    length: String(form.dimensionsLength || '').trim(),
    width: String(form.dimensionsWidth || '').trim(),
    height: String(form.dimensionsHeight || '').trim(),
    unit: String(form.dimensionsUnit || 'mm').trim() || 'mm',
  }

  const customAttributes = (Array.isArray(form.customAttributes) ? form.customAttributes : [])
    .map((x) => ({
      key: String(x?.key || '').trim(),
      value: String(x?.value || '').trim(),
    }))
    .filter((x) => x.key && x.value)

  const variants = hasVariants ? matrixFormToVariants(form) : []
  const sizeOptions = hasVariants
    ? parseSizesInput(form.variantSizes)
    : String(form.sizeOptions || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)

  if (hasVariants && variants.length > 0) {
    const primaryUrls = variants[0].images || []
    const firstRow = Array.isArray(form.colorMatrix) ? form.colorMatrix[0] : null
    const primaryMeta = (Array.isArray(firstRow?.imagesMeta) ? firstRow.imagesMeta : []).filter((m) => m?.url)
    if (primaryUrls.length > 0) {
      imagesMeta = primaryUrls.map((url) => {
        const prev = primaryMeta.find((m) => m.url === url)
        return { url, alt: prev?.alt || '' }
      })
    }
  }

  const images = imagesMeta.map((m) => m.url)
  const matrixStock = hasVariants ? totalMatrixStock(form) : null

  const tags = String(form.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const seoKeywords = String(form.seoKeywords || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const body = {
    name: String(form.name || '').trim(),
    sku: String(form.sku || '').trim(),
    category: String(form.category || '').trim(),
    subcategory: String(form.subcategory || '').trim(),
    tags,
    price: Number(form.price),
    useMakingChargePricing: false,
    metalValue: 0,
    makingCharge: 0,
    discountType: 'none',
    discountValue: 0,
    images,
    imagesMeta,
    description: String(form.description || '').trim(),
    shortDescription: String(form.shortDescription || '').trim(),
    specifications: specs,
    material,
    weight,
    sizeOptions,
    dimensions,
    customAttributes,
    variants,
    stock: matrixStock != null ? matrixStock : Number(form.stock),
    lowStockThreshold: Number(form.lowStockThreshold) || 5,
    published: !!form.published,
    featured: !!form.featured,
    publishAt: String(form.publishAt || '').trim() || null,
    sizeChartId: String(form.sizeChartId || '').trim(),
    certification: {
      bisHallmark: false,
      bisLicense: '',
      diamondCertUrl: '',
      diamondCertNumber: '',
    },
    seoTitle: String(form.seoTitle || '').trim(),
    seoDescription: String(form.seoDescription || '').trim(),
    seoKeywords,
    shipping: {
      weight: String(form.shippingWeight || '').trim(),
      length: String(form.shippingLength || '').trim(),
      width: String(form.shippingWidth || '').trim(),
      height: String(form.shippingHeight || '').trim(),
      unit: String(form.shippingUnit || 'cm').trim() || 'cm',
      freeShipping: !!form.freeShipping,
    },
  }
  const orig = Number(form.originalPrice)
  if (Number.isFinite(orig) && orig > 0) body.originalPrice = orig
  return body
}
