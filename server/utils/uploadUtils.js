const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

// Initialize Cloudflare R2 S3 client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
  },
});

// File filter to allow only common image extensions
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
};

// Use memory storage to intercept raw buffers for compression
const multerUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Support large file uploads up to 50MB
});

// Compress and optimize image using Sharp (converting to highly-efficient WebP)
const optimizeImage = async (fileBuffer) => {
  let pipeline = sharp(fileBuffer).rotate(); // Auto-rotates based on EXIF camera metadata

  // Resize maximum bounds (e.g. max 1600px width or height to preserve layout and high-fidelity)
  pipeline = pipeline.resize({
    width: 1600,
    height: 1600,
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Convert to highly optimized webp format (effort: 6 produces smallest file sizes in KBs without pixelation)
  const optimizedBuffer = await pipeline
    .webp({ quality: 80, effort: 6 })
    .toBuffer();

  return {
    buffer: optimizedBuffer,
    ext: '.webp',
    mimeType: 'image/webp',
  };
};

// Custom middleware to process files, compress them, and upload them to R2 or Local Storage
const optimizeAndUpload = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return next();

    // Verify Cloudflare R2 configurations are fully populated
    const isR2Configured =
      process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY &&
      process.env.CLOUDFLARE_R2_SECRET_KEY &&
      process.env.CLOUDFLARE_R2_BUCKET_NAME;

    for (const file of files) {
      // Determine destination folder based on context
      let folder = req.headers['x-folder'] || req.query.folder;
      if (!folder) {
        const pathLower = req.originalUrl.toLowerCase();
        if (pathLower.includes('product')) {
          folder = 'products';
        } else if (pathLower.includes('category') || pathLower.includes('categories')) {
          folder = 'categories';
        } else if (pathLower.includes('banner')) {
          folder = 'banners';
        } else if (pathLower.includes('cms') || pathLower.includes('settings')) {
          folder = 'cms';
        } else {
          folder = 'general';
        }
      }

      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      let finalBuffer = file.buffer;
      let finalExt = path.extname(file.originalname).toLowerCase();
      let finalMime = file.mimetype;

      // Apply compression and conversion if the file is an image (excluding animated gifs)
      if (file.mimetype.startsWith('image/') && !file.mimetype.includes('gif')) {
        try {
          const opt = await optimizeImage(file.buffer);
          finalBuffer = opt.buffer;
          finalExt = opt.ext;
          finalMime = opt.mimeType;
        } catch (err) {
          console.error('Image compression failed, using original file:', err);
        }
      }

      const filename = `${unique}${finalExt}`;
      const r2Key = `${folder}/${filename}`;

      if (isR2Configured) {
        try {
          // Upload to Cloudflare R2 Bucket
          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
              Key: r2Key,
              Body: finalBuffer,
              ContentType: finalMime,
            })
          );

          file.key = r2Key;
          file.filename = filename;
          if (process.env.CLOUDFLARE_R2_PUBLIC_URL) {
            file.url = `${process.env.CLOUDFLARE_R2_PUBLIC_URL.replace(/\/$/, '')}/${r2Key}`;
          } else {
            file.url = `https://${process.env.CLOUDFLARE_R2_BUCKET_NAME}.r2.cloudflarestorage.com/${r2Key}`;
          }
        } catch (r2Err) {
          console.error('R2 upload failed (e.g. invalid credentials), falling back to local storage:', r2Err);
          
          // Local directory fallback
          const uploadDir = path.join(__dirname, '../uploads', folder);
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const localPath = path.join(uploadDir, filename);
          fs.writeFileSync(localPath, finalBuffer);

          const host = req.get('host');
          const protocol = req.protocol;
          file.filename = filename;
          file.key = `${folder}/${filename}`;
          file.url = `${protocol}://${host}/uploads/${folder}/${filename}`;
        }
      } else {
        // Local directory fallback
        const uploadDir = path.join(__dirname, '../uploads', folder);
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const localPath = path.join(uploadDir, filename);
        fs.writeFileSync(localPath, finalBuffer);

        const host = req.get('host');
        const protocol = req.protocol;
        file.filename = filename;
        file.key = `${folder}/${filename}`;
        file.url = `${protocol}://${host}/uploads/${folder}/${filename}`;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Helper function to return public URL
const getPublicUrl = (file) => {
  if (!file) return null;
  return file.url || `/uploads/${file.filename}`;
};

module.exports = {
  any: () => (req, res, next) => {
    multerUpload.any()(req, res, (err) => {
      if (err) return next(err);
      optimizeAndUpload(req, res, next);
    });
  },
  getPublicUrl,
};
