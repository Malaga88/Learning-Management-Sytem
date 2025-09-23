import express from 'express';
import { 
    uploadProfilePicture,
    uploadCourseThumbnail,
    uploadLessonResources,
    uploadLessonVideo,
    deleteUploadedFile
} from '../controllers/uploadController.mjs';
import { verifyToken, authorize } from '../middleware/auth.mjs';
import fileUploadService from '../services/fileUploadService.mjs';

const uploadRouter = express.Router();

// Profile picture upload (authenticated users only)
uploadRouter.post('/profile-picture',
    verifyToken,
    fileUploadService.uploadSingle('profilePicture', {
        allowedTypes: /jpeg|jpg|png|gif/,
        maxSize: 5 * 1024 * 1024 // 5MB
    }),
    uploadProfilePicture
);

// Course thumbnail upload (instructors and admins only)
uploadRouter.post('/course/:courseId/thumbnail',
    verifyToken,
    authorize('instructor', 'admin'),
    fileUploadService.uploadSingle('thumbnail', {
        allowedTypes: /jpeg|jpg|png|gif/,
        maxSize: 10 * 1024 * 1024 // 10MB
    }),
    uploadCourseThumbnail
);

// Lesson resources upload (instructors and admins only)
uploadRouter.post('/lesson/:lessonId/resources',
    verifyToken,
    authorize('instructor', 'admin'),
    fileUploadService.uploadMultiple('resources', 10, {
        maxSize: 50 * 1024 * 1024 // 50MB per file
    }),
    uploadLessonResources
);

// Lesson video upload (instructors and admins only)
uploadRouter.post('/lesson/:lessonId/video',
    verifyToken,
    authorize('instructor', 'admin'),
    fileUploadService.uploadSingle('video', {
        allowedTypes: /mp4|avi|mov|webm|mkv/,
        maxSize: 500 * 1024 * 1024 // 500MB
    }),
    uploadLessonVideo
);

// Delete uploaded file (authenticated users only)
uploadRouter.delete('/file',
    verifyToken,
    deleteUploadedFile
);

// Serve uploaded files (for local storage)
uploadRouter.use('/files', express.static('./uploads'));

// Serve certificates
uploadRouter.use('/certificates', express.static('./certificates'));

export default uploadRouter;