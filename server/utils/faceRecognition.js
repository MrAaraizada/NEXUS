const { visualRecognition, cosClient, bucketName, collectionId } = require('../config/watson.config');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const tf = require('@tensorflow/tfjs-node');
const faceLandmarksDetection = require('@tensorflow-models/face-landmarks-detection');
const sharp = require('sharp');
const path = require('path');

class FaceRecognitionService {
  constructor() {
    this.model = null;
  }

  // Initialize face detection model
  async initModel() {
    if (!this.model) {
      this.model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
      );
    }
    return this.model;
  }

  // Upload image to IBM Cloud Object Storage
  async uploadImage(imageBuffer, filename) {
    const key = `attendance/${Date.now()}-${path.basename(filename)}`;
    
    await cosClient.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
    }));

    return `https://${bucketName}.${process.env.IBM_COS_ENDPOINT}/${key}`;
  }

  // Detect and extract faces from image
  async detectFaces(imageBuffer) {
    // Ensure model is initialized
    await this.initModel();

    // Convert image to tensor
    const image = await tf.node.decodeImage(imageBuffer);
    
    // Detect faces
    const faces = await this.model.estimateFaces({
      input: image,
      returnTensors: false,
      flipHorizontal: false,
      predictIrises: false
    });

    // Clean up
    tf.dispose(image);

    return faces;
  }

  // Process image and extract individual face images
  async extractFaces(imageBuffer) {
    const faces = await this.detectFaces(imageBuffer);
    const processedImage = sharp(imageBuffer);
    const metadata = await processedImage.metadata();

    return Promise.all(faces.map(async (face, index) => {
      const { topLeft, bottomRight } = face.boundingBox;
      
      // Extract face region with padding
      const width = bottomRight[0] - topLeft[0];
      const height = bottomRight[1] - topLeft[1];
      const padding = Math.min(width, height) * 0.2;

      const extract = await processedImage
        .extract({
          left: Math.max(0, Math.floor(topLeft[0] - padding)),
          top: Math.max(0, Math.floor(topLeft[1] - padding)),
          width: Math.min(metadata.width, Math.floor(width + 2 * padding)),
          height: Math.min(metadata.height, Math.floor(height + 2 * padding))
        })
        .toBuffer();

      return {
        faceId: index,
        buffer: extract,
        boundingBox: face.boundingBox,
        landmarks: face.landmarks,
      };
    }));
  }

  // Match faces against Watson Visual Recognition collection
  async matchFaces(faces) {
    const results = await Promise.all(faces.map(async (face) => {
      try {
        const params = {
          collectionIds: [collectionId],
          features: ['objects'],
          imagesFile: face.buffer,
        };

        const response = await visualRecognition.analyze(params);
        
        return {
          faceId: face.faceId,
          matches: response.result.images[0].objects,
          confidence: response.result.images[0].objects[0]?.confidence || 0,
        };
      } catch (error) {
        console.error(`Error matching face ${face.faceId}:`, error);
        return {
          faceId: face.faceId,
          matches: [],
          confidence: 0,
        };
      }
    }));

    return results;
  }

  // Process attendance image
  async processAttendanceImage(imageBuffer, filename) {
    try {
      // Upload original image
      const imageUrl = await this.uploadImage(imageBuffer, filename);

      // Extract faces from image
      const faces = await this.extractFaces(imageBuffer);

      // Match faces against collection
      const matches = await this.matchFaces(faces);

      return {
        imageUrl,
        faces: faces.length,
        matches: matches.filter(m => m.confidence > 0.7), // Filter high confidence matches
      };
    } catch (error) {
      console.error('Error processing attendance image:', error);
      throw error;
    }
  }

  // Add face to collection (for student enrollment)
  async addFaceToCollection(imageBuffer, studentId) {
    try {
      const faces = await this.extractFaces(imageBuffer);
      
      if (faces.length !== 1) {
        throw new Error('Image must contain exactly one face');
      }

      const params = {
        collectionId,
        imagesFile: faces[0].buffer,
        metadata: { studentId },
      };

      await visualRecognition.addImages(params);

      return {
        success: true,
        message: 'Face added to collection successfully',
      };
    } catch (error) {
      console.error('Error adding face to collection:', error);
      throw error;
    }
  }
}

module.exports = new FaceRecognitionService(); 