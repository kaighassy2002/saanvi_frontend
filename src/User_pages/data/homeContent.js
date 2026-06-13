export const HOME_HERO_SLIDES = [
  {
    tag: 'Best of the best',
    title: 'Gold Earrings For Women',
    subtitle: 'Designer jewellery — necklaces, bracelets & earrings',
    image: 'https://i.pinimg.com/1200x/17/79/74/1779744cf8b937e59ccea81ffd894833.jpg',
    link: '/collections?category=Earrings',
  },
  {
    tag: 'New collection',
    title: 'Bridal Sets That Dazzle',
    subtitle: 'Temple work and wedding-day brilliance',
    image: 'https://i.pinimg.com/1200x/15/01/56/150156ac3ced91e62c6d30b5cf2f4d1b.jpg',
    link: '/collections?category=Bridal%20Set',
  },
  {
    tag: 'Festive edit',
    title: 'Statement Necklaces',
    subtitle: 'Layered elegance for every celebration',
    image: 'https://i.pinimg.com/1200x/37/71/51/3771511e2d33eceb2b37b5c66d993071.jpg',
    link: '/collections?category=Necklace',
  },
]

export const HOME_PROMO_BANNERS = [
  {
    label: 'Flat 30% off',
    title: 'Glowing gold rings',
    image: 'https://i.pinimg.com/1200x/d2/aa/29/d2aa29e9c7f78ff33efec124ca243814.jpg',
    link: '/collections?category=Ring',
    buttonText: 'Shop now',
  },
  {
    label: 'Special offers',
    title: 'Women gold bracelet',
    image: 'https://i.pinimg.com/1200x/61/8e/86/618e86914fcb22d4ef7199e0874ca8b6.jpg',
    link: '/collections?category=Bracelets',
    buttonText: 'Shop now',
  },
  {
    label: 'Flat 20% off',
    title: 'Trendy bridal sets',
    image: 'https://i.pinimg.com/1200x/736x/05/cb/2a/05cb2a824fa78fffe6e2203d5454fd56.jpg',
    link: '/collections?category=Bridal%20Set',
    buttonText: 'Shop now',
  },
]

export const HOME_SERVICES = [
  { icon: 'fa-paper-plane', title: 'Free Shipping', text: 'On orders over {{threshold}}' },
  { icon: 'fa-arrow-rotate-left', title: 'Easy Returns', text: '7-day returns' },
  { icon: 'fa-wallet', title: 'Secure Pay', text: 'COD available' },
  { icon: 'fa-headset', title: 'Support', text: 'WhatsApp help' },
]

export const DEFAULT_HOME_SECTIONS = {
  serviceBarStrip: 'Complimentary shipping over {{threshold}} - trusted quality guaranteed',
  promo: { overline: 'Curated offers', title: 'Signature savings' },
  trending: {
    overline: 'Most loved picks',
    title: 'Trending Products',
    viewAllLabel: 'View all products',
    tabs: [
      { id: 'featured', label: 'Featured' },
      { id: 'new', label: 'New Arrivals' },
      { id: 'bestseller', label: 'Best Seller' },
    ],
  },
  categories: {
    overline: 'Shop by mood',
    title: 'Popular Categories',
    buttonLabel: 'Shop all categories',
    buttonLink: '/collections',
  },
  mobilePromos: { title: 'Offers for you', linkLabel: 'See all', linkUrl: '/collections' },
  mobileTrending: { title: 'Trending now', linkLabel: 'View all' },
  mobileCategories: {
    title: 'Shop by category',
    linkLabel: 'All',
    linkUrl: '/collections',
    ctaTitle: 'Discover handcrafted jewellery',
    ctaText: 'Bridal, festive, and everyday pieces curated for you.',
    ctaButtonLabel: 'Explore collections',
    ctaButtonLink: '/collections',
  },
  mobileQuickShop: {
    searchPlaceholder: 'Search necklaces, rings, bridal sets…',
    chips: [{ label: 'New arrivals', link: '/collections?sort=latest', highlight: true }],
  },
}
