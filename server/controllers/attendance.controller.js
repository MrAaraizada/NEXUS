const Attendance = require('../models/attendance.model');
const Course = require('../models/course.model');
const Student = require('../models/student.model');
const faceRecognition = require('../utils/faceRecognition');

// Process attendance from image
exports.processAttendance = async (req, res) => {
  try {
    const { courseId } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Get course and enrolled students
    const course = await Course.findById(courseId).populate('students');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Process image with face recognition
    const result = await faceRecognition.processAttendanceImage(
      imageFile.buffer,
      imageFile.originalname
    );

    // Create new attendance record
    const attendance = new Attendance({
      course: courseId,
      date: new Date(),
      imageUrl: result.imageUrl,
      status: 'draft'
    });

    // Process each detected face
    const studentUpdates = result.matches.map(async (match) => {
      const student = course.students.find(s => 
        s.faceData && s.faceData.id === match.matches[0]?.object_id
      );

      if (student && match.confidence > 0.7) {
        // Add attendance record
        attendance.records.push({
          student: student._id,
          status: 'present',
          verificationMethod: 'facial',
          verifiedBy: req.user._id,
          confidenceScore: match.confidence * 100
        });

        // Update student's attendance stats
        await student.updateAttendance(courseId, true);
      }
    });

    // Mark remaining students as absent
    course.students.forEach(student => {
      if (!attendance.records.find(r => r.student.toString() === student._id.toString())) {
        attendance.records.push({
          student: student._id,
          status: 'absent',
          verificationMethod: 'facial',
          verifiedBy: req.user._id,
          confidenceScore: 0
        });
      }
    });

    // Wait for all updates to complete
    await Promise.all(studentUpdates);

    // Save attendance record
    await attendance.save();

    // Return processed results
    res.json({
      message: 'Attendance processed successfully',
      attendance: {
        totalStudents: course.students.length,
        presentCount: attendance.totalPresent,
        absentCount: attendance.totalAbsent,
        lateCount: attendance.totalLate,
        imageUrl: result.imageUrl,
        records: attendance.records
      }
    });
  } catch (error) {
    console.error('Error processing attendance:', error);
    res.status(500).json({
      message: 'Error processing attendance',
      error: error.message
    });
  }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { records } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Update individual records
    for (const record of records) {
      const existingRecord = attendance.records.find(
        r => r.student.toString() === record.student
      );

      if (existingRecord) {
        existingRecord.status = record.status;
        existingRecord.verificationMethod = 'manual';
        existingRecord.verifiedBy = req.user._id;
        existingRecord.verificationTime = new Date();

        // Update student's attendance stats
        const student = await Student.findById(record.student);
        if (student) {
          await student.updateAttendance(
            attendance.course,
            record.status === 'present'
          );
        }
      }
    }

    attendance.status = 'final';
    await attendance.save();

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      message: 'Error updating attendance',
      error: error.message
    });
  }
};

// Get attendance history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { course: courseId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('records.student', 'name rollNumber')
      .sort('-date');

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({
      message: 'Error fetching attendance history',
      error: error.message
    });
  }
}; 