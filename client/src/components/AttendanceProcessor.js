import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import ImageUpload from './ImageUpload';

const AttendanceProcessor = ({ courseId, onProcessComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedRecords, setEditedRecords] = useState({});

  const handleImageSelect = (file) => {
    setSelectedImage(file);
    setError(null);
    setResults(null);
  };

  const handleProcess = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('courseId', courseId);

      const response = await fetch('/api/attendance/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process attendance');
      }

      setResults(data.attendance);
      if (onProcessComplete) {
        onProcessComplete(data.attendance);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = (studentId) => {
    if (!editMode) return;

    setEditedRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId]?.status === 'present' ? 'absent' : 'present',
      },
    }));
  };

  const handleSaveEdits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/${results._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: Object.entries(editedRecords).map(([studentId, record]) => ({
            student: studentId,
            ...record,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update attendance');
      }

      setResults(data.attendance);
      setEditMode(false);
      setEditedRecords({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ImageUpload
            onImageSelect={handleImageSelect}
            loading={loading}
            error={error}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleProcess}
              disabled={!selectedImage || loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Process Attendance'
              )}
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          {results && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Attendance Results</Typography>
                <IconButton
                  color={editMode ? 'primary' : 'default'}
                  onClick={() => setEditMode(!editMode)}
                >
                  <EditIcon />
                </IconButton>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Chip
                      label={`Total: ${results.totalStudents}`}
                      color="default"
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Chip
                      label={`Present: ${results.presentCount}`}
                      color="success"
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Chip
                      label={`Absent: ${results.absentCount}`}
                      color="error"
                      sx={{ width: '100%' }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <List>
                {results.records.map((record) => {
                  const isPresent = editedRecords[record.student._id]?.status || record.status === 'present';
                  
                  return (
                    <ListItem
                      key={record.student._id}
                      button={editMode}
                      onClick={() => handleStatusToggle(record.student._id)}
                    >
                      <ListItemIcon>
                        {isPresent ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Cancel color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={record.student.name}
                        secondary={record.student.rollNumber}
                      />
                      {record.confidenceScore > 0 && (
                        <ListItemSecondaryAction>
                          <Chip
                            size="small"
                            label={`${Math.round(record.confidenceScore)}% match`}
                            color={record.confidenceScore > 70 ? 'success' : 'warning'}
                          />
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  );
                })}
              </List>

              {editMode && Object.keys(editedRecords).length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveEdits}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default AttendanceProcessor; 