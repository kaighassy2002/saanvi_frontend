const COPY = {
  All: 'Explore our full handcrafted jewellery collection for every celebration.',
  Necklace: 'Elegant necklaces from delicate chains to statement temple pieces.',
  'Bridal Set': 'Complete bridal sets curated for your wedding day brilliance.',
  Earrings: 'Studs, jhumkas, and chandelier earrings for festive and daily wear.',
  Ring: 'Rings and bands crafted for engagements, gifts, and everyday grace.',
  Anklet: 'Traditional and contemporary anklets for festive occasions.',
  Matti: 'Classic matti designs for traditional South Indian celebrations.',
  'Nose Accessories': 'Nose pins and accessories to complete your festive look.',
  Bangles: 'Bangles and kadas in rich finishes for weddings and festivals.',
  Bracelets: 'Bracelets that pair beautifully with sarees and lehengas.',
  'Hair Accessories': 'Hair jewels and accessories for bridal and party styles.',
}

export function getCategoryBlurb(category) {
  if (!category || category === 'All') return COPY.All
  return COPY[category] || `Shop our ${category} collection — handcrafted for modern Indian elegance.`
}
