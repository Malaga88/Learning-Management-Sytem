import courseModel from "../models/courseModel.mjs";

export const createCourse = async (req, res) => {
    try {
        const { title, description, instructor, thumbnailUrl } = req.body;
        const newCourse = new courseModel({ title, description, instructor, thumbnailUrl });
        await newCourse.save();
        res.status(201).json({ message: "Course created successfully", course: newCourse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating course" });
    }
};

export const getCourses = async (req, res) => {
    try {
        const courses = await courseModel.find();
        res.status(200).json({ message: "Courses retrieved successfully", courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving courses" });
    }
};

export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await courseModel.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json({ message: "Course retrieved successfully", course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving course" });
    }
};
