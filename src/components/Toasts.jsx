import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { CheckIcon, CloseIcon, InfoIcon } from './Icons.jsx';

export default function Toasts() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          {t.tone === 'success' ? <CheckIcon size={18} /> : <InfoIcon size={18} />}
          <p>{t.message}</p>
          {t.action && (
            <Link to={t.action.to} className="toast__action" onClick={() => dismiss(t.id)}>
              {t.action.label}
            </Link>
          )}
          <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            <CloseIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
