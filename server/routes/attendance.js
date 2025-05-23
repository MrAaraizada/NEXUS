const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Student = require('../models/Student');
const { processImage } = require('../services/faceRecognition');
const { createObjectCsvWriter } = require('csv-writer');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/attendance';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get course details
router.get('/course/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('students', 'name rollNumber photo')
      .lean();

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      course: {
        ...course,
        totalStudents: course.students.length
      }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Error fetching course details' });
  }
});

// Get attendance history for a course
router.get('/history/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const attendanceHistory = await Attendance.find({ course: courseId })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Attendance.countDocuments({ course: courseId });

    res.json({
      history: attendanceHistory,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ message: 'Error fetching attendance history' });
  }
});

// Process attendance from image
router.post('/process', upload.single('image'), async (req, res) => {
  try {
    const { courseId, date } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Get course and students
    const course = await Course.findById(courseId)
      .populate('students', 'name rollNumber photo')
      .lean();

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Process the image
    const results = await processImage(req.file.path, course.students);

    // Create attendance record
    const attendance = new Attendance({
      course: courseId,
      date: date || new Date(),
      imagePath: req.file.path,
      records: results.map(result => ({
        student: result.student._id,
        present: result.present,
        confidence: result.confidence
      })),
      totalStudents: course.students.length,
      presentCount: results.filter(r => r.present).length
    });

    await attendance.save();

    // Clean up the uploaded file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting uploaded file:', err);
    });

    res.json({
      message: 'Attendance processed successfully',
      attendance: {
        ...attendance.toObject(),
        records: results.map(result => ({
          ...result,
          student: {
            _id: result.student._id,
            name: result.student.name,
            rollNumber: result.student.rollNumber
          }
        }))
      }
    });
  } catch (error) {
    console.error('Error processing attendance:', error);
    res.status(500).json({ message: 'Error processing attendance' });
  }
});

// Update attendance record
router.put('/:attendanceId', async (req, res) => {
  try {
    const { records } = req.body;
    const attendance = await Attendance.findById(req.params.attendanceId);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Update records
    attendance.records = records;
    attendance.presentCount = records.filter(r => r.present).length;
    await attendance.save();

    res.json({
      message: 'Attendance record updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Error updating attendance record' });
  }
});

// Get attendance statistics for a course
router.get('/stats/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { course: courseId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('records.student', 'name rollNumber')
      .lean();

    // Calculate statistics
    const totalSessions = attendanceRecords.length;
    const totalStudents = attendanceRecords[0]?.totalStudents || 0;
    
    const studentStats = {};
    attendanceRecords.forEach(record => {
      record.records.forEach(rec => {
        if (!studentStats[rec.student._id]) {
          studentStats[rec.student._id] = {
            student: rec.student,
            presentCount: 0,
            totalSessions: 0
          };
        }
        studentStats[rec.student._id].totalSessions++;
        if (rec.present) {
          studentStats[rec.student._id].presentCount++;
        }
      });
    });

    // Calculate attendance percentages
    const stats = Object.values(studentStats).map(stat => ({
      ...stat,
      attendancePercentage: (stat.presentCount / stat.totalSessions) * 100
    }));

    res.json({
      totalSessions,
      totalStudents,
      averageAttendance: totalSessions > 0 
        ? stats.reduce((sum, stat) => sum + stat.attendancePercentage, 0) / stats.length 
        : 0,
      studentStats: stats
    });
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({ message: 'Error fetching attendance statistics' });
  }
});

// Get student's attendance history
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate } = req.query;

    const query = { 'records.student': studentId };
    if (courseId) {
      query.course = courseId;
    }
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceHistory = await Attendance.find(query)
      .populate('course', 'name code')
      .sort({ date: -1 })
      .lean();

    const student = await Student.findById(studentId).lean();

    res.json({
      student,
      attendanceHistory: attendanceHistory.map(record => ({
        date: record.date,
        course: record.course,
        present: record.records.find(r => r.student.toString() === studentId)?.present || false,
        confidence: record.records.find(r => r.student.toString() === studentId)?.confidence || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    res.status(500).json({ message: 'Error fetching student attendance history' });
  }
});

// Export attendance data
router.get('/export/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { course: courseId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('records.student', 'name rollNumber')
      .populate('course', 'name code')
      .sort({ date: 1 })
      .lean();

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: 'No attendance records found' });
    }

    // Prepare CSV data
    const csvWriter = createObjectCsvWriter({
      path: 'attendance_export.csv',
      header: [
        { id: 'date', title: 'Date' },
        { id: 'studentName', title: 'Student Name' },
        { id: 'rollNumber', title: 'Roll Number' },
        { id: 'status', title: 'Status' },
        { id: 'confidence', title: 'Confidence Score' }
      ]
    });

    const records = attendanceRecords.flatMap(record => 
      record.records.map(rec => ({
        date: new Date(record.date).toLocaleDateString(),
        studentName: rec.student.name,
        rollNumber: rec.student.rollNumber,
        status: rec.present ? 'Present' : 'Absent',
        confidence: rec.confidence
      }))
    );

    await csvWriter.writeRecords(records);

    res.download('attendance_export.csv', 'attendance_export.csv', (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Clean up the file
      fs.unlink('attendance_export.csv', (err) => {
        if (err) console.error('Error deleting export file:', err);
      });
    });
  } catch (error) {
    console.error('Error exporting attendance data:', error);
    res.status(500).json({ message: 'Error exporting attendance data' });
  }
});

// Get attendance for a specific date
router.get('/date/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const attendance = await Attendance.findOne({
      course: courseId,
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
      }
    })
    .populate('records.student', 'name rollNumber photo')
    .lean();

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found for this date' });
    }

    res.json({
      date: attendance.date,
      totalStudents: attendance.totalStudents,
      presentCount: attendance.presentCount,
      records: attendance.records.map(record => ({
        student: record.student,
        present: record.present,
        confidence: record.confidence
      }))
    });
  } catch (error) {
    console.error('Error fetching attendance for date:', error);
    res.status(500).json({ message: 'Error fetching attendance for date' });
  }
});

module.exports = router; 