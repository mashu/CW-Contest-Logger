import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Paper, IconButton, Box, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store/store';
import { deleteQSO } from '../store/qsoSlice';

const LogTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const qsos = useSelector((state: RootState) => state.qsos.qsos);
  const contest = useSelector((state: RootState) => state.contest);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this QSO?')) {
      dispatch(deleteQSO(id));
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 100,
      valueFormatter: (params) => params.value,
    },
    {
      field: 'time',
      headerName: 'Time',
      width: 80,
    },
    {
      field: 'call',
      headerName: 'Call Sign',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'band',
      headerName: 'Band',
      width: 70,
    },
    {
      field: 'frequency',
      headerName: 'Freq',
      width: 90,
      valueFormatter: (params) => params.value ? `${params.value.toFixed(3)}` : '',
    },
    {
      field: 'mode',
      headerName: 'Mode',
      width: 60,
    },
    {
      field: 'rstSent',
      headerName: 'RST S',
      width: 70,
    },
    {
      field: 'rstRcvd',
      headerName: 'RST R',
      width: 70,
    },
    ...(contest.isActive ? [
      {
        field: 'serialSent',
        headerName: 'Ser S',
        width: 70,
      },
      {
        field: 'serialRcvd',
        headerName: 'Ser R',
        width: 70,
      },
    ] : []),
    {
      field: 'gridSquare',
      headerName: 'Grid',
      width: 80,
    },
    {
      field: 'points',
      headerName: 'Pts',
      width: 60,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color={params.value > 1 ? 'primary' : 'text.primary'}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'multiplier',
      headerName: 'Mult',
      width: 60,
      renderCell: (params) => (
        params.value ? (
          <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
            ✓
          </Typography>
        ) : null
      ),
    },
    {
      field: 'comment',
      headerName: 'Comment',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => console.log('Edit', params.row.id)}
            sx={{ p: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            sx={{ p: 0.5 }}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rows = [...qsos].reverse();

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="h6">
          Log Book ({qsos.length} QSOs)
        </Typography>
      </Box>
      <Box sx={{ flex: 1, p: 2, pt: 0 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={50}
          rowsPerPageOptions={[25, 50, 100]}
          checkboxSelection={false}
          disableSelectionOnClick
          density="compact"
          sx={{
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'background.paper',
              borderBottom: 2,
              borderColor: 'divider',
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default LogTable;
