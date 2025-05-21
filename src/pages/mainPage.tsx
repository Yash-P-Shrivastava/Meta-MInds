import { MdAndroid, MdLogin, MdPerson } from 'react-icons/md'; // Add MdPerson for profile icon
import { useNavigate } from 'react-router-dom'; // Import useNavigate for routing
import { useState } from 'react'; // Import useState to handle input states

const MainPage = () => {
  const navigate = useNavigate(); // Initialize navigate to handle routing
  const [jobTitle, setJobTitle] = useState(''); // State for Job Title
  const [jobDescription, setJobDescription] = useState(''); // State for Job Description
  const [isLoading, setIsLoading] = useState(false); // State to handle loading state

  // Function to handle logout (with backend request)
  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3000/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        navigate('/login');
      } else {
        navigate('/login');
        console.error('Logout failed:', await response.json());
        alert('Logout failed, please try again!');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert('An error occurred while logging out.');
    }
  };

  // Function to handle form submission (sending data to the backend)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission

    if (!jobTitle || !jobDescription) {
      alert('Please fill out both fields');
      return;
    }

    // Set loading state to true before the request
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/generateQuestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
        }),
        credentials: 'include',
      });
      const data = await response.json();
      console.log(data);
      
      
      if (response.ok) {
        // Assuming data.questions contains the array of questions from backend
        sessionStorage.setItem('jobTitle', jobTitle);
        sessionStorage.setItem('jobDescription', jobDescription);
        sessionStorage.setItem('questions', JSON.stringify(data.questions)); // Store questions

        setTimeout(() => {
          navigate('/interview');
        }, 5000);
      } else {
        const errorResponse = await response.json();
        console.error('Failed to start interview:', errorResponse);
        alert(`Failed to start interview: ${errorResponse.message || 'Please try again!'}`);
      }
    } catch (error) {
      console.error('Error during form submission:', error);
      alert('An error occurred while submitting the form.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MdAndroid className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold">MetaMinds</h1>
            </div>

            {/* Profile and Logout Section */}
            <div className="flex items-center space-x-4">
              {/* Profile Icon */}
              <MdPerson className="w-6 h-6 text-white cursor-pointer" />

              {/* Logout Button */}
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AI-Powered Interview Preparation
              </h2>
              <p className="text-gray-300 text-lg">
                Upload your job description and let our AI create a personalized interview session tailored to the role.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MdAndroid className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Smart Analysis</h3>
                  <p className="text-gray-400">Advanced AI analysis of job requirements</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MdAndroid className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Dynamic Conversations</h3>
                  <p className="text-gray-400">Real-time adaptive interview questions</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <MdAndroid className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Detailed Feedback</h3>
                  <p className="text-gray-400">Comprehensive performance analysis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Input Area */}
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Start Your Interview Preparation</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300">
                    Job Title
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    type="text"
                    placeholder="Job Title"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                  <label className="block text-sm font-medium text-gray-300">
                    Paste Job Description
                  </label>
                  <textarea
                    className="w-full h-48 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-100 placeholder-gray-500"
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                  disabled={isLoading} // Disable the button during loading
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <MdLogin className="w-5 h-5" />
                      <span>Start Interview</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainPage;
