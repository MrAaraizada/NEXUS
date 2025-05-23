import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Breadcrumbs,
  Link,
  Divider,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  Chip,
} from '@mui/material';
import {
  History as HistoryIcon,
  People as PeopleIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AttendanceProcessor from '../components/AttendanceProcessor';

const AttendancePage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch course details');
        }

        setCourse(data.course);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAttendanceHistory = async () => {
      try {
        const response = await fetch(`/api/attendance/history/${courseId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch attendance history');
        }

        setAttendanceHistory(data.history);
      } catch (err) {
        console.error('Error fetching attendance history:', err);
      }
    };

    fetchCourse();
    fetchAttendanceHistory();
  }, [courseId]);

  const handleAttendanceComplete = (attendance) => {
    setSuccessMessage('Attendance processed successfully!');
    setShowSuccess(true);
    // Refresh attendance history
    fetchAttendanceHistory();
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Link color="inherit" href="/courses">
            Courses
          </Link>
          <Typography color="text.primary">{course?.name || 'Attendance'}</Typography>
        </Breadcrumbs>

        <Typography variant="h4" gutterBottom>
          Take Attendance
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          {course?.name} - {course?.code}
        </Typography>

        <Grid container spacing={3}>
          {/* Course Statistics Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Course Statistics
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon sx={{ mr: 1 }} />
                  <Typography>
                    Total Students: {course?.totalStudents || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HistoryIcon sx={{ mr: 1 }} />
                  <Typography>
                    Attendance Sessions: {attendanceHistory.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon sx={{ mr: 1 }} />
                  <Typography>
                    Last Session: {attendanceHistory[0]?.date || 'Never'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Attendance History Card */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Attendance History
                </Typography>
                <List>
                  {attendanceHistory.slice(0, 5).map((session) => (
                    <ListItem
                      key={session._id}
                      secondaryAction={
                        <Chip
                          label={`${session.presentCount}/${session.totalStudents}`}
                          color={session.presentCount === session.totalStudents ? 'success' : 'default'}
                        />
                      }
                    >
                      <ListItemIcon>
                        {session.presentCount === session.totalStudents ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={new Date(session.date).toLocaleDateString()}
                        secondary={`${session.presentCount} students present`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Attendance Processor */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Attendance Date"
                    value={selectedDate}
                    onChange={(newDate) => setSelectedDate(newDate)}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </LocalizationProvider>
              </Box>
              <AttendanceProcessor
                courseId={courseId}
                date={selectedDate}
                onProcessComplete={handleAttendanceComplete}
              />
            </Paper>
          </Grid>
        </Grid>

        <Snackbar
          open={showSuccess}
          autoHideDuration={6000}
          onClose={handleCloseSuccess}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default AttendancePage; 