import { Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedEditRoute = ({ component: Component }) => {
  const { id } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  
    if (currentUser && parseInt(id) === currentUser.id) {
    return <Navigate to="/view-profile" replace />;
  }

  return <Component />;
}

export default ProtectedEditRoute;