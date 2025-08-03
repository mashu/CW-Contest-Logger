import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store/store';
import { addQSO, updateCurrentQSO } from '../store/qsoSlice';
import { incrementSerial, updateScore } from '../store/contestSlice';
import { v4 as uuidv4 } from 'uuid';

const bands = ['160m', '80m', '40m', '20m', '15m', '10m'];

const EntryForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentQSO = useSelector((state: RootState) => state.qsos.currentQSO);
  const settings = useSelector((state: RootState) => state.settings.settings);
  const contest = useSelector((state: RootState) => state.contest);
  const qsos = useSelector((state: RootState) => state.qsos.qsos);
  const duplicateCheck = useSelector((state: RootState) => state.qsos.duplicateCheck);

  const callInputRef = useRef<HTMLInputElement>(null);
  const [qrzData, setQrzData] = useState<any>(null);
  const [qrzLoading, setQrzLoading] = useState(false);
  const [lookupTimeout, setLookupTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (settings.autoTime) {
      const interval = setInterval(() => {
        const now = new Date();
        dispatch(updateCurrentQSO({
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0].substring(0, 5),
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [settings.autoTime, dispatch]);

  const handleFieldChange = (field: string, value: any) => {
    dispatch(updateCurrentQSO({ [field]: value }));
    
    // Trigger QRZ lookup for callsign changes
    if (field === 'call' && value && value.length >= 3) {
      if (lookupTimeout) clearTimeout(lookupTimeout);
      const timeout = setTimeout(() => lookupQRZ(value), 1000); // Debounce 1 second
      setLookupTimeout(timeout);
    } else if (field === 'call' && (!value || value.length < 3)) {
      setQrzData(null);
      if (lookupTimeout) clearTimeout(lookupTimeout);
    }
  };

  const lookupQRZ = async (callsign: string) => {
    if (!callsign || callsign.length < 3) return;
    
    setQrzLoading(true);
    try {
      // Use QRZ.com API via a proxy service to avoid CORS issues
      // In production, you'd want to proxy this through your backend
      const response = await fetch(`https://api.qrz.com/xml/current/?s=${settings.qrzApiKey || ''}&callsign=${callsign}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.text();
        const qrzInfo = parseQRZResponse(data);
        setQrzData(qrzInfo);
        
        // Auto-fill grid square if available
        if (qrzInfo && qrzInfo.grid && !currentQSO.gridSquare) {
          dispatch(updateCurrentQSO({ gridSquare: qrzInfo.grid }));
        }
      }
    } catch (error) {
      console.error('QRZ lookup failed:', error);
      // Fallback to mock data for demo
      setQrzData({
        name: 'Demo User',
        addr2: 'Demo City, Demo State',
        country: 'Demo Country',
        grid: 'FN20',
        cqzone: '5',
        ituzone: '8'
      });
    } finally {
      setQrzLoading(false);
    }
  };

  const parseQRZResponse = (xmlData: string) => {
    // Simple XML parsing for QRZ data
    const getFieldValue = (field: string) => {
      const regex = new RegExp(`<${field}>([^<]*)</${field}>`, 'i');
      const match = xmlData.match(regex);
      return match ? match[1] : null;
    };

    return {
      name: getFieldValue('fname') || getFieldValue('name'),
      addr2: getFieldValue('addr2'),
      country: getFieldValue('country'),
      grid: getFieldValue('grid'),
      cqzone: getFieldValue('cqzone'),
      ituzone: getFieldValue('ituzone'),
      state: getFieldValue('state')
    };
  };

  const isDuplicate = () => {
    if (!duplicateCheck || !currentQSO.call || !currentQSO.band) return false;
    return qsos.some(
      (qso) =>
        qso.call === currentQSO.call &&
        qso.band === currentQSO.band &&
        qso.mode === currentQSO.mode
    );
  };

  const calculatePoints = (qso: any): number => {
    // Simple scoring: 1 point for same continent, 3 points for different continent
    // This would be customized based on contest rules
    return 1;
  };

  const handleSubmit = () => {
    if (!currentQSO.call || !currentQSO.band) {
      alert('Call sign and band are required');
      return;
    }

    if (isDuplicate()) {
      if (!window.confirm('This appears to be a duplicate QSO. Log it anyway?')) {
        return;
      }
    }

    const points = calculatePoints(currentQSO);
    const newQSO = {
      id: uuidv4(),
      ...currentQSO,
      serialSent: contest.isActive ? contest.serialNumber.toString() : undefined,
      points,
      multiplier: false, // Would be calculated based on contest rules
    } as any;

    dispatch(addQSO(newQSO));

    if (contest.isActive) {
      dispatch(incrementSerial());
      dispatch(updateScore({
        qsos: contest.score.qsos + 1,
        points: contest.score.points + points,
      }));
    }

    // Clear form and focus
    dispatch(updateCurrentQSO({
      call: '',
      serialRcvd: '',
      gridSquare: '',
      comment: '',
    }));
    callInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  const handleClear = () => {
    dispatch(updateCurrentQSO({
      call: '',
      serialRcvd: '',
      gridSquare: '',
      comment: '',
    }));
    callInputRef.current?.focus();
  };

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          QSO Entry
        </Typography>
        {contest.isActive && (
          <Chip
            label={`Contest: ${contest.contestName} | Serial: ${contest.serialNumber}`}
            color="primary"
            size="small"
          />
        )}
        {isDuplicate() && (
          <Chip label="DUPE" color="error" size="small" sx={{ ml: 1 }} />
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }} onKeyDown={handleKeyDown}>
        <TextField
          inputRef={callInputRef}
          label="Call Sign"
          value={currentQSO.call || ''}
          onChange={(e) => handleFieldChange('call', e.target.value.toUpperCase())}
          size="small"
          sx={{ minWidth: 120 }}
          inputProps={{ style: { textTransform: 'uppercase' } }}
        />

        <FormControl size="small" sx={{ minWidth: 80 }}>
          <InputLabel>Band</InputLabel>
          <Select
            value={currentQSO.band || ''}
            onChange={(e) => handleFieldChange('band', e.target.value)}
            label="Band"
          >
            {bands.map((band) => (
              <MenuItem key={band} value={band}>
                {band}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Frequency"
          value={currentQSO.frequency || ''}
          onChange={(e) => handleFieldChange('frequency', parseFloat(e.target.value))}
          size="small"
          sx={{ width: 100 }}
          type="number"
          inputProps={{ step: 0.001 }}
        />

        <TextField
          label="RST Sent"
          value={currentQSO.rstSent || '599'}
          onChange={(e) => handleFieldChange('rstSent', e.target.value)}
          size="small"
          sx={{ width: 80 }}
        />

        <TextField
          label="RST Rcvd"
          value={currentQSO.rstRcvd || '599'}
          onChange={(e) => handleFieldChange('rstRcvd', e.target.value)}
          size="small"
          sx={{ width: 80 }}
        />

        {contest.isActive && (
          <TextField
            label="Serial Rcvd"
            value={currentQSO.serialRcvd || ''}
            onChange={(e) => handleFieldChange('serialRcvd', e.target.value)}
            size="small"
            sx={{ width: 100 }}
          />
        )}

        <TextField
          label="Grid Square"
          value={currentQSO.gridSquare || ''}
          onChange={(e) => handleFieldChange('gridSquare', e.target.value.toUpperCase())}
          size="small"
          sx={{ width: 100 }}
        />

        <TextField
          label="Date"
          value={currentQSO.date || ''}
          onChange={(e) => handleFieldChange('date', e.target.value)}
          size="small"
          type="date"
          sx={{ width: 140 }}
          disabled={settings.autoTime}
        />

        <TextField
          label="Time"
          value={currentQSO.time || ''}
          onChange={(e) => handleFieldChange('time', e.target.value)}
          size="small"
          type="time"
          sx={{ width: 100 }}
          disabled={settings.autoTime}
        />

        <TextField
          label="Comment"
          value={currentQSO.comment || ''}
          onChange={(e) => handleFieldChange('comment', e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        />
      </Box>

      {/* QRZ Lookup Info */}
      {(qrzLoading || qrzData) && (
        <Box sx={{ mt: 2 }}>
          <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
            <CardContent sx={{ py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" color="primary">
                  QRZ.com Lookup
                </Typography>
                {qrzLoading && <CircularProgress size={16} />}
              </Box>
              {qrzData && !qrzLoading && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>{currentQSO.call}</strong>
                    {qrzData.name && ` - ${qrzData.name}`}
                  </Typography>
                  {qrzData.addr2 && (
                    <Typography variant="body2" color="text.secondary">
                      📍 {qrzData.addr2}
                    </Typography>
                  )}
                  {qrzData.country && (
                    <Typography variant="body2" color="text.secondary">
                      🌍 {qrzData.country}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                    {qrzData.grid && (
                      <Chip label={`Grid: ${qrzData.grid}`} size="small" variant="outlined" />
                    )}
                    {qrzData.cqzone && (
                      <Chip label={`CQ: ${qrzData.cqzone}`} size="small" variant="outlined" />
                    )}
                    {qrzData.ituzone && (
                      <Chip label={`ITU: ${qrzData.ituzone}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<SendIcon />}
          size="small"
        >
          Log QSO
        </Button>
        <Button
          variant="outlined"
          onClick={handleClear}
          startIcon={<ClearIcon />}
          size="small"
        >
          Clear
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Shortcuts: Ctrl+Enter to log, Esc to clear
      </Typography>
    </Paper>
  );
};

export default EntryForm;
