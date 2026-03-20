const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let storageBucket = null;

function initSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.log('Supabase credentials not provided. Storage upload disabled.');
    return false;
  }

  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    storageBucket = process.env.SUPABASE_BUCKET || 'greenbin-images';
    console.log('Supabase client initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error.message);
    return false;
  }
}

function generateFileName(originalName, prediction, deviceId = 'unknown') {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const predictionLower = prediction.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const sanitizedDeviceId = deviceId.toLowerCase().replace(/[^a-z0-9-]/g, 'unknown');
  return `${sanitizedDeviceId}/${predictionLower}/${timestamp}-${randomString}.${extension}`;
}

function generatePublicUrl(fileName) {
  if (!process.env.SUPABASE_URL) return null;

  const bucketName = storageBucket;
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`;
}

async function ensureBucketExists() {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.storage.getBucket(storageBucket);

    if (error) {
      if (error.message.includes('not found')) {
        console.log(`Creating bucket: ${storageBucket}`);
        const { data: newBucket, error: createError } = await supabase.storage.createBucket(storageBucket, {
          public: true,
          fileSizeLimit: 10485760
        });

        if (createError) {
          console.error('Failed to create bucket:', createError.message);
          return false;
        }
        console.log('Bucket created successfully');
      } else {
        console.error('Bucket check error:', error.message);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Bucket check error:', error.message);
    return false;
  }
}

async function uploadImage(buffer, fileName) {
  if (!supabase) {
    console.log('Supabase not configured, skipping upload');
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(storageBucket)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }

    const publicUrl = generatePublicUrl(fileName);
    console.log('Image uploaded successfully:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Upload error:', error.message);
    return null;
  }
}

function uploadImageAsync(buffer, fileName) {
  setImmediate(async () => {
    try {
      await ensureBucketExists();
      await uploadImage(buffer, fileName);
    } catch (error) {
      console.error('Background upload error:', error.message);
    }
  });
}

module.exports = {
  initSupabase,
  generateFileName,
  generatePublicUrl,
  uploadImageAsync,
  isConfigured: () => !!supabase
};