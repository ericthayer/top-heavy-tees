import { Link } from 'react-router-dom';

/** The Top Heavy "TH" mark: two strokes forming an inverted triangle. Inherits currentColor. */
export function LogoMark({ className = '', title }) {
  return (
    <svg className={className} viewBox="0 0 1949.02 1686.87" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <polygon
        fill="currentColor"
        points="853.5 1479.46 973.25 1686.88 1949.02 0 1708.77 0.43 1315.41 679.9 1069.53 681.03 1221.75 419.93 982.2 419.69 610.32 1058.26 729.83 1265.25 948.9 888.67 1195.98 887.36 853.5 1479.46"
      />
      <polygon fill="currentColor" points="481.63 421.36 358.81 208.62 1345.58 208.14 1467.17 0.23 0 1.15 483.35 838.34 727.41 419.58 481.63 421.36" />
    </svg>
  );
}

/** Mark plus wordmark. "Top Heavy" is set heavy, "Tees" light, echoing the name. */
export function Wordmark({ className = '' }) {
  return (
    <span className={`wordmark ${className}`}>
      <LogoMark className="wordmark__mark" />
      <span className="wordmark__text">
        <span className="wordmark__heavy">Top Heavy</span> <span className="wordmark__light">Tees</span>
      </span>
    </span>
  );
}

export default function Logo({ onClick }) {
  return (
    <Link to="/" className="logo" onClick={onClick} aria-label="Top Heavy Tees home">
      <Wordmark />
    </Link>
  );
}
