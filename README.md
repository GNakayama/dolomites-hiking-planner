# Dolomites Alta Via 1 – Hiking Planner

A static web application for planning hiking itineraries along the Dolomites Alta Via 1. Built with pure JavaScript and Chakra UI (via CDN) – no build tools, no backend, just clean, maintainable code.

## Overview

This is the first version of a hiking planner focused on the Alta Via 1, a classic north–south traverse through the Dolomites. The application is intentionally static and simple, making it easy to iterate on structure, stages, and constraints before adding any backend or API calls.

### Current Features

- **Static shell**: Clean two-column layout with route overview and trip snapshot panels
- **Pure JavaScript**: No frameworks, no bundlers – just vanilla JS modules
- **Chakra UI via CDN**: Modern UI components without build tooling
- **Maintainable structure**: Well-organized code that's easy to read and extend

### Planned Features

- Stage-by-stage itinerary planning
- Distance and elevation calculations
- Hut/reservation tracking
- Trip constraints and preferences
- Export/print functionality

## Project Structure

```
dolomites-hiking-planner/
├── index.html              # Main HTML entry point
├── styles.css              # Global styles and utility classes
├── .nojekyll               # Prevents Jekyll processing on GitHub Pages
├── package.json            # Node.js dependencies (for testing)
├── vitest.config.js        # Vitest test configuration
├── src/
│   ├── app.js              # Main application logic (orchestrator)
│   ├── data/
│   │   ├── alta-via-1.js       # Stage data and constants
│   │   ├── hut-booking-links.js # Hut booking URLs and links
│   │   └── hut-details.js       # Detailed hut information
│   └── utils/
│       ├── route-generator.js  # Route combination generation
│       ├── filters.js          # Filtering logic
│       └── date-helpers.js     # Date formatting and itinerary building
├── tests/
│   ├── route-generator.test.js
│   ├── filters.test.js
│   ├── date-helpers.test.js
│   └── integration.test.js
└── README.md               # This file
```

The codebase is structured to be easily readable and maintainable. Business logic is separated into testable modules, while the main `app.js` orchestrates the UI and user interactions.

## Running Locally

Since this is a static application, you can run it in several ways:

### Option 1: Direct File Opening (Simplest)

Simply open `index.html` in your web browser:

```bash
# On Linux/Mac
open index.html
# or
xdg-open index.html

# On Windows
start index.html
```

**Note**: Some browsers may have restrictions on loading ES modules from `file://` URLs. If you encounter issues, use one of the server options below.

### Option 2: Python HTTP Server (Recommended for Development)

If you have Python installed, you can start a simple HTTP server:

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 3: Node.js http-server

If you have Node.js installed, you can use the `http-server` package:

```bash
# Install globally (one time)
npm install -g http-server

# Run the server
http-server -p 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 4: VS Code Live Server

If you're using VS Code, install the "Live Server" extension and right-click on `index.html` → "Open with Live Server".

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom styles with utility classes
- **Vanilla JavaScript (ES6+)**: Pure JS with ES modules
- **Chakra UI**: UI components loaded via CDN (no build step)

## Browser Support

The application uses modern JavaScript features (ES6+ modules, arrow functions, etc.). It should work in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

For older browsers, you may need to add polyfills or transpilation (which would require adding a build step).

## Development Philosophy

This project prioritizes:

1. **Readability**: Code should be easy to understand for any developer
2. **Maintainability**: Clear structure that can grow without becoming messy
3. **Simplicity**: No unnecessary abstractions or tooling
4. **Static-first**: Keep it simple until there's a clear need for complexity

## Testing

The project includes a comprehensive test suite using Vitest:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Development Features

### State Persistence (localStorage)

The application automatically saves your progress to browser localStorage, so you can:
- **Refresh the page** without losing your work
- **Close and reopen** the browser - your selections persist
- **Continue where you left off** - dates, filters, and selected routes are remembered

**What gets saved:**
- Start date and number of days
- Filter settings (min/max distance, altitude, excluded huts)
- Current wizard step
- Selected route combination
- Current view (wizard or hiking plan)

**What gets regenerated:**
- Route combinations (regenerated from saved filters on page load)
- Itinerary (regenerated from selected combination)

This keeps localStorage small while preserving your progress.

### Dev Mode (Quick Testing)

For faster development and testing, you can enable **Dev Mode** which auto-fills the wizard:

**How to enable:**
1. Add `?dev` to your URL: `http://localhost:8000/?dev`
2. The page will automatically:
   - Set start date to today
   - Set number of days to 6
   - Generate route combinations
   - Select the first route
   - Jump to route selection step

**Dev Mode features:**
- Green banner at the top indicates dev mode is active
- "Disable" button to turn off dev mode
- Persists across refreshes (until disabled)
- Perfect for quickly testing the hiking plan view

**To disable:**
- Click the "Disable" button in the dev mode banner, or
- Clear localStorage: Open browser console and run `localStorage.removeItem('alta-via-1-dev-mode')`

**Note:** Dev mode is intended for development only. Users won't see it unless they manually add `?dev` to the URL.

## Deployment to GitHub Pages

The application is fully compatible with GitHub Pages. See [GITHUB_PAGES.md](./GITHUB_PAGES.md) for detailed deployment instructions.

**Quick Steps**:
1. Ensure `.nojekyll` file exists (already present)
2. Enable GitHub Pages in repository Settings → Pages
3. Select `main` branch and `/ (root)` folder
4. Your site will be available at `https://[username].github.io/[repository-name]`

✅ **ES Modules work perfectly** - All imports use relative paths which resolve correctly on GitHub Pages.

## Contributing

This is currently a personal project, but contributions are welcome! The codebase is designed to be approachable, so feel free to suggest improvements or add features.

## License

[Add your license here]

---

**Status**: Static v1 – Foundation ready for feature development
