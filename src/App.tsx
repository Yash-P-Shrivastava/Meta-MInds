import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Import necessary routing components
import MainPage from './pages/mainPage.tsx'; // Import your MainPage component
import MdSignUpPage from './pages/signUp.tsx'; // Import your SignUp page component
import MdLoginPage  from './pages/login.tsx';  
import PrivateRoute from './components/privateRoute.tsx';
import InterviewPage from './pages/interview.tsx';  
import ResultPage from './pages/result.tsx';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MdSignUpPage />} />
        <Route path="/main" element={<PrivateRoute component={MainPage} />} />
        {/* <Route path="/main" element={<MainPage/>}/> */}
        <Route path="/login" element={<MdLoginPage />} />
        <Route path='/interview' element={<PrivateRoute component={InterviewPage} />} />
        <Route path='/results' element={<PrivateRoute component={ResultPage} />} />
        {/* <Route path="/interview" element={<InterviewPage />} /> */}
        {/* Other routes can go here */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;