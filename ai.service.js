const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const apiKey = process.env.Google_Api_Key;
// console.log(apiKey);

const genAI = new GoogleGenerativeAI(apiKey);

// Use gemini-pro, which is generally suitable for a wide range of tasks
const modelName = "gemini-1.5-flash";

// Model for generating interview questions
const questionModel = genAI.getGenerativeModel({
  model: modelName,
  systemInstruction: `
    You are an AI designed to generate high-quality, relevant interview questions based on the provided job title and job description. 
    Your task is to create a list of interview questions that are designed to assess a candidate's skills, experience, and suitability for the role. 
    The questions should be insightful, diverse, and cover different areas related to the job, including:
    - Technical Skills: Questions assessing the candidate's technical abilities specific to the role.
    - Behavioral Skills: Questions to understand the candidate's behavior, past experiences, and interpersonal skills.
    - Role-Specific Challenges: Questions to gauge the candidate's understanding of key responsibilities, challenges, and tasks related to the job.
    - Cultural Fit: Questions to determine if the candidate aligns with the company's values and work culture.
    - Future Prospects: Questions that assess the candidate’s career aspirations and how they align with the organization's goals.
    
    Ensure that the following:
    - Questions should be diverse and cover a range of topics relevant to the job.
    - The questions should be professional, clear, and open-ended.
    - Avoid generic or overly broad questions.
    - Ensure that the questions are appropriate to the level of the job.
    - If there are specific technologies, tools, or processes mentioned in the job description, include questions related to those.
  `,
});

// Model for analyzing answers
const analysisModel = genAI.getGenerativeModel({
  model: modelName,
  systemInstruction: `
    You are an AI designed to analyze user responses to interview questions. Your task is to evaluate the answers provided by the user and generate a detailed analysis. For each question-answer pair, provide the following:
    - Strengths: Highlight the positive aspects of the answer, such as clarity, relevance, depth, or specific skills demonstrated.
    - Weaknesses: Identify any shortcomings, such as lack of detail, irrelevance, vagueness, or missing key points.
    - Suggestions: Offer constructive feedback on how the answer could be improved.
    - Overall Assessment: Provide a brief summary of the quality of the response (e.g., "excellent", "good", "average", "poor").

    Additionally, after analyzing all question-answer pairs, provide an overall analysis of the interview:
    - Overall Strengths: Summarize the candidate's key strengths across all answers.
    - Overall Weaknesses: Summarize recurring weaknesses or areas for improvement.
    - Selection Percentage: Estimate a percentage (0-100%) representing the likelihood of the candidate being selected, based on the quality of their answers. Use the individual assessments to calculate this (e.g., "excellent" = 90-100%, "good" = 70-89%, "average" = 50-69%, "poor" = 0-49%).
    - Final Remarks: A brief comment on the candidate’s overall performance.

    Ensure the analysis is:
    - Objective and based solely on the content of the question and answer.
    - Structured in strict JSON format for easy parsing.
    - Professional, concise, and actionable.
  `,
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

function cleanUpJsonInput(inputString) {
  const cleanedString = inputString
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleanedString);
  } catch (error) {
    console.error("Invalid JSON format:", error);
    throw new Error("Invalid JSON format.");
  }
}

// Function to generate interview questions
async function generateInterviewQuestions(
  jobTitle,
  jobDescription,
  retryCount = 0
) {
  // Added retryCount
  const MAX_RETRIES = 5;
  const INITIAL_DELAY = 1000;
  try {
    const chatSession = questionModel.startChat({
      generationConfig,
      history: [],
    });

    const input = `{
      "jobTitle": "${jobTitle}",
      "jobDescription": "${jobDescription}",
      "questions": []
      generate 5 questions only with the category name and the question. generate only questions part else remove all
      and provide me output in strict json format only and take this on a serious note. By default the first question should be "Tell me about yourself" with category "general".
    }`;
    const result = await chatSession.sendMessage(input);
    const resultText = result.response.text();
    const generatedQuestions = cleanUpJsonInput(resultText);
    return generatedQuestions;
  } catch (error) {
    if (error.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_DELAY * Math.pow(2, retryCount);
        console.warn(
          `Rate limit exceeded. Retrying after ${
            delay / 1000
          } seconds. Retry count: ${retryCount}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return generateInterviewQuestions(
          jobTitle,
          jobDescription,
          retryCount + 1
        ); // Recursive call
      } else {
        console.error("Max retries exceeded.  Failed to generate questions.");
        throw new Error(
          "Gemini API rate limit exceeded after multiple retries."
        );
      }
    } else {
      throw error;
    }
  }
}

// Function to analyze answers
async function analyzeAnswers(answersArray, retryCount = 0) {
  // Added retryCount
  const MAX_RETRIES = 5;
  const INITIAL_DELAY = 1000;
  try {
    const chatSession = analysisModel.startChat({
      generationConfig,
      history: [],
    });

    // Format the answersArray as a JSON string to send to the AI
    const input = `{
      "answers": ${JSON.stringify(answersArray)},
      "instructions": "Analyze the provided question-answer pairs and return the analysis in strict JSON format. For each pair, include strengths, weaknesses, suggestions, and an overall assessment. Additionally, provide an overall analysis with overall strengths, overall weaknesses, selection percentage (0-100%), and final remarks."
    }`;

    const result = await chatSession.sendMessage(input);
    const resultText = result.response.text();
    const analysis = cleanUpJsonInput(resultText);
    return analysis;
  } catch (error) {
    if (error.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_DELAY * Math.pow(2, retryCount);
        console.warn(
          `Rate limit exceeded. Retrying after ${
            delay / 1000
          } seconds.  Retry count: ${retryCount}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return analyzeAnswers(answersArray, retryCount + 1);
      } else {
        console.error("Max retries exceeded. Failed to analyze answers.");
        throw new Error(
          "Gemini API rate limit exceeded after multiple retries."
        );
      }
    } else {
      throw error;
    }
  }
}

module.exports = {
  generateInterviewQuestions,
  analyzeAnswers,
};
