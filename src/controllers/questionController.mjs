import questionModel from "../models/questionModel.mjs";
import quizModel from "../models/quizModel.mjs";

// Add question to quiz
export const addQuestion = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { text, options, correctAnswer } = req.body;

    const question = new questionModel({ quiz: quizId, text, options, correctAnswer });
    await question.save();

    await quizModel.findByIdAndUpdate(quizId, { $push: { questions: question._id } });

    res.status(201).json({ message: "Question added successfully", question });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding question" });
  }
};

// Check answer
export const checkAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { selectedOption } = req.body;

    const question = await questionModel.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const isCorrect = question.correctAnswer === selectedOption;
    res.status(200).json({ message: "Answer checked successfully", isCorrect });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error checking answer" });
  }
};
