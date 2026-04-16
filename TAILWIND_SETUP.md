# Tailwind CSS Setup Instructions

## Step 1: Install Dependencies

Run this command in your terminal (in the `jewellery_frontend` directory):

```bash
npm install -D tailwindcss postcss autoprefixer
```

## Step 2: Initialize Tailwind (Optional - files already created)

If you need to regenerate the config files:

```bash
npx tailwindcss init -p
```

## Step 3: Verify Configuration

The following files have been created/updated:
- ✅ `tailwind.config.js` - Tailwind configuration with custom colors and fonts
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `src/index.css` - Updated with Tailwind directives

## Step 4: Start Development Server

```bash
npm run dev
```

## Custom Theme Extensions

The Tailwind config includes:
- **Custom Colors**: `gold`, `gold-light`, `gold-dark`, `beige`, `beige-dark`
- **Custom Fonts**: `font-bodoni` (Bodoni Moda), `font-playfair` (Playfair Display)
- **Custom Animations**: `animate-marquee`, `animate-sparkle`, `animate-fadeInUp`

## Usage Examples

```jsx
// Colors
<div className="bg-gold text-black">Gold background</div>
<div className="text-gold-light">Light gold text</div>

// Fonts
<h1 className="font-bodoni text-4xl">Bodoni Font</h1>
<p className="font-playfair">Playfair Font</p>

// Animations
<div className="animate-fadeInUp">Fade in animation</div>
```

## Next Steps

After installation, provide the components you want to convert:
- Home.jsx
- Category.jsx
- Footer.jsx
- NewArrivals.jsx
- etc.


