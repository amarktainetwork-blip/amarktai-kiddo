import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3();

export interface UploadedFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  buffer: Buffer,
  mimeType: string,
  fileType: 'audio' | 'image'
): Promise<UploadedFile> {
  const bucket = process.env.AWS_S3_BUCKET || 'amarktai-kiddo-media';
  const extension = getFileExtension(mimeType);
  const key = `${fileType}s/${uuidv4()}${extension}`;

  const params: AWS.S3.PutObjectRequest = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read',
  };

  try {
    await s3.putObject(params).promise();
    
    const url = `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
    return {
      key,
      url,
      size: buffer.length,
      mimeType,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to storage');
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const bucket = process.env.AWS_S3_BUCKET || 'amarktai-kiddo-media';

  const params: AWS.S3.DeleteObjectRequest = {
    Bucket: bucket,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from storage');
  }
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/wav': '.wav',
    'audio/mp3': '.mp3',
    'audio/mpeg': '.mp3',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };

  return mimeToExt[mimeType] || '.bin';
}

export function getPresignedUrl(key: string, expiresIn: number = 3600): string {
  const bucket = process.env.AWS_S3_BUCKET || 'amarktai-kiddo-media';

  const params = {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn,
  };

  return s3.getSignedUrl('getObject', params);
}
