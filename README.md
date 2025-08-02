# CW Contest Logger

A professional, cross-platform CW (Continuous Wave) contest logging application built with Electron, React, and TypeScript. Features real-time DX cluster integration, RBN (Reverse Beacon Network) support, world map visualization, and ADI/ADIF export capabilities.

![CW Contest Logger](screenshot.png)

## Features

### Core Functionality
- **Fast QSO Entry**: Optimized keyboard-driven interface for rapid contest logging
- **Real-time Validation**: Automatic callsign and grid square validation
- **Duplicate Checking**: Instant duplicate QSO detection with visual indicators
- **ADI/ADIF Export**: Industry-standard log file export for QSL services

### Contest Support
- Pre-configured contest modes (CQ WW, CQ WPX, ARRL DX, IARU HF, WAE, Field Day)
- Automatic serial number generation
- Real-time scoring with multiplier tracking
- QSO rate calculations (10-minute and 60-minute rates)
- Band-by-band statistics

### DX Cluster & RBN Integration
- Live DX cluster spot display
- Reverse Beacon Network integration
- Spot filtering by band, mode, and continent
- Distance and bearing calculations
- Color-coded band indicators

### World Map
- Real-time visualization of DX spots and RBN data
- Great circle path display
- Interactive spot information
- Toggle between DX, RBN, or combined view

### User Interface
- Modern, professional dark/light theme
- Responsive layout optimized for contest operation
- Customizable window arrangement
- Full keyboard shortcut support

## Installation

### Prerequisites
- Node.js 16+ and npm
- Git

### Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd cw-contest-logger
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

4. Run in development mode:
```bash
npm run dev
```

5. Build for distribution:
```bash
npm run dist
```

The distributable files will be created in the `release` directory.

## Usage

### Quick Start
1. Launch the application
2. Go to Settings (gear icon) and enter your callsign and grid square
3. Select or start a contest from Contest menu
4. Begin logging QSOs!

### Keyboard Shortcuts
- **Ctrl/Cmd + Enter**: Log QSO
- **Escape**: Clear entry form
- **Ctrl/Cmd + D**: Toggle DX Cluster
- **Ctrl/Cmd + M**: Toggle Map
- **Ctrl/Cmd + E**: Export to ADI
- **Tab**: Move between fields

### QSO Entry
1. Enter the callsign (automatically converted to uppercase)
2. Select band or enter frequency (band auto-detected)
3. RST fields default to 599
4. Serial numbers handled automatically in contest mode
5. Press Ctrl+Enter to log

### Contest Operation
1. Go to Contest → Contest Settings
2. Select contest type
3. Click "Start Contest"
4. The logger will track scoring and serial numbers automatically

### DX Cluster Features
- **DX Tab**: Shows traditional DX cluster spots
- **RBN Tab**: Shows CW Reverse Beacon Network spots
- Click on any spot to populate the entry form
- Spots show distance and bearing from your location

### Exporting Logs
1. File → Export to ADI
2. Choose location and filename
3. Upload to LoTW, eQSL, or your preferred service

## Configuration

### Settings Options

#### Station Tab
- **Callsign**: Your amateur radio callsign
- **Grid Square**: Your Maidenhead grid locator
- **Name**: Your name (for QSL cards)
- **QTH**: Your location

#### Contest Tab
- **Default Contest Mode**: Pre-select your preferred contest
- **Automatic Date/Time**: Use computer clock for QSO timestamps
- **Enable Sound Effects**: Audio feedback for actions

#### Connections Tab
- **DX Cluster URL**: Telnet URL for DX cluster
- **RBN URL**: Telnet URL for Reverse Beacon Network

#### Interface Tab
- **Rig Interface**: CAT control selection (future feature)
- **CW Speed**: Default sending speed in WPM

## Development

### Project Structure
```
├── src/
│   ├── main.ts              # Main Electron process
│   ├── preload.ts           # Preload script
│   ├── renderer/            # React application
│   │   ├── components/      # React components
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # External services
│   │   ├── utils/          # Utility functions
│   │   └── index.tsx       # Renderer entry point
├── dist/                    # Compiled output
├── release/                 # Distribution packages
├── package.json
├── tsconfig.json
└── webpack.config.js
```

### Technology Stack
- **Electron**: Cross-platform desktop framework
- **React**: UI library
- **TypeScript**: Type safety
- **Redux Toolkit**: State management
- **Material-UI**: Component library
- **Leaflet**: Map visualization
- **Recharts**: Statistics charts

### Building from Source

#### Development Build
```bash
npm run dev
```

#### Production Build
```bash
npm run build
npm start
```

#### Create Distributables
```bash
# Windows
npm run dist -- --win

# macOS
npm run dist -- --mac

# Linux
npm run dist -- --linux
```

## Troubleshooting

### Common Issues

1. **DX Cluster not connecting**
   - Check your internet connection
   - Verify the telnet URL in settings
   - Some clusters require callsign authentication

2. **Map not displaying**
   - Ensure you have an active internet connection
   - Check if your grid square is correctly formatted

3. **ADI export fails**
   - Ensure you have write permissions to the selected directory
   - Check that no other program is using the file

### Debug Mode
Run with Chrome DevTools:
```bash
npm run dev
```
Then press `Ctrl+Shift+I` (or `Cmd+Option+I` on macOS) in the app.

## Future Enhancements

- [ ] CAT control for automatic frequency/mode updates
- [ ] CW keyer integration
- [ ] WSJT-X integration for digital modes
- [ ] Cloud backup and sync
- [ ] iOS/Android companion apps
- [ ] Contest rule validation
- [ ] Automatic QRZ.com lookups
- [ ] Propagation predictions
- [ ] Multi-operator support

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by N1MM Logger+, cqrlog, and HAMRS
- DX cluster data format specifications from AR-Cluster
- ADIF specifications from adif.org

## Support

For bug reports and feature requests, please use the GitHub issue tracker.

73 and good DX!
