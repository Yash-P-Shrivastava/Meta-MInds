import React, { useState, useRef, useEffect } from 'react';
import { MdAndroid, MdPerson, MdVideocam, MdMic, MdReplay } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

interface Question {
  category: string;
  question: string;
}

const InterviewPage = () => {
  const navigate = useNavigate();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [micActive, setMicActive] = useState(false);
  const [videoActive, setVideoActive] = useState(false);
  const [status, setStatus] = useState('Waiting for start...');
  const [questions, setQuestions] = useState<string[]>([]);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);

  // Load questions from sessionStorage
  useEffect(() => {
    const storedQuestions = sessionStorage.getItem('questions');
    if (storedQuestions) {
      try {
        const parsedQuestions = JSON.parse(storedQuestions);
        let questionArray: string[] = [];
        if (parsedQuestions.questions && Array.isArray(parsedQuestions.questions)) {
          questionArray = parsedQuestions.questions.map((q: Question) => q.question);
        } else if (parsedQuestions.questions && parsedQuestions.questions.questions && Array.isArray(parsedQuestions.questions.questions)) {
          questionArray = parsedQuestions.questions.questions.map((q: Question) => q.question);
        } else if (Array.isArray(parsedQuestions)) {
          questionArray = parsedQuestions.map((q: Question) => q.question);
        } else {
          console.error('Unexpected questions structure:', parsedQuestions);
          setStatus('Error: Invalid questions structure.');
          return;
        }
        setQuestions(questionArray);
      } catch (error) {
        console.error('Error parsing questions:', error);
        setStatus('Error: Failed to parse questions.');
      }
    } else {
      setStatus('No questions found. Please start over.');
    }
  }, []);

  // Automatically narrate the current question
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      window.speechSynthesis.cancel();
      setTimeout(() => speakQuestion(questions[currentQuestionIndex]), 100);
    }
  }, [questions, currentQuestionIndex]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        console.log('Speech Recognition started');
        setStatus('Listening...');
      };

      recognitionInstance.onend = () => {
        console.log('Speech Recognition ended');
        if (micActive && !isNarrating) {
          console.log('Restarting recognition...');
          setTimeout(() => {
            try {
              recognitionInstance.start();
            } catch (error) {
              console.error('Error restarting recognition:', error);
              setStatus('Error restarting microphone: ' + (error.message || 'Unknown error'));
              setMicActive(false);
            }
          }, 100);
        } else {
          setStatus('Microphone stopped');
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech Recognition error:', event.error);
        setMicActive(false);
        setStatus(`Speech recognition error: ${event.error}`);
      };

      recognitionInstance.onresult = (event) => {
        if (isNarrating) return; // Skip if narrating
        console.log('Speech recognition result:', event.results);
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCurrentAnswer((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      setRecognition(recognitionInstance);
    } else {
      setStatus('Speech Recognition not supported in this browser.');
    }
  }, []);

  // Function to speak the current question
  const speakQuestion = (question: string) => {
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = 'en-US';
    utterance.onstart = () => {
      console.log('Speech started for:', question);
      setStatus('Narrating question...');
      setIsNarrating(true);
      stopMicrophone(); // Stop mic during narration
    };
    utterance.onend = () => {
      console.log('Speech ended for:', question);
      setStatus('Question narrated. Please respond.');
      setIsNarrating(false);
    };
    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event.error);
      setStatus(`Narration error: ${event.error}`);
      setIsNarrating(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Stop microphone helper function
  const stopMicrophone = () => {
    if (micActive) {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      }
      recognition?.abort();
      setMicActive(false);
      setStatus('Microphone stopped');
    }
  };

  const toggleMic = async () => {
    if (micActive) {
      stopMicrophone();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        setMicActive(true);
        recognition?.start();
        setStatus('Listening...');
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setStatus('Failed to access microphone: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const toggleVideo = async () => {
    if (videoActive) {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      setVideoStream(null);
      setVideoActive(false);
      setStatus('Video off');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoStream(stream);
        setVideoActive(true);
        setStatus('Video on');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setStatus('Failed to access camera');
      }
    }
  };

  const replayQuestion = () => {
    if (questions[currentQuestionIndex]) {
      stopMicrophone();
      window.speechSynthesis.cancel();
      speakQuestion(questions[currentQuestionIndex]);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      setStatus('Please provide an answer.');
      return;
    }

    stopMicrophone();

    const answerData = {
      question: questions[currentQuestionIndex],
      answer: currentAnswer
    };

    try {
      const response = await fetch('http://localhost:3000/submitAnswer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(answerData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const responseData = await response.json();
      console.log('Submission successful:', responseData);

      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setCurrentAnswer('');
        setStatus('Answer submitted successfully - Please start mic for next question');
      } else {
        setCurrentQuestionIndex(questions.length);
        setCurrentAnswer('');
        setStatus('All questions answered!');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setStatus('Error submitting answer: ' + error.message);
    }
  };

  const finishInterview = async () => {
    setIsProcessing(true);
    stopMicrophone();
    if (videoActive && videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
      setVideoActive(false);
    }

    try {
      const response = await fetch('http://localhost:3000/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      const responseData = await response.json();
      navigate('/results', { 
        state: { 
          analysisData: responseData.analysis,
          overallAnalysis: responseData.analysis.overall_analysis 
        },
        replace: true
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      setStatus('Error fetching results: ' + error.message);
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3000/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (response.ok) {
        navigate('/login');
      } else {
        alert('Logout failed, please try again!');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert('An error occurred while logging out.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MdAndroid className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold">MetaMinds</h1>
            </div>
            <div className="flex items-center space-x-4">
              <MdPerson className="w-6 h-6 text-white cursor-pointer" />
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Interview Setup</h3>
              <button
                onClick={toggleVideo}
                className={`w-full py-3 px-4 mb-4 rounded-lg flex items-center justify-center space-x-2 ${
                  videoActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                } transition-colors duration-200`}
              >
                <MdVideocam className="w-5 h-5" />
                <span>{videoActive ? 'Stop Camera' : 'Start Camera'}</span>
              </button>
              <button
                onClick={toggleMic}
                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${
                  micActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                } transition-colors duration-200 ${isNarrating ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isNarrating}
              >
                <MdMic className="w-5 h-5" />
                <span>{micActive ? 'Stop Mic' : 'Start Mic'}</span>
              </button>
              <p className="mt-4 text-gray-300">{status}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
              <div className="mb-5 w-full h-64 bg-gray-700 flex items-center justify-center text-gray-300">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
              </div>

              {questions.length === 0 ? (
                <p className="text-lg font-semibold mb-2">No questions loaded.</p>
              ) : currentQuestionIndex < questions.length ? (
                <>
                  <p className="text-lg font-semibold mb-2">
                    Question {currentQuestionIndex + 1} of {questions.length}: {questions[currentQuestionIndex]}
                  </p>
                  <button
                    onClick={replayQuestion}
                    className="mb-4 py-2 px-4 rounded-lg bg-purple-500 hover:bg-purple-600 flex items-center space-x-2"
                  >
                    <MdReplay className="w-5 h-5" />
                    <span>Replay Question</span>
                  </button>
                  <textarea
                    className="mb-4 w-full h-28 p-4 rounded-lg bg-gray-700 text-white border border-gray-600 resize-none"
                    placeholder="Your response will appear here once you speak."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                  />
                  <button
                    onClick={submitAnswer}
                    className="w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                    disabled={!currentAnswer.trim()}
                  >
                    <span>Submit Answer</span>
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-semibold mb-4">Interview Completed!</p>
                  <button
                    onClick={finishInterview}
                    className={`w-full py-3 px-4 rounded-lg transition-colors duration-200 ${
                      isProcessing 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing Result' : 'Finish Interview'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewPage;