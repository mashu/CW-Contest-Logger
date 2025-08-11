# Development Setup

## Prerequisites

- **Node.js**: 18.x or later
- **npm**: 8.x or later  
- **Git**: Latest version
- **Operating System**: Windows 10+, macOS 10.14+, or Linux

## Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/mashu/CW-Logger.git
cd CW-Logger
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Mode
```bash
npm run dev
```
This starts the development server with hot reload.

### 4. Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
├── src/
│   ├── main.ts              # Main Electron process
│   ├── preload.ts           # Preload script for IPC
│   ├── renderer/            # React application
│   │   ├── components/      # React components
│   │   │   ├── ContestDialog.tsx
│   │   │   ├── DXCluster.tsx
│   │   │   ├── EntryForm.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── LogTable.tsx
│   │   │   ├── SettingsDialog.tsx
│   │   │   ├── Statistics.tsx
│   │   │   └── WorldMap.tsx
│   │   ├── store/          # Redux store and slices
│   │   │   ├── clusterSlice.ts
│   │   │   ├── contestSlice.ts
│   │   │   ├── qsoSlice.ts
│   │   │   ├── settingSlice.ts
│   │   │   └── store.ts
│   │   ├── services/       # External services
│   │   │   └── clusterService.tsx
│   │   ├── utils/          # Utility functions
│   │   │   └── hamRadioUtils.ts
│   │   ├── App.tsx         # Main React component
│   │   ├── index.tsx       # Renderer entry point
│   │   └── index.css       # Global styles
├── dist/                    # Compiled output
├── release/                 # Distribution packages
├── .github/workflows/       # GitHub Actions CI/CD
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── webpack.config.js       # Webpack configuration
└── electron-builder.json   # Electron Builder configuration
```

## Technology Stack

### Core Technologies
- **Electron**: Cross-platform desktop framework
- **React**: UI library with hooks
- **TypeScript**: Static type checking
- **Webpack**: Module bundler

### State Management
- **Redux Toolkit**: Predictable state container
- **React Redux**: React bindings for Redux

### UI Components
- **Material-UI (MUI)**: React component library
- **@mui/x-data-grid**: Advanced data grid
- **@mui/icons-material**: Material icons

### Mapping & Visualization
- **Leaflet**: Interactive maps
- **React Leaflet**: React components for Leaflet
- **Recharts**: Chart library for statistics

### Utilities
- **Axios**: HTTP client for API requests
- **date-fns**: Date utility library
- **uuid**: Unique identifier generation
- **electron-store**: Persistent storage

## Available Scripts

### Development
```bash
npm run dev          # Start development with hot reload
npm run watch        # Watch mode for TypeScript and Webpack
```

### Building
```bash
npm run build        # Build for production
npm start            # Run built application
```

### Distribution
```bash
npm run dist         # Build distributables for current platform
npm run dist:all     # Build for all platforms (Windows, macOS, Linux)
npm run dist:win     # Build Windows distributables
npm run dist:mac     # Build macOS distributables  
npm run dist:linux   # Build Linux distributables
```

## Development Workflow

### 1. Setting Up Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Making Changes
- **Frontend changes**: Edit files in `src/renderer/`
- **Backend changes**: Edit `src/main.ts` or `src/preload.ts`
- **Hot reload**: Changes are automatically reflected

### 3. Testing Changes
```bash
# Build and test production version
npm run build
npm start
```

### 4. Creating Distributables
```bash
# Test on your platform
npm run dist

# Build for all platforms (requires appropriate OS or CI)
npm run dist:all
```

## Code Style & Standards

### TypeScript Configuration
- Strict mode enabled
- No implicit any
- Prefer interfaces over types
- Use meaningful names

### React Patterns
- Functional components with hooks
- Custom hooks for shared logic
- Props interfaces for type safety
- Avoid inline styles (use CSS modules or MUI)

### Redux Best Practices
- Use Redux Toolkit slices
- Normalize state structure
- Async actions with createAsyncThunk
- Selector functions for derived state

### File Organization
- Group by feature, not by file type
- Use barrel exports (index.ts files)
- Keep components small and focused
- Separate business logic from UI

## Debugging

### Development Tools
```bash
# Open Chrome DevTools in development
npm run dev
# Then press Ctrl+Shift+I (Cmd+Option+I on macOS)
```

### Electron Main Process
- Use `console.log()` statements
- Logs appear in terminal where you ran `npm run dev`

### Renderer Process
- Use browser DevTools
- React DevTools extension works
- Redux DevTools for state inspection

### Build Issues
```bash
# Clear build cache
rm -rf dist/ release/
npm run build
```

## Platform-Specific Notes

### Windows Development
- Use Git Bash or PowerShell
- Windows Defender may scan builds (slower)
- Code signing requires certificate

### macOS Development
- Xcode Command Line Tools required
- Code signing requires Apple Developer account
- Notarization for distribution outside App Store

### Linux Development
- Multiple distribution formats supported
- AppImage requires FUSE
- Different package managers need different formats

## Building for Distribution

### Local Distribution
```bash
# Single platform
npm run dist

# All platforms (on appropriate OS)
npm run dist:all
```

### GitHub Actions CI/CD
- Automatic builds on tag push
- Builds for Windows, macOS, and Linux
- Publishes releases to GitHub
- Uses `electron-builder` for packaging

### Release Process
1. Update version in `package.json`
2. Commit changes
3. Create and push git tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
4. GitHub Actions will build and publish release

## Contributing

### Before Submitting
1. **Test thoroughly** on your platform
2. **Follow code style** guidelines
3. **Update documentation** if needed
4. **Write clear commit messages**

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test locally
5. Submit pull request with clear description

## Common Issues

### Build Failures
- **Node version**: Ensure Node.js 18+
- **Native dependencies**: May need rebuild
- **Platform tools**: Xcode/Visual Studio Build Tools

### Development Issues
- **Port conflicts**: Change webpack dev server port
- **Cache issues**: Clear `dist/` and `node_modules/.cache/`
- **Permission errors**: Check file permissions

### Distribution Issues
- **Code signing**: Requires certificates
- **Antivirus**: May flag unsigned binaries
- **Dependencies**: Ensure all native deps included

## Getting Help

- **Issues**: GitHub Issues for bugs
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Check existing docs first
- **Community**: Join amateur radio development communities

---

**Happy coding and 73!** 🛠️ 