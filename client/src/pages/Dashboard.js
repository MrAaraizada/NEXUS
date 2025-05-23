import React from 'react';
import { useSelector } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  PeopleAlt,
  Class as ClassIcon,
  Assignment,
  Timeline,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ textAlign: 'center' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const stats = [
    {
      title: 'Total Students',
      value: '150',
      icon: <PeopleAlt sx={{ color: 'primary.main' }} />,
      color: 'primary',
    },
    {
      title: 'Active Classes',
      value: '4',
      icon: <ClassIcon sx={{ color: 'success.main' }} />,
      color: 'success',
    },
    {
      title: 'Assignments',
      value: '12',
      icon: <Assignment sx={{ color: 'warning.main' }} />,
      color: 'warning',
    },
    {
      title: 'Attendance Rate',
      value: '92%',
      icon: <Timeline sx={{ color: 'info.main' }} />,
      color: 'info',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Here's what's happening with your classes today
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <CardHeader title="Upcoming Classes" />
            <CardContent>
              {/* Add Calendar or Timeline Component here */}
              <Typography variant="body1">
                Calendar integration coming soon...
              </Typography>
            </CardContent>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <CardHeader title="Recent Activities" />
            <CardContent>
              {/* Add Activity Feed Component here */}
              <Typography variant="body1">
                Activity feed integration coming soon...
              </Typography>
            </CardContent>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 