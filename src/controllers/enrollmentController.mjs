import enrollmentModel from "../models/enrollmentModel.mjs";
import userModel from "../models/userModel.mjs";

export const enrollInCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    // 1. Check if already enrolled
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const existingEnrollment = await enrollmentModel.findOne({ user: userId, course: courseId });
    if (existingEnrollment) {
      return res.status(409).json({ message: "User already enrolled in this course" });
    }

    // 2. Create new enrollment
    const newEnrollment = new enrollmentModel({
      user: userId,
      course: courseId,
    });

    await newEnrollment.save();

    res.status(201).json({
      message: "Enrolled in course successfully",
      enrollment: newEnrollment,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error enrolling in course", error: error.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { progress } = req.body;

    const enrollment = await enrollmentModel.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    enrollment.progress = Math.min(progress, 100); // cap at 100
    if (enrollment.progress === 100) {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();
    }

    await enrollment.save();
    res.json({ message: "Progress updated", enrollment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;

    const enrollments = await enrollmentModel.find({ user: userId })
      .populate("course")
      .populate("user", "name email");

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const dropCourse = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await enrollmentModel.findById(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    enrollment.status = "dropped";
    await enrollment.save();

    res.json({ message: "Course dropped", enrollment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
