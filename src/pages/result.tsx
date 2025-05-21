import React, { useState } from "react";
import { MdArrowForward, MdArrowBack, MdPerson, MdHome } from "react-icons/md";
import { useLocation, useNavigate } from 'react-router-dom';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const analysisData = location.state?.analysisData || [];
  const overallAnalysis = location.state?.analysisData.overallAnalysis || {
    overall_strengths: '',
    overall_weaknesses: '',
    selection_percentage: 0,
    final_remarks: 'No analysis available'
  };
  console.log(analysisData);
  

  const handleNext = () => {
    if (currentIndex < analysisData.analysis.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleHome = () => {
    navigate('/main');
  };

  const currentQuestion = analysisData.analysis[currentIndex] || {
    question: 'No question available',
    answer: 'No answer available',
    strengths: '',
    weaknesses: '',
    suggestions: '',
    overall_assessment: 'Not assessed'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MdPerson className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold">MetaMinds</h1>
            </div>
            <button
              onClick={handleHome}
              className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
              title="Back to Home"
            >
              <MdHome className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Left Section - Analysis */}
        <section className="md:w-2/3">
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-blue-400">
                Question Analysis {currentIndex + 1}/{analysisData.analysis.length}
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 transition-colors"
                >
                  <MdArrowBack className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === analysisData.analysis.length - 1}
                  className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 transition-colors"
                >
                  <MdArrowForward className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-700/50 p-5 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Question</h3>
                <p className="text-gray-300">{currentQuestion.question}</p>
              </div>

              <div className="bg-gray-700/50 p-5 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Your Answer</h3>
                <p className="text-gray-300">{currentQuestion.answer}</p>
              </div>

              <div className="bg-gray-700/50 p-5 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Detailed Analysis</h3>
                <div className="grid grid-cols-1 gap-4 text-gray-300">
                  <div>
                    <span className="text-blue-400 font-medium">Assessment:</span>
                    <p>{currentQuestion.overallAssessment}</p>
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">Strengths:</span>
                    <p>{currentQuestion.strengths || 'None identified'}</p>
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">Weaknesses:</span>
                    <p>{currentQuestion.weaknesses || 'None identified'}</p>
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">Suggestions:</span>
                    <p>{currentQuestion.suggestions || 'No suggestions'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Section - Overall Performance */}
        <section className="md:w-1/3">
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700 h-full sticky top-8">
            <h2 className="text-2xl font-semibold text-blue-400 mb-6">Overall Performance</h2>
            
            <div className="space-y-6">
              {/* Circular Progress */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-700"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="45"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-teal-500"
                      strokeWidth="10"
                      strokeDasharray={`${overallAnalysis.selection_percentage * 2.83}, 283`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="45"
                      cx="50"
                      cy="50"
                      transform="rotate(-90 50 50)"
                    />
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dy=".3em"
                      className="text-xl font-semibold fill-white"
                    >
                      {overallAnalysis.selectionPercentage
}%
                    </text>
                  </svg>
                </div>
              </div>

              {/* Performance Details */}
              <div className="space-y-4 text-gray-300">
                <div>
                  <span className="text-blue-400 font-medium">Final Remarks:</span>
                  <p className="mt-1">{overallAnalysis.finalRemarks}</p>
                </div>
                {overallAnalysis.overall_strengths && (
                  <div>
                    <span className="text-blue-400 font-medium">Strengths:</span>
                    <p className="mt-1">{overallAnalysis.overallStrengths}</p>
                  </div>
                )}
                {overallAnalysis.
overallWeaknesses
 && (
                  <div>
                    <span className="text-blue-400 font-medium">Weaknesses:</span>
                    <p className="mt-1">{overallAnalysis.
overallWeaknesses
}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResultPage;