# Cancer Research UK Homepage Clone

A cosmetic clone of the Cancer Research UK homepage with AI-powered content generation capabilities.

## Features

- **1:1 Visual Fidelity**: Matches CRUK's colors, typography, and layout
- **Modular Components**: All text content is wrapped in `<SmartText>` components
- **AI Content Context**: Uses React Context to manage and update content dynamically
- **Interactive Sidebar**: Mock AI content generator to demonstrate text replacement

## Design System

- **Primary Blue**: `#2e008b` (CRUK Blue)
- **Accent Pink**: `#ec008c` (CRUK Pink)
- **Typography**: Arial/Helvetica sans-serif

## Architecture

### Core Components

1. **ContentContext** (`src/contexts/ContentContext.tsx`)
   - Manages all text content across the application
   - Provides `updateContent()` and `generateAllContent()` methods
   - Ready for integration with real AI text generation APIs

2. **SmartText** (`src/components/SmartText.tsx`)
   - Wraps all major text blocks (headlines, paragraphs, buttons)
   - Listens to ContentContext for updates
   - Automatically re-renders when content changes

3. **Modular Components**
   - `Header`: Top navigation and branding
   - `HeroCard`: Reusable card component for content sections
   - `Footer`: Site footer with links
   - `Sidebar`: AI content generator interface

## Getting Started

```bash
cd cruk-clone
npm install
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Usage

1. The page loads with original CRUK-inspired content
2. Click "Generate Content" in the sidebar to simulate AI text replacement
3. All `<SmartText>` components update simultaneously
4. Click "Reset to Original" to reload the page

## Future Integration

The `generateAllContent()` function in `ContentContext.tsx` is currently mocked. Replace it with your AI API call:

```typescript
const generateAllContent = async () => {
  const newContent = await fetch('/api/generate-content', {
    method: 'POST',
    body: JSON.stringify({ content })
  }).then(res => res.json());
  
  setContent(newContent);
};
```

## Component Structure

```
App
├── ContentProvider (Context)
├── Header
│   └── SmartText components
├── Main Content
│   ├── HeroCard (multiple instances)
│   │   └── SmartText components
│   └── Banner
│       └── SmartText components
├── Footer
│   └── SmartText components
└── Sidebar (AI Generator UI)
```

## License

This is a demonstration project for educational purposes.
