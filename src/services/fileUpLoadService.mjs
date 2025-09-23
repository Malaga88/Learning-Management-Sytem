import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs/promises';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class FileUploadService {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        // Cloudinary storage for production
        if (process.env.NODE_ENV === 'production' && process.env.CLOUDINARY_CLOUD_NAME) {
            this.cloudinaryStorage = new CloudinaryStorage({
                cloudinary: cloudinary,
                params: {
                    folder: 'lms-uploads',
                    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'mp4', 'avi', 'mov'],
                    resource_type: 'auto'
                }
            });
        }

        // Local storage for development
        this.localStorage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const uploadDir = './uploads';
                try {
                    await fs.access(uploadDir);
                } catch {
                    await fs.mkdir(uploadDir, { recursive: true });
                }
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });
    }

    getUploadMiddleware(options = {}) {
        const storage = this.shouldUseCloudinary() ? this.cloudinaryStorage : this.localStorage;
        
        return multer({
            storage: storage,
            limits: {
                fileSize: options.maxSize || 50 * 1024 * 1024, // 50MB default
                files: options.maxFiles || 10
            },
            fileFilter: (req, file, cb) => {
                const allowedTypes = options.allowedTypes || 
                    /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|mp4|avi|mov|webm/;
                
                const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
                const mimetype = allowedTypes.test(file.mimetype);
                
                if (mimetype && extname) {
                    return cb(null, true);
                } else {
                    cb(new Error(`Invalid file type. Allowed types: ${options.allowedTypes || 'images, documents, videos'}`));
                }
            }
        });
    }

    shouldUseCloudinary() {
        return process.env.NODE_ENV === 'production' && 
               process.env.CLOUDINARY_CLOUD_NAME && 
               this.cloudinaryStorage;
    }

    async uploadSingle(fieldName, options = {}) {
        const upload = this.getUploadMiddleware(options).single(fieldName);
        
        return (req, res, next) => {
            upload(req, res, (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
                
                if (req.file) {
                    req.file.url = this.shouldUseCloudinary() ? 
                        req.file.path : 
                        `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
                }
                
                next();
            });
        };
    }

    async uploadMultiple(fieldName, maxCount = 10, options = {}) {
        const upload = this.getUploadMiddleware(options).array(fieldName, maxCount);
        
        return (req, res, next) => {
            upload(req, res, (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
                
                if (req.files) {
                    req.files = req.files.map(file => ({
                        ...file,
                        url: this.shouldUseCloudinary() ? 
                            file.path : 
                            `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
                    }));
                }
                
                next();
            });
        };
    }

    async deleteFile(fileUrl) {
        try {
            if (this.shouldUseCloudinary()) {
                // Extract public_id from Cloudinary URL
                const publicId = this.extractCloudinaryPublicId(fileUrl);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            } else {
                // Delete local file
                const filename = path.basename(fileUrl);
                const filePath = path.join('./uploads', filename);
                await fs.unlink(filePath);
            }
            return { success: true };
        } catch (error) {
            console.error('File deletion error:', error);
            return { success: false, error: error.message };
        }
    }

    extractCloudinaryPublicId(url) {
        const matches = url.match(/\/([^\/]+)\.[^\/]+$/);
        return matches ? matches[1] : null;
    }

    // Generate optimized image URLs for different use cases
    getOptimizedImageUrl(originalUrl, options = {}) {
        if (!this.shouldUseCloudinary()) {
            return originalUrl;
        }

        const { width, height, quality = 'auto', format = 'auto' } = options;
        let transformations = [`q_${quality}`, `f_${format}`];
        
        if (width) transformations.push(`w_${width}`);
        if (height) transformations.push(`h_${height}`);
        if (width && height) transformations.push('c_fill');
        
        return originalUrl.replace('/upload/', `/upload/${transformations.join(',')}/`);
    }
}

export default new FileUploadService();