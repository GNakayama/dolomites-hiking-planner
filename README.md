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
├── index.html          # Main HTML entry point
├── styles.css          # Global styles and utility classes
├── src/
│   └── app.js         # Main application logic
└── README.md          # This file
```

The codebase is structured to be easily readable and maintainable. As features grow, the code can be split into logical modules (e.g., `src/data/alta-via-1.js`, `src/components/`, `src/utils/`).

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

## Contributing

This is currently a personal project, but contributions are welcome! The codebase is designed to be approachable, so feel free to suggest improvements or add features.

## License

[Add your license here]

---

**Status**: Static v1 – Foundation ready for feature development
