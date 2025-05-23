const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  present: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    default: 0
  }
});

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  imagePath: {
    type: String,
    required: true
  },
  records: [attendanceRecordSchema],
  totalStudents: {
    type: Number,
    required: true
  },
  presentCount: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
attendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for better query performance
attendanceSchema.index({ course: 1, date: -1 });
attendanceSchema.index({ 'records.student': 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 