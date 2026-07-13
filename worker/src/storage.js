const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

// Cloudflare R2 setup
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxxxx.r2.dev

/**
 * Uploads a local file to Cloudflare R2
 * @param {string} localFilePath - Path to the file to upload
 * @param {string} destinationFolder - Folder path in R2 (e.g. 'raw_footage')
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
async function uploadToR2(localFilePath, destinationFolder = '') {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File not found: ${localFilePath}`);
  }

  const fileName = path.basename(localFilePath);
  const objectKey = destinationFolder ? `${destinationFolder}/${fileName}` : fileName;
  const mimeType = mime.lookup(localFilePath) || 'application/octet-stream';

  console.log(`[STORAGE] Uploading ${fileName} to R2...`);

  const fileStream = fs.createReadStream(localFilePath);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Body: fileStream,
    ContentType: mimeType,
  });

  try {
    await s3Client.send(command);
    console.log(`[STORAGE] Successfully uploaded ${fileName} to R2`);
    
    // Construct the public URL
    return `${PUBLIC_URL}/${objectKey}`;
  } catch (error) {
    console.error(`[STORAGE ERROR] Failed to upload to R2:`, error);
    throw error;
  }
}

async function deleteFromR2(fileUrl) {
  if (!fileUrl.startsWith(PUBLIC_URL)) return;
  const objectKey = fileUrl.replace(`${PUBLIC_URL}/`, '');
  console.log(`[STORAGE] Deleting ${objectKey} from R2...`);
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });
  try {
    await s3Client.send(command);
    console.log(`[STORAGE] Successfully deleted ${objectKey} from R2`);
  } catch (error) {
    console.error(`[STORAGE ERROR] Failed to delete from R2:`, error);
  }
}

module.exports = { uploadToR2, deleteFromR2 };
