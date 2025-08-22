# Minimum Spanning Tree Algorithms Demo

An interactive SvelteKit application demonstrating four classic minimum spanning tree (MST) algorithms with a clean, modern interface.

## Features

- **Four MST Algorithms**: Prim's, Kruskal's, Borůvka's, and Reverse-Delete
- **Interactive Demo**: Run algorithms step-by-step with detailed explanations
- **Modern UI**: Built with Pico CSS for semantic, accessible styling
- **Beautiful Icons**: Lucide Svelte icons throughout the interface
- **TypeScript**: Full type safety and excellent developer experience

## Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Styling**: [Pico CSS](https://picocss.com/) - Semantic CSS framework
- **Icons**: [Lucide Svelte](https://lucide.dev/) - Beautiful & consistent icons
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, pnpm, or yarn

### Installation

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
npm run dev -- --open
```

### Building for Production

```sh
# Create production build
npm run build

# Preview production build
npm run preview
```

## Algorithm Implementations

### 1. Prim's Algorithm
Grows the MST one vertex at a time by adding the minimum weight edge connecting the current tree to a new vertex.

### 2. Kruskal's Algorithm
Sorts all edges by weight and adds them to the MST if they don't create a cycle, using Union-Find data structure.

### 3. Borůvka's Algorithm
Finds the minimum weight edge for each component simultaneously, making it naturally parallelizable.

### 4. Reverse-Delete Algorithm
Starts with all edges and removes the heaviest edges that don't disconnect the graph.

## Project Structure

```
src/
├── lib/
│   ├── mst/
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── prim.ts           # Prim's algorithm
│   │   ├── kruskal.ts        # Kruskal's algorithm
│   │   ├── boruvka.ts        # Borůvka's algorithm
│   │   └── reverseDelete.ts  # Reverse-Delete algorithm
│   └── index.ts              # Library exports
├── routes/
│   ├── +layout.svelte        # App layout with Pico CSS
│   └── +page.svelte          # Main demo interface
└── app.html                  # HTML template
```

## Development

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting  
- **Vitest** for unit testing
- **TypeScript** for type checking

```sh
# Run linting
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Type checking
npm run check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the project's coding standards
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
