# Neural:IO Labs Website

A professional, investor-ready landing page for Neural:IO Labs.

## Quick Start

### Local Development
Simply open `index.html` in a browser, or use a local server:

```bash
# Python 3
python -m http.server 8080

# Then visit: http://localhost:8080
```

### Deploy to Netlify via GitHub

1. **Push to GitHub:**
   ```bash
   cd website
   git init
   git add .
   git commit -m "Initial website"
   git remote add origin https://github.com/Neural-IO-Labs/neuralio-website.git
   git push -u origin main
   ```

2. **Connect Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select GitHub → Neural-IO-Labs/neuralio-website
   - Deploy settings:
     - Branch: `main`
     - Build command: *(leave empty)*
     - Publish directory: `.`
   - Click Deploy

3. **Custom Domain (Optional):**
   - Site settings → Domain management → Add custom domain
   - Point DNS to Netlify nameservers

## File Structure

```
website/
├── index.html          # Main landing page
├── css/
│   └── style.css       # All styles (responsive)
├── js/
│   └── main.js         # Interactive functionality
├── assets/
│   └── logo.png        # Brand logo
└── README.md           # This file
```

## Features

- ✅ Fully responsive (mobile-first)
- ✅ Dark theme with glassmorphism
- ✅ SEO optimized (meta tags, Open Graph)
- ✅ Contact modal with copy-to-clipboard
- ✅ Smooth scroll navigation
- ✅ Animated terminal demo
- ✅ No build step required (pure HTML/CSS/JS)

## Customization

### Update Contact Email
Edit in `index.html`:
```html
<code id="contactEmail">your-email@domain.com</code>
```

### Change Logo
Replace `assets/logo.png` with your own (recommended: 80x80px PNG with transparency)

### Modify Colors
Edit CSS variables in `css/style.css`:
```css
:root {
    --color-cyan: #00F2FF;
    --color-bg: #050507;
    /* ... */
}
```

## License

© 2026 Neural:IO Labs Oy. All rights reserved.
