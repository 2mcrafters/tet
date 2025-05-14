// src/routes/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const { isSuccess, token } = useSelector((state) => state.auth);

  return isSuccess && token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
