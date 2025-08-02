# User Guide

## Quick Start

1. **Launch** the application
2. **Configure** your station (Settings → Station tab)
3. **Select** or start a contest (Contest menu)
4. **Begin logging** QSOs!

## Interface Overview

### Main Window
- **Entry Form**: Top section for QSO entry
- **Log Table**: Center section showing logged QSOs
- **DX Cluster**: Right panel (toggle with Ctrl/Cmd+D)
- **World Map**: Bottom panel (toggle with Ctrl/Cmd+M)
- **Statistics**: Real-time contest statistics

### Menu Bar
- **File**: Import/Export, Preferences
- **Contest**: Contest selection and settings
- **View**: Toggle panels and themes
- **Help**: Documentation and about

## QSO Entry

### Basic Logging
1. **Callsign**: Enter callsign (auto-converts to uppercase)
2. **Band**: Select from dropdown or enter frequency
3. **Mode**: Defaults to CW, change if needed
4. **RST**: Defaults to 599/59
5. **Exchange**: Contest-specific information
6. **Press Ctrl/Cmd+Enter** to log

### Contest Logging
- Serial numbers are handled automatically
- Exchange fields adapt to contest type
- Real-time scoring and multiplier tracking
- Duplicate checking with visual indicators

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Log QSO |
| `Escape` | Clear entry form |
| `Tab` | Move between fields |
| `Ctrl/Cmd + D` | Toggle DX Cluster |
| `Ctrl/Cmd + M` | Toggle Map |
| `Ctrl/Cmd + E` | Export to ADI |
| `Ctrl/Cmd + ,` | Open Settings |

## Contest Operation

### Starting a Contest
1. Go to **Contest → Contest Settings**
2. Select contest type from dropdown
3. Set contest dates and times
4. Click **"Start Contest"**
5. The logger automatically tracks scoring

### Supported Contests
- **CQ WW DX CW/SSB**: Worldwide DX contest
- **CQ WPX CW/SSB**: Worked All Prefixes
- **ARRL DX CW/SSB**: ARRL DX Contest
- **IARU HF Championship**: International Amateur Radio Union
- **WAE CW/SSB**: Worked All Europe
- **ARRL Field Day**: Emergency preparedness exercise

### Contest Features
- **Automatic scoring** with real-time updates
- **Multiplier tracking** by zone/country/state
- **QSO rate calculations** (10-min and 60-min rates)
- **Band-by-band statistics**
- **Duplicate checking** with alerts

## DX Cluster

### DX Tab
- Shows traditional DX cluster spots
- Real-time updates from worldwide spotting network
- Color-coded by band
- Distance and bearing calculations

### RBN Tab
- Reverse Beacon Network integration
- Automatic CW signal detection
- Signal strength and frequency accuracy
- Filter by band, mode, continent

### Using Spots
1. **Click any spot** to populate entry form
2. **Filter** by band, mode, or continent
3. **Sort** by frequency, time, or distance
4. **Double-click** to tune rig (future feature)

## World Map

### Features
- **Interactive world map** with real-time spots
- **Great circle paths** from your location
- **Color-coded markers** by band
- **Zoom and pan** capabilities
- **Click markers** for spot details

### View Options
- **DX Spots**: Traditional DX cluster data
- **RBN Spots**: Reverse Beacon Network data
- **Combined**: Both DX and RBN spots
- **Logged QSOs**: Your confirmed contacts

## Configuration

### Station Tab
- **Callsign**: Your amateur radio callsign
- **Grid Square**: Maidenhead grid locator (e.g., FN20)
- **Name**: Your name for QSL cards
- **QTH**: Your location/city

### Contest Tab
- **Default Contest**: Pre-select preferred contest
- **Automatic Date/Time**: Use system clock
- **Sound Effects**: Audio feedback
- **Auto-increment Serial**: Automatic numbering

### Connections Tab
- **DX Cluster URL**: Telnet cluster address
- **RBN URL**: Reverse Beacon Network address
- **Connection timeout**: Network timeout settings
- **Auto-reconnect**: Automatic reconnection

### Interface Tab
- **Theme**: Light or dark mode
- **Font size**: Adjust for readability
- **Window layout**: Panel arrangement
- **Keyboard shortcuts**: Customize hotkeys

## Importing & Exporting

### ADI/ADIF Export
1. **File → Export to ADI**
2. Choose location and filename
3. Select date range (optional)
4. Compatible with:
   - LoTW (Logbook of the World)
   - eQSL.cc
   - QRZ.com Logbook
   - Ham Radio Deluxe
   - Contest software

### Import Logs
1. **File → Import**
2. Select ADI/ADIF file
3. Choose import options
4. Review and confirm

## Statistics

### Real-time Display
- **Total QSOs**: Overall contact count
- **QSO Rate**: Contacts per hour
- **Score**: Contest points
- **Multipliers**: Unique zones/countries/states
- **Band breakdown**: QSOs per band

### Export Statistics
- CSV format for spreadsheet analysis
- Contest summary reports
- Band activity charts

## Troubleshooting

### Common Issues

#### DX Cluster Not Connecting
- Check internet connection
- Verify cluster URL in settings
- Some clusters require callsign authentication
- Try alternative cluster servers

#### Map Not Displaying
- Ensure internet connection for map tiles
- Check grid square format (6-character Maidenhead)
- Clear browser cache (Help → Clear Cache)

#### ADI Export Fails
- Check write permissions to destination folder
- Ensure file is not open in another program
- Try different file location

#### Performance Issues
- Close unused panels (DX Cluster, Map)
- Reduce log table size in settings
- Restart application periodically

### Debug Mode
For troubleshooting:
1. **Help → Developer Tools**
2. Or press `Ctrl/Cmd + Shift + I`
3. Check Console tab for errors
4. Include error messages in bug reports

## Tips & Best Practices

### Contest Operation
- **Practice before contests** with general logging
- **Set up macros** for common exchanges
- **Use keyboard shortcuts** for speed
- **Monitor DX cluster** for new multipliers
- **Export logs frequently** as backup

### Logging Accuracy
- **Double-check callsigns** before logging
- **Use partial callsign search** for duplicates
- **Verify exchange information**
- **Review logs** after contest for errors

### Performance
- **Close unnecessary applications**
- **Use wired internet** for cluster connectivity
- **Position antennas** for best propagation
- **Keep backup power** for long contests

## Getting Help

- **Issues**: Report bugs on GitHub Issues
- **Questions**: Use GitHub Discussions
- **Email**: Contact support team
- **Documentation**: Check this guide and README

---

**Happy contesting and 73!** 📻 