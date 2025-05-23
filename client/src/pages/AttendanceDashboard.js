import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Event as EventIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import AttendanceStats from '../components/AttendanceStats';
import StudentAttendanceHistory from '../components/StudentAttendanceHistory';
import AttendanceExport from '../components/AttendanceExport';
import DateAttendanceView from '../components/DateAttendanceView';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ padding: '24px 0' }}>
    {value === index && children}
  </div>
);

const AttendanceDashboard = () => {
  const { courseId } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setActiveTab(1); // Switch to student history tab
  };

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
          <Typography color="text.primary">Attendance</Typography>
        </Breadcrumbs>

        <Typography variant="h4" gutterBottom>
          Attendance Management
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<AssessmentIcon />}
              label="Statistics"
              iconPosition="start"
            />
            <Tab
              icon={<HistoryIcon />}
              label="Student History"
              iconPosition="start"
            />
            <Tab
              icon={<EventIcon />}
              label="Daily View"
              iconPosition="start"
            />
            <Tab
              icon={<FileDownloadIcon />}
              label="Export"
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <AttendanceStats
                    courseId={courseId}
                    onStudentSelect={handleStudentSelect}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {selectedStudent ? (
                    <StudentAttendanceHistory
                      studentId={selectedStudent._id}
                      courseId={courseId}
                    />
                  ) : (
                    <Card>
                      <CardContent>
                        <Typography variant="h6" align="center" gutterBottom>
                          Select a student from the Statistics tab to view their history
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                          Click on any student row in the statistics table to view their detailed attendance history
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <DateAttendanceView courseId={courseId} />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <AttendanceExport courseId={courseId} />
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
        </Paper>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label="Take Attendance"
                    color="primary"
                    onClick={() => window.location.href = `/courses/${courseId}/attendance/take`}
                    clickable
                  />
                  <Chip
                    label="View All Records"
                    color="secondary"
                    onClick={() => setActiveTab(2)}
                    clickable
                  />
                  <Chip
                    label="Export Data"
                    color="success"
                    onClick={() => setActiveTab(3)}
                    clickable
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last attendance taken: {new Date().toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total sessions this month: 12
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average attendance: 85%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AttendanceDashboard; 