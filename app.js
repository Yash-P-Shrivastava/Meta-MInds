const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateInterviewQuestions, analyzeAnswers } = require('./ai.service');
const verifyToken = require('./middlewares/auth');
const User = require('./models/user');
const InterviewSession = require('./models/interviewSession');
const Question = require('./models/questionSchema');
const Answer = require('./models/answer');
const ResultAnalysis = require('./models/resultAnalysis');

const app = express();
const port = 3000;

// Middleware
dotenv.config();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
}));

const JWT_SECRET = process.env.JWT_SECRET_KEY;
const apiKey = process.env.Google_Api_Key;
const genAI = new GoogleGenerativeAI(apiKey);

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/user-sign-in')
  .then(() => {
    // console.log('Connected to MongoDB');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Sign-up route
app.post('/sign-up', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists, please log in.' });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
      });

      await newUser.save();
      res.status(201).json({ message: 'User registered successfully!' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found, please register.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      const payload = { userId: user._id, email: user.email };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      res.cookie("token", token);

      return res.status(200).json({ message: 'Login successful!', token });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Logout route
app.post('/logout', verifyToken, (req, res) => {
  res.clearCookie('token');
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({ message: 'Error logging out' });
    }
    return res.status(200).json({ message: 'Logout successful!' });
  });
});

// Interview route
app.post("/generateQuestions", verifyToken, async (req, res) => {
  const { jobTitle, jobDescription } = req.body;

  if (!jobTitle || !jobDescription) {
    return res.status(400).json({ message: "Job title and description are required." });
  }

  try {
    const userId = req.user.userId; // From verifyToken middleware
    const questionsObject = await generateInterviewQuestions(jobTitle, jobDescription);
    const questionsArray = questionsObject.questions;

    if (!Array.isArray(questionsArray)) {
      return res.status(500).json({ message: "Invalid questions format from AI service." });
    }

    // Create new InterviewSession
    const newSession = new InterviewSession({
      user: userId,
      jobTitle,
      jobDescription
    });
    await newSession.save();

    // Save questions to MongoDB (questionText as array)
    const questionDocs = questionsArray.map((q, index) => ({
      session: newSession._id,
      questionText: Array.isArray(q.question) ? q.question : [q.question], // Ensure question is an array
      questionOrder: index + 1
    }));
    await Question.insertMany(questionDocs);

    // Store session ID in express-session for compatibility
    req.session.interview = {
      sessionId: newSession._id,
      questionsArray: questionsArray.map(q => ({
        question: Array.isArray(q.question) ? q.question : [q.question] // Ensure compatibility
      })),
      answers: [],
      jobTitle,
      jobDescription,
      createdAt: Date.now(),
    };

    res.status(200).json({
      message: "New interview session started successfully.",
      sessionId: newSession._id,
      questions: questionsArray.map(q => ({
        question: Array.isArray(q.question) ? q.question : [q.question]
      })),
      maxQuestions: questionsArray.length,
    });
  } catch (error) {
    console.error("Error starting interview:", error);
    res.status(500).json({ message: "Error starting interview." });
  }
});

// Submit answer endpoint
app.post("/submitAnswer", verifyToken, async (req, res) => {
  const { question, answer } = req.body;

  // Validate input (question and answer can be strings or arrays)
  if (!question || !answer) {
    return res.status(400).json({ message: "Question and answer are required." });
  }

  if (!req.session.interview || !req.session.interview.sessionId) {
    return res.status(400).json({ message: "No active interview session. Please start an interview first." });
  }

  const sessionId = req.session.interview.sessionId;
  const sessionData = req.session.interview;

  if (!Array.isArray(sessionData.questionsArray)) {
    return res.status(500).json({ message: "Server error: Questions data corrupted." });
  }

  // Convert question to array for comparison
  const questionStrings = sessionData.questionsArray.map(q => 
    Array.isArray(q.question) ? q.question : [q.question]
  );
  const questionArray = Array.isArray(question) ? question : [question];

  // Check if questionArray matches any question in session
  const isValidQuestion = questionStrings.some(q => 
    q.length === questionArray.length && q.every((val, idx) => val === questionArray[idx])
  );

  if (!isValidQuestion) {
    return res.status(400).json({ message: "Invalid question for this session." });
  }

  try {
    // Find the question document
    const questionDoc = await Question.findOne({
      session: sessionId,
      questionText: questionArray
    });

    if (!questionDoc) {
      return res.status(400).json({ message: "Question not found in database." });
    }

    // Save answer to MongoDB (answer as array)
    const answerDoc = new Answer({
      session: sessionId,
      question: questionDoc._id,
      answerText: Array.isArray(answer) ? answer : [answer] // Ensure answer is an array
    });
    await answerDoc.save();

    // Update session answers array
    sessionData.answers.push({ question: questionArray, answer: Array.isArray(answer) ? answer : [answer] });

    // Get updated counts
    const totalQuestions = await Question.countDocuments({ session: sessionId });
    const answeredQuestions = await Answer.countDocuments({ session: sessionId });

    res.status(200).json({
      message: "Answer submitted successfully.",
      answeredQuestions,
      totalQuestions,
      remainingQuestions: totalQuestions - answeredQuestions,
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ message: "Error submitting answer." });
  }
});

// Results endpoint
app.post("/results", verifyToken, async (req, res) => {
  if (!req.session.interview || !req.session.interview.sessionId) {
    return res.status(400).json({ message: "No active interview session. Please start an interview first." });
  }

  const sessionId = req.session.interview.sessionId;
  const userId = req.user.userId;

  try {
    // Fetch session and answers from MongoDB
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(400).json({ message: "Interview session not found." });
    }

    const answers = await Answer.find({ session: sessionId }).populate('question');
    const formattedAnswers = answers.map(a => ({
      question: a.question.questionText, // Already an array
      answer: a.answerText // Already an array
    }));

    // Analyze answers
    const analysis = await analyzeAnswers(formattedAnswers);
    // console.log(analysis);
    

    // Save result analysis to MongoDB
    const resultAnalysis = new ResultAnalysis({
      session: sessionId,
      user: userId,
      analysis,
      totalQuestions: await Question.countDocuments({ session: sessionId }),
      answeredQuestions: answers.length
    });
    await resultAnalysis.save();

    // Mark session as completed
    session.completed = true;
    await session.save();

    res.status(200).json({
      message: "Results generated and saved successfully.",
      analysis,
      totalQuestions: resultAnalysis.totalQuestions,
      answeredQuestions: resultAnalysis.answeredQuestions,
    });
  } catch (error) {
    console.error("Error analyzing answers:", error);
    res.status(500).json({ message: "Error analyzing answers." });
  }
});

// Optional: Retrieve past results
app.get("/getResults", verifyToken, async (req, res) => {
  try {
    const results = await ResultAnalysis.find({ user: req.user.userId })
      .populate('session')
      .lean();
    res.status(200).json({
      message: "Results retrieved successfully.",
      results
    });
  } catch (error) {
    console.error("Error retrieving results:", error);
    res.status(500).json({ message: "Error retrieving results." });
  }
});

// Start server
app.listen(port, () => {
  // console.log(`Server is running on http://localhost:${port}`);
});