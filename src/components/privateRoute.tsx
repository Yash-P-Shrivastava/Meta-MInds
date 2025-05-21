import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie'; // Import js-cookie to work with cookies

interface PrivateRouteProps {
  component: React.ComponentType;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component }) => {
  const token = Cookies.get('token'); // Check for the token in cookies
  // If there's no token, redirect to /login; otherwise, render the protected component
  if (!token) {
    return <Navigate to="/login" replace />;
  }


  return <Component />;
};

export default PrivateRoute;
