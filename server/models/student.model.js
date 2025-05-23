const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  profileImage: {
    type: String // URL to stored profile image
  },
  faceData: {
    type: Object, // Store facial recognition data
    select: false // Don't include in normal queries
  },
  attendance: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    present: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for getting attendance percentage
studentSchema.virtual('attendancePercentage').get(function() {
  if (!this.attendance.length) return 0;
  
  const totalPresent = this.attendance.reduce((sum, record) => sum + record.present, 0);
  const totalClasses = this.attendance.reduce((sum, record) => sum + record.total, 0);
  
  return totalClasses ? (totalPresent / totalClasses) * 100 : 0;
});

// Method to update attendance
studentSchema.methods.updateAttendance = async function(courseId, isPresent) {
  const attendanceRecord = this.attendance.find(
    record => record.course.toString() === courseId.toString()
  );

  if (attendanceRecord) {
    attendanceRecord.present += isPresent ? 1 : 0;
    attendanceRecord.total += 1;
    attendanceRecord.lastUpdated = new Date();
  } else {
    this.attendance.push({
      course: courseId,
      present: isPresent ? 1 : 0,
      total: 1,
      lastUpdated: new Date()
    });
  }

  await this.save();
};

const Student = mongoose.model('Student', studentSchema);
module.exports = Student; 