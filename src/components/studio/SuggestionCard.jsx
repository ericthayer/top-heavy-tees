import { AlertIcon, CheckIcon, ErrorIcon, InfoIcon } from '../Icons.jsx';

// Kept apart from SuggestionsPanel so the homepage preview doesn't pull in the
// design-check engine.
const ICONS = { error: ErrorIcon, warning: AlertIcon, tip: InfoIcon, good: CheckIcon };
const SEVERITY_LABEL = { error: 'Problem', warning: 'Check', tip: 'Tip', good: 'Good' };

export function SuggestionCard({ s, onAction, disabled }) {
  const Icon = ICONS[s.severity];
  return (
    <li className={`suggestion suggestion--${s.severity}`}>
      <span className="suggestion__icon">
        <Icon size={18} />
        <span className="visually-hidden">{SEVERITY_LABEL[s.severity]}:</span>
      </span>
      <div className="suggestion__body">
        <p className="suggestion__title">{s.title}</p>
        <p className="suggestion__detail">{s.detail}</p>
        {s.action &&
          (onAction ? (
            <button type="button" className="suggestion__action" onClick={() => onAction(s.action)} disabled={disabled}>
              {s.action.label}
            </button>
          ) : (
            <span className="suggestion__action is-static">{s.action.label}</span>
          ))}
      </div>
    </li>
  );
}
