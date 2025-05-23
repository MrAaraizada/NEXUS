/*Nexus - AI-Powered Teacher Management System

Nexus is a modern web application designed to streamline administrative tasks for college teachers. It features AI-powered attendance tracking, class management, and an intelligent chatbot assistant.

## Features

- 🤖 AI-powered attendance tracking using facial recognition
- 📊 Real-time attendance analytics and reporting
- 📅 Class scheduling and calendar management
- 📝 Assignment and test management
- 💬 IBM Watson-powered chatbot assistant
- 👥 Student tracking and performance monitoring
- 📱 Responsive design for all devices 

## Tech Stack

### Frontend
- React.js with Material-UI
- Redux Toolkit for state management
- Socket.IO for real-time updates
- Responsive and modern UI design

### Backend
- Node.js with Express
- MongoDB for database
- JWT authentication
- IBM Watson services integration
- TensorFlow.js for face detection
- Socket.IO for real-time communication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- IBM Cloud account with Watson services
- npm or yarn package manager

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nexus
JWT_SECRET=your-super-secret-jwt-key

# IBM Watson Configuration
WATSON_API_KEY=your-watson-api-key
WATSON_URL=your-watson-url
WATSON_ASSISTANT_ID=your-assistant-id

# IBM Cloud Object Storage
IBM_COS_ENDPOINT=your-cos-endpoint
IBM_COS_API_KEY=your-cos-api-key
IBM_COS_INSTANCE_CRN=your-cos-instance-crn
IBM_COS_BUCKET_NAME=your-bucket-name
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nexus.git
   cd nexus
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

4. Start the development servers:
   ```bash
   # In the root directory
   npm run dev:full
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Documentation

### Authentication
- POST `/api/auth/register` - Register a new teacher
- POST `/api/auth/login` - Login with credentials

### Attendance
- POST `/api/attendance/process` - Process attendance from image
- GET `/api/attendance/history` - Get attendance history

### Classes
- GET `/api/classes` - Get all classes
- POST `/api/classes` - Create a new class
- PUT `/api/classes/:id` - Update class details
- DELETE `/api/classes/:id` - Delete a class

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- IBM Watson for AI services
- TensorFlow.js team for face detection capabilities
- Material-UI for the beautiful components */
// server.js
const express = require('express');
const http = require('http');
const open = require('open');

// Create an Express application
const app = express();
const port = 3000;

// Redirect root to the target URL
app.get('/', (req, res) => {
  res.redirect('https://preview--nexus-attend-ai-hub.lovable.app/dashboard');
});

// Serve static files from a public directory if needed
app.use(express.static('public'));

// Create and start the server
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Redirecting to: https://preview--nexus-attend-ai-hub.lovable.app/dashboard`);
  
  // Automatically open the browser when the server starts
  open(`http://localhost:${port}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
