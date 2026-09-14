# DocCanvas

A React Native CLI mobile application for creating, editing, and managing documents on Android.

## Overview

DocCanvas provides a canvas-style document editor where users can compose multi-page documents with text elements, shapes, images, and more. The app supports text formatting, element locking, highlighting, and PDF export.

## Features

- **Multi-page document editor** with a canvas-based layout
- **Text elements**: Title, subtitle, headings, and paragraphs with:
  - Color selection (8 preset colors)
  - Highlight color with 6 preset options
  - Text alignment (left, center, right)
  - Lock/unlock to prevent accidental edits
- **Shape elements** with:
  - Line shapes rendered via SVG
  - Adjustable stroke thickness (1px–12px)
  - Fill color customization
- **Image elements** with library picker integration
- **Element management**: select, duplicate, delete, rotate
- **PDF export**: Download documents as PDF files via HTML-to-PDF conversion
- **Document list** with categories and search
- **Templates** for quick document creation
- **Settings**: Dark mode, page size, font selection, and export quality

## Project Structure

```
DocCanvas/
├── android/                  # Android native project
│   ├── app/
│   │   ├── build.gradle      # App-level Gradle config
│   │   ├── proguard-rules.pro
│   │   ├── debug.keystore
│   │   └── src/
│   │       └── main/
│   ├── build.gradle          # Project-level Gradle config
│   └── gradle.properties
├── ios/                      # iOS native project
├── src/
│   ├── App.tsx               # Root component with navigation
│   ├── types.ts              # TypeScript type definitions
│   ├── components/           # Reusable UI components
│   │   ├── AppHeader.tsx
│   │   ├── BottomNavBar.tsx
│   │   ├── Chip.tsx
│   │   ├── DocumentListItem.tsx
│   │   ├── PromptModal.tsx
│   │   ├── RecentDocRow.tsx
│   │   ├── SelectDropdown.tsx
│   │   ├── TemplateCard.tsx
│   │   ├── TileButton.tsx
│   │   └── Toast.tsx
│   ├── context/              # React Context providers
│   │   ├── DocumentContext.tsx
│   │   ├── SettingsContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/                # Custom hooks
│   │   ├── useDocumentActions.ts
│   │   └── useHistory.ts
│   ├── screens/              # Screen components
│   │   ├── DocumentsScreen.tsx
│   │   ├── EditorScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── TemplatesScreen.tsx
│   └── utils/
│       ├── dateUtils.ts
│       └── theme.ts
├── __tests__/                # Jest tests
├── .github/workflows/        # CI/CD pipelines
├── index.js                  # App entry point
├── package.json
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React Native 0.87.1 (CLI, not Expo) |
| Language | TypeScript 6.0 |
| Navigation | React Navigation 7 (native-stack) |
| UI Icons | Lucide React Native |
| SVG Rendering | react-native-svg |
| Storage | @react-native-async-storage/async-storage |
| Image Picker | react-native-image-picker |
| PDF Generation | react-native-html-to-pdf |
| File System | react-native-fs |
| JavaScript Engine | Hermes |
| Build Tool | Gradle (Android) |

## Getting Started

### Prerequisites

- Node.js >= 22.11.0
- Java 17 (JDK)
- Android Studio with Android SDK
- Android SDK 37 (or compatible)

### Setup

```sh
# Install dependencies
npm install

# (Android only) Install native modules
npx react-native run-android

# Start Metro bundler
npm start

# Run the app
npm run android
```

### Development

```sh
# Start Metro development server
npm start

# Run Android
npm run android

# Run iOS (macOS only)
npm run ios

# Run linter
npm run lint

# Run tests
npm test
```

## Core Components

### EditorScreen (`src/screens/EditorScreen.tsx`)

The main document editing interface. Key features:

- **Canvas**: Renders document pages with draggable elements
- **Tools toolbar**: Text, Image, Shape, Color, Thickness, Highlight tools
- **Element actions bar**: Lock, delete, color, thickness, alignment controls
- **Page strip**: Navigate between document pages
- **PanResponder**: Handles drag, pinch-to-scale, and rotation gestures
- **PDF export**: Generates downloadable PDF files from document content

### DocumentContext (`src/context/DocumentContext.tsx`)

Manages document state including:
- Document CRUD operations
- AsyncStorage persistence
- Content synchronization

### SettingsContext (`src/context/SettingsContext.tsx`)

Manages app settings:
- Dark mode toggle
- Page size (A4, Letter)
- Font selection (Inter, Arial, Georgia)
- Export quality (High, Medium, Low)

### ThemeContext (`src/context/ThemeContext.tsx`)

Provides theme colors and dark mode support.

## Build & Deploy

### Debug Build

```sh
cd android
./gradlew assembleDebug
```

### Release Build

```sh
cd android
./gradlew assembleRelease
```

The release APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.

### CI/CD

GitHub Actions automatically builds and deploys on every push to `main`. See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## License

Private project.
