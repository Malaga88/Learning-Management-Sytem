import lessonProgressModel from "../models/lessonProgressModel.mjs";
import lessonModel from "../models/lessonModel.mjs";
import enrollmentModel from "../models/enrollmentModel.mjs";

// ✅ Mark lesson as complete (and update enrollment progress)
export const markLessonComplete = async (req, res) => {
  try {
    const { userId, lessonId } = req.body;

    // Ensure lesson exists
    const lesson = await lessonModel.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Upsert progress record
    const progress = await lessonProgressModel.findOneAndUpdate(
      { user: userId, lesson: lessonId },
      { status: "completed", completedAt: new Date() },
      { new: true, upsert: true }
    );

    // ✅ Update enrollment progress
    const courseId = lesson.course;

    const totalLessons = await lessonModel.countDocuments({ course: courseId });
    const completedLessons = await lessonProgressModel.countDocuments({
      user: userId,
      status: "completed",
      lesson: { $in: await lessonModel.find({ course: courseId }).distinct("_id") }
    });

    const percentage = Math.round((completedLessons / totalLessons) * 100);

    await enrollmentModel.findOneAndUpdate(
      { user: userId, course: courseId },
      { progress: percentage },
      { new: true, upsert: true } // ensures enrollment exists
    );

    res.json({ message: "Lesson marked as completed", progress, courseProgress: percentage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error marking lesson complete", error: err.message });
  }
};

// ✅ Get user progress for a course (with percentage & lessons)
export const getUserCourseProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const totalLessons = await lessonModel.countDocuments({ course: courseId });

    if (totalLessons === 0) {
      return res.json({ message: "No lessons in this course", progress: [] });
    }

    const completedLessons = await lessonProgressModel.find({
      user: userId,
      status: "completed"
    }).populate({
      path: "lesson",
      match: { course: courseId },
      select: "title order"
    });

    const filteredCompleted = completedLessons.filter(p => p.lesson !== null);

    const completedCount = filteredCompleted.length;
    const percentage = Math.round((completedCount / totalLessons) * 100);

    // 🔄 Sync enrollment record with latest progress
    await enrollmentModel.findOneAndUpdate(
      { user: userId, course: courseId },
      { progress: percentage },
      { new: true, upsert: true }
    );

    res.json({
      totalLessons,
      completedCount,
      percentage,
      completedLessons: filteredCompleted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching progress", error: err.message });
  }
};
