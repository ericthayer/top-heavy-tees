import { Link } from 'react-router-dom';

export default function NotFound({ title = 'This page doesn’t exist', text = 'The link may be old, or the address may have a typo.' }) {
  return (
    <section className="empty-page">
      <h1>{title}</h1>
      <p>{text}</p>
      <div className="button-row">
        <Link to="/products" className="btn btn--primary">
          Browse shirts
        </Link>
        <Link to="/" className="btn btn--outline">
          Go to the homepage
        </Link>
      </div>
    </section>
  );
}
