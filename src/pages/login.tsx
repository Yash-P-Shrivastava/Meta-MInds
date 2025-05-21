import { MdLogin } from 'react-icons/md';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate hook

const MdLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const loginData = {
      email,
      password,
    };

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        credentials: "include",
      });

      const data = await response.json();
      setIsLoading(false);
      console.log(response);
      console.log(data);
      console.log(response.ok);
      
      
      

      if (response.ok) {
        setSuccessMessage(data.message); // Handle successful login
        setTimeout(() => {
          navigate('/main'); // Redirect to main page after successful login
        }, 2000);
      } else {
        setErrorMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Network error:', error);
      setErrorMessage('Error connecting to the server');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-2">
            <MdLogin className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">MetaMinds</h1>
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
                Log in to MetaMinds
              </h2>
              <p className="text-gray-300 text-lg">
                Access AI-powered interview preparation tailored to your job role. Please log in to continue.
              </p>

              {/* "Don't have an account?" Link */}
              <div className="text-sm">
                <span className="text-gray-300">
                  Don't have an account?{" "}
                  <a href="/" className="text-blue-500 hover:text-blue-400">
                    Sign up
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Welcome Back to MetaMinds!</h3>

              {/* Form Wrapper */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  {errorMessage && <div className="text-red-400 text-sm">{errorMessage}</div>}
                  {successMessage && <div className="text-green-400 text-sm">{successMessage}</div>}

                  <label className="block text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-500"
                    placeholder="Enter your email"
                  />

                  <label className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-500"
                    placeholder="Enter your password"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} transition-colors duration-200`}
                  >
                    {isLoading ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        <MdLogin className="mt-4 w-5 h-5" />
                        <span>Log In</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MdLoginPage;
