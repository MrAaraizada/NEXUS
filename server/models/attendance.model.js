const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  records: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    },
    verificationMethod: {
      type: String,
      enum: ['facial', 'manual'],
      required: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationTime: {
      type: Date,
      default: Date.now
    },
    confidenceScore: {
      type: Number, // For facial recognition confidence
      min: 0,
      max: 100
    }
  }],
  totalPresent: {
    type: Number,
    default: 0
  },
  totalAbsent: {
    type: Number,
    default: 0
  },
  totalLate: {
    type: Number,
    default: 0
  },
  imageUrl: {
    type: String // URL to stored class photo
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'final'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Index for efficient querying
attendanceSchema.index({ course: 1, date: 1 }, { unique: true });

// Virtual for attendance percentage
attendanceSchema.virtual('attendancePercentage').get(function() {
  const total = this.totalPresent + this.totalAbsent + this.totalLate;
  return total ? (this.totalPresent / total) * 100 : 0;
});

// Method to update attendance counts
attendanceSchema.methods.updateCounts = function() {
  const counts = this.records.reduce((acc, record) => {
    acc[record.status]++;
    return acc;
  }, { present: 0, absent: 0, late: 0 });

  this.totalPresent = counts.present;
  this.totalAbsent = counts.absent;
  this.totalLate = counts.late;
};

// Pre-save middleware to update counts
attendanceSchema.pre('save', function(next) {
  this.updateCounts();
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance; 