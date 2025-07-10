
import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redireciona para a nova rota do simulador
  return <Navigate to="/simulador" replace />;
};

export default Index;
