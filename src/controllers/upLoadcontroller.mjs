import fileUploadService from '../services/fileUploadService.mjs';
import userModel from '../models/userModel.mjs';
import courseModel from '../models/courseModel.mjs';
import lessonModel from '../models/lessonModel.mjs';

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Update user's profile picture
        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            { profilePicture: req.file.url },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: {
                profilePicture: req.file.url,
                user
            }
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile picture'
        });
    }
};

// Upload course thumbnail
export const uploadCourseThumbnail = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Verify course ownership
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Delete old thumbnail if exists
        if (course.thumbnailUrl) {
            await fileUploadService.deleteFile(course.thumbnailUrl);
        }

        // Update course thumbnail
        course.thumbnailUrl = req.file.url;
        await course.save();

        res.json({
            success: true,
            message: 'Course thumbnail uploaded successfully',
            data: {
                thumbnailUrl: req.file.url,
                optimizedUrls: {
                    small: fileUploadService.getOptimizedImageUrl(req.file.url, { width: 300, height: 200 }),
                    medium: fileUploadService.getOptimizedImageUrl(req.file.url, { width: 600, height: 400 }),
                    large: fileUploadService.getOptimizedImageUrl(req.file.url, { width: 1200, height: 800 })
                }
            }
        });
    } catch (error) {
        console.error('Course thumbnail upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading course thumbnail'
        });
    }
};

// Upload lesson resources
export const uploadLessonResources = async (req, res) => {
    try {
        const { lessonId } = req.params;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        // Verify lesson ownership
        const lesson = await lessonModel.findById(lessonId).populate('course');
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        if (lesson.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Process uploaded files
        const resources = req.files.map(file => ({
            name: file.originalname,
            url: file.url,
            type: this.getFileType(file.mimetype),
            size: file.size,
            uploadedAt: new Date()
        }));

        // Add resources to lesson
        lesson.resources.push(...resources);
        await lesson.save();

        res.json({
            success: true,
            message: `${resources.length} resource(s) uploaded successfully`,
            data: {
                resources,
                lesson: lesson
            }
        });
    } catch (error) {
        console.error('Lesson resources upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading lesson resources'
        });
    }
};

// Upload lesson video
export const uploadLessonVideo = async (req, res) => {
    try {
        const { lessonId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No video file uploaded'
            });
        }

        // Verify lesson ownership
        const lesson = await lessonModel.findById(lessonId).populate('course');
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        if (lesson.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Delete old video if exists
        if (lesson.videoUrl) {
            await fileUploadService.deleteFile(lesson.videoUrl);
        }

        // Update lesson video
        lesson.videoUrl = req.file.url;
        await lesson.save();

        res.json({
            success: true,
            message: 'Lesson video uploaded successfully',
            data: {
                videoUrl: req.file.url,
                lesson
            }
        });
    } catch (error) {
        console.error('Lesson video upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading lesson video'
        });
    }
};

// Delete uploaded file
export const deleteUploadedFile = async (req, res) => {
    try {
        const { fileUrl } = req.body;
        
        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'File URL is required'
            });
        }

        const result = await fileUploadService.deleteFile(fileUrl);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error deleting file',
                error: result.error
            });
        }
    } catch (error) {
        console.error('File deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file'
        });
    }
};

// Helper method to determine file type
function getFileType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype === 'application/pdf') return 'pdf';
    if (mimetype.includes('document') || mimetype.includes('word')) return 'document';
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'spreadsheet';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'presentation';
    return 'other';
}