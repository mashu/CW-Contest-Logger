import React from 'react';
import { useSelector } from 'react-redux';
import { Paper, Grid, Typography, Box } from '@mui/material';
import { RootState } from '../store/store';

const Statistics: React.FC = () => {
  const contest = useSelector((state: RootState) => state.contest);
  const qsos = useSelector((state: RootState) => state.qsos.qsos);

  const calculateBandStats = () => {
    const bandCounts: Record<string, number> = {};
    qsos.forEach((qso) => {
      bandCounts[qso.band] = (bandCounts[qso.band] || 0) + 1;
    });
    return bandCounts;
  };

  const calculateRate = (minutes: number) => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - minutes * 60000);
    const recentQSOs = qsos.filter((qso) => {
      const qsoTime = new Date(`${qso.date}T${qso.time}`);
      return qsoTime >= cutoff;
    });
    return Math.round((recentQSOs.length / minutes) * 60);
  };

  const bandStats = calculateBandStats();

  const StatCard = ({ title, value, subtitle }: any) => (
    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 'bold', my: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  return (
    <Grid container spacing={2}>
      {contest.isActive && (
        <>
          <Grid item xs={6} sm={3} md={2}>
            <StatCard
              title="Score"
              value={contest.score.total.toLocaleString()}
              subtitle={`${contest.score.points} × ${contest.score.multipliers}`}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <StatCard
              title="QSOs"
              value={contest.score.qsos}
              subtitle="Total"
            />
          </Grid>
        </>
      )}
      
      <Grid item xs={6} sm={3} md={2}>
        <StatCard
          title="Rate (10m)"
          value={calculateRate(10)}
          subtitle="QSOs/hr"
        />
      </Grid>
      
      <Grid item xs={6} sm={3} md={2}>
        <StatCard
          title="Rate (60m)"
          value={calculateRate(60)}
          subtitle="QSOs/hr"
        />
      </Grid>

      {Object.entries(bandStats).map(([band, count]) => (
        <Grid item xs={4} sm={2} md={1.5} key={band}>
          <Paper elevation={1} sx={{ p: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {band}
            </Typography>
            <Typography variant="h6">
              {count}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default Statistics;
