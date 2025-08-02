# Installation & Setup

## System Requirements

- **Windows**: Windows 10 or later (64-bit)
- **macOS**: macOS 10.14 or later (Intel or Apple Silicon)
- **Linux**: Ubuntu 18.04+, Fedora 30+, or equivalent

## Download & Install

### 🪟 Windows

1. Download the latest release:
   - **Installer**: `CW-Contest-Logger-Setup-0.1.0.exe` (recommended)
   - **Portable**: `CW-Contest-Logger-0.1.0-portable.exe`

2. **Using Installer**:
   - Run the downloaded `.exe` file
   - Follow the installation wizard
   - The app will be installed to Program Files and added to Start Menu

3. **Using Portable**:
   - Run the portable `.exe` directly
   - No installation required, runs from any folder

### 🍎 macOS

1. Download the appropriate `.dmg` file:
   - **Intel Macs**: `CW Contest Logger-0.1.0.dmg`
   - **Apple Silicon**: `CW Contest Logger-0.1.0-arm64.dmg`

2. **Install**:
   - Open the downloaded `.dmg` file
   - Drag "CW Contest Logger" to Applications folder
   - Launch from Applications or Spotlight

**Note**: On first launch, macOS may show a security warning. Go to System Preferences → Security & Privacy → General and click "Open Anyway".

### 🐧 Linux

#### AppImage (Recommended)
1. Download `CW Contest Logger-0.1.0.AppImage`
2. Make it executable:
   ```bash
   chmod +x "CW Contest Logger-0.1.0.AppImage"
   ```
3. Run:
   ```bash
   ./"CW Contest Logger-0.1.0.AppImage"
   ```

#### Tar.gz Archive
1. Download `cw-contest-logger-0.1.0.tar.gz`
2. Extract:
   ```bash
   tar -xzf cw-contest-logger-0.1.0.tar.gz
   cd cw-contest-logger-0.1.0
   ```
3. Run:
   ```bash
   ./cw-contest-logger
   ```

## First Time Setup

### 1. Station Information
- Open Settings (gear icon in top right)
- Go to "Station" tab
- Enter your **callsign** (required)
- Enter your **grid square** (required for DX calculations)
- Optionally add name and QTH

### 2. DX Cluster Configuration
- Go to "Connections" tab in Settings
- DX Cluster URL: `cluster.example.com:7300` (adjust as needed)
- RBN URL: Usually auto-configured

### 3. Contest Setup (Optional)
- Go to "Contest" tab in Settings
- Select your preferred default contest
- Configure automatic date/time settings

## Troubleshooting

### Windows
- **"Windows protected your PC"**: Click "More info" → "Run anyway"
- **Antivirus blocking**: Add exception for the application

### macOS
- **"Cannot be opened because the developer cannot be verified"**: 
  - Right-click app → Open → Confirm
  - Or go to System Preferences → Security & Privacy → Open Anyway

### Linux
- **AppImage won't run**: Install `fuse` package:
  ```bash
  # Ubuntu/Debian
  sudo apt install fuse libfuse2
  
  # Fedora
  sudo dnf install fuse fuse-libs
  ```

- **Missing dependencies**: Most dependencies are bundled, but you may need:
  ```bash
  # Ubuntu/Debian
  sudo apt install libgtk-3-0 libnotify4 libnss3 libatspi2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2

  # Fedora
  sudo dnf install gtk3 libnotify nss atk at-spi2-atk libdrm libXcomposite libXdamage libXrandr mesa-libgbm alsa-lib
  ```

## Building from Source

If you prefer to build from source, see [DEVELOPMENT.md](DEVELOPMENT.md) for detailed instructions. 