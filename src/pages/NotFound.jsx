import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="center">
      <h1 className="notfound-code">404</h1>
      <p className="muted">La página que buscas no existe o fue movida.</p>
      <Link to="/" className="btn btn-primary">Volver al inicio</Link>
    </div>
  );
}
