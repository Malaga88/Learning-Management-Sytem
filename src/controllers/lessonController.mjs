import lessonModel from "../models/lessonModel.mjs";
import courseModel from "../models/courseModel.mjs";

// Create a lesson
export const createLesson = async (req, res) => {
  try {
    const { courseId, title, description, content, videoUrl, order, resources } = req.body;

    // Ensure course exists
    const course = await courseModel.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const lesson = new lessonModel({
      course: courseId,
      title,
      description,
      content,
      videoUrl,
      order,
      resources
    });

    await lesson.save();
    res.status(201).json({ message: "Lesson created successfully", lesson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating lesson", error: err.message });
  }
};

// Get all lessons for a course
export const getCourseLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lessons = await lessonModel.find({ course: courseId }).sort({ order: 1 });

    res.json(lessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching lessons", error: err.message });
  }
};

// Get a single lesson
export const getLessonById = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await lessonModel.findById(lessonId).populate("course", "title description");

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    res.json(lesson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching lesson", error: err.message });
  }
};

// Update a lesson
export const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const updates = req.body;

    const lesson = await lessonModel.findByIdAndUpdate(lessonId, updates, { new: true });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    res.json({ message: "Lesson updated successfully", lesson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating lesson", error: err.message });
  }
};

// Delete a lesson
export const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await lessonModel.findByIdAndDelete(lessonId);

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    res.json({ message: "Lesson deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting lesson", error: err.message });
  }
};
