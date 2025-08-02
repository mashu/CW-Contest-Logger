import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Alert,
} from '@mui/material';
import { RootState, AppDispatch } from '../store/store';
import { startContest, endContest } from '../store/contestSlice';

interface ContestDialogProps {
  open: boolean;
  onClose: () => void;
}

const contestTypes = [
  { value: 'CQ WW', exchange: '599 + CQ Zone' },
  { value: 'CQ WPX', exchange: '599 + Serial' },
  { value: 'ARRL DX', exchange: '599 + State/Power' },
  { value: 'IARU HF', exchange: '599 + ITU Zone' },
  { value: 'WAE', exchange: '599 + Serial/QTC' },
  { value: 'Field Day', exchange: 'Class + Section' },
  { value: 'Custom', exchange: 'Custom' },
];

const ContestDialog: React.FC<ContestDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const contest = useSelector((state: RootState) => state.contest);
  const [contestName, setContestName] = React.useState('');
  const [exchange, setExchange] = React.useState('599');

  const handleContestTypeChange = (value: string) => {
    setContestName(value);
    const selected = contestTypes.find(c => c.value === value);
    if (selected) {
      setExchange(selected.exchange);
    }
  };

  const handleStartContest = () => {
    if (!contestName) {
      alert('Please select a contest');
      return;
    }
    dispatch(startContest({ name: contestName, exchange }));
    onClose();
  };

  const handleEndContest = () => {
    if (window.confirm('Are you sure you want to end the contest?')) {
      dispatch(endContest());
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Contest Settings</DialogTitle>
      <DialogContent>
        {contest.isActive ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Contest "{contest.contestName}" is currently active
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Started
                </Typography>
                <Typography variant="body1">
                  {contest.startTime && new Date(contest.startTime).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1">
                  {contest.startTime && (
                    Math.floor((Date.now() - new Date(contest.startTime).getTime()) / 3600000)
                  )} hours
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Exchange
                </Typography>
                <Typography variant="body1">
                  {contest.exchange}
                </Typography>
              </Grid>
            </Grid>
          </>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Contest Type</InputLabel>
                <Select
                  value={contestName}
                  onChange={(e) => handleContestTypeChange(e.target.value)}
                  label="Contest Type"
                >
                  {contestTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exchange Format"
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                helperText="Define the exchange format for this contest"
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {contest.isActive ? (
          <Button onClick={handleEndContest} color="error" variant="contained">
            End Contest
          </Button>
        ) : (
          <Button onClick={handleStartContest} variant="contained">
            Start Contest
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ContestDialog;
