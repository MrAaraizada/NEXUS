const VisualRecognitionV4 = require('ibm-watson/visual-recognition/v4');
const { IamAuthenticator } = require('ibm-watson/auth');
const { S3Client } = require('@aws-sdk/client-s3');

// Initialize Watson Visual Recognition
const visualRecognition = new VisualRecognitionV4({
  version: '2022-08-20',
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_API_KEY,
  }),
  serviceUrl: process.env.WATSON_URL,
});

// Initialize IBM Cloud Object Storage
const cosClient = new S3Client({
  endpoint: process.env.IBM_COS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.IBM_COS_API_KEY,
    secretAccessKey: process.env.IBM_COS_INSTANCE_CRN,
  },
});

module.exports = {
  visualRecognition,
  cosClient,
  bucketName: process.env.IBM_COS_BUCKET_NAME,
  collectionId: process.env.WATSON_COLLECTION_ID,
}; 