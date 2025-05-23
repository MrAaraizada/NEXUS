import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Cancel,
  PhotoCamera,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);

      // Replace with your actual API endpoint
      const response = await fetch('/api/attendance/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process attendance');
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Upload a class photo to automatically mark attendance
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: 300,
                border: '2px dashed #ccc',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <CloudUpload sx={{ fontSize: 60, color: 'text.secondary' }} />
                  <Typography variant="body1" color="textSecondary">
                    Drag and drop or click to upload
                  </Typography>
                </Box>
              )}
            </Box>

            <label htmlFor="contained-button-file">
              <Input
                accept="image/*"
                id="contained-button-file"
                type="file"
                onChange={handleImageChange}
              />
              <Button
                variant="contained"
                component="span"
                startIcon={<PhotoCamera />}
              >
                Select Image
              </Button>
            </label>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!image || loading}
              sx={{ mt: 2 }}
              fullWidth
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Process Attendance'
              )}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attendance Results
              </Typography>
              {results ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      Total Students: {results.totalStudents}
                    </Typography>
                    <Typography variant="body1">
                      Present: {results.presentCount}
                    </Typography>
                    <Typography variant="body1">
                      Absent: {results.absentCount}
                    </Typography>
                  </Box>
                  <Divider />
                  <List>
                    {results.students.map((student) => (
                      <ListItem key={student.id}>
                        <ListItemIcon>
                          {student.present ? (
                            <CheckCircle color="success" />
                          ) : (
                            <Cancel color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={student.name}
                          secondary={student.present ? 'Present' : 'Absent'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <Typography variant="body1" color="textSecondary">
                  Upload an image to see attendance results
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Attendance; 