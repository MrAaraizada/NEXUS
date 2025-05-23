const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load face detection models
async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('models');
}

// Initialize models
loadModels().catch(console.error);

async function processImage(imagePath, students) {
  try {
    // Load and process the image
    const img = await canvas.loadImage(imagePath);
    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      throw new Error('No faces detected in the image');
    }

    // Create face descriptors for all students
    const labeledDescriptors = await Promise.all(
      students.map(async (student) => {
        if (!student.photo) {
          return null;
        }

        try {
          const studentImg = await canvas.loadImage(student.photo);
          const studentDetections = await faceapi.detectSingleFace(studentImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!studentDetections) {
            return null;
          }

          return new faceapi.LabeledFaceDescriptors(
            student._id.toString(),
            [studentDetections.descriptor]
          );
        } catch (error) {
          console.error(`Error processing student ${student._id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validDescriptors = labeledDescriptors.filter(Boolean);

    // Create face matcher
    const faceMatcher = new faceapi.FaceMatcher(validDescriptors, 0.6);

    // Match detected faces with student faces
    const results = students.map(student => {
      const matches = detections.map(detection => {
        const match = faceMatcher.findBestMatch(detection.descriptor);
        return {
          studentId: match.label,
          distance: match.distance
        };
      });

      // Find the best match for this student
      const bestMatch = matches.reduce((best, current) => {
        if (current.studentId === student._id.toString() && 
            current.distance < (best?.distance || Infinity)) {
          return current;
        }
        return best;
      }, null);

      return {
        student,
        present: bestMatch !== null,
        confidence: bestMatch ? (1 - bestMatch.distance) * 100 : 0
      };
    });

    return results;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

module.exports = {
  processImage
}; 