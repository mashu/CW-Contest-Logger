import React, { useRef, useEffect } from 'react';
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
} from '@mui/material';
import { Send as SendIcon, Clear as ClearIcon } from '@mui/icons-material';
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
          sx={{ flex: 1, minWidth: 200 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
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
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Shortcuts: Ctrl+Enter to log, Esc to clear
      </Typography>
    </Paper>
  );
};

export default EntryForm;
