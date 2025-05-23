const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    venue: {
      type: String,
      required: true
    }
  }],
  semester: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  syllabus: {
    type: String, // URL to stored syllabus file
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for getting total students
courseSchema.virtual('totalStudents').get(function() {
  return this.students.length;
});

// Method to check if a time slot is available
courseSchema.methods.isTimeSlotAvailable = async function(day, startTime, endTime) {
  const Course = this.constructor;
  const conflictingCourse = await Course.findOne({
    'schedule.day': day,
    'schedule.startTime': { $lt: endTime },
    'schedule.endTime': { $gt: startTime },
    _id: { $ne: this._id },
    teacher: this.teacher
  });
  return !conflictingCourse;
};

const Course = mongoose.model('Course', courseSchema);
module.exports = Course; 