import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

const DateAttendanceView = ({ courseId }) => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/attendance/date/${courseId}?date=${format(selectedDate, 'yyyy-MM-dd')}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch attendance data');
      }

      setAttendance(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchAttendance();
    }
  }, [courseId, selectedDate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {attendance && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Attendance for {format(new Date(attendance.date), 'MMMM d, yyyy')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  label={`Total: ${attendance.totalStudents}`}
                  color="primary"
                />
                <Chip
                  label={`Present: ${attendance.presentCount}`}
                  color="success"
                />
                <Chip
                  label={`Absent: ${attendance.totalStudents - attendance.presentCount}`}
                  color="error"
                />
              </Box>
            </Box>

            <List>
              {attendance.records.map((record) => (
                <ListItem
                  key={record.student._id}
                  secondaryAction={
                    <Chip
                      label={`${record.confidence.toFixed(1)}%`}
                      color={record.present ? 'success' : 'error'}
                    />
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      src={record.student.photo}
                      alt={record.student.name}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={record.student.name}
                    secondary={`Roll No: ${record.student.rollNumber}`}
                  />
                  <ListItemIcon>
                    {record.present ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <CancelIcon color="error" />
                    )}
                  </ListItemIcon>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DateAttendanceView; 