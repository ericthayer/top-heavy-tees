import { useEffect, useState } from 'react';
import { CheckIcon, SparkIcon } from '../Icons.jsx';
import { SuggestionCard } from './SuggestionCard.jsx';
import { contrastProfile } from '../../lib/suggestions.js';
import { inches } from '../../lib/format.js';

const STEPS = ['Checking resolution', 'Measuring contrast against the shirt', 'Reviewing placement'];

function contrastLabel(ratio) {
  if (ratio >= 4.5) return 'Strong';
  if (ratio >= 3) return 'Good';
  if (ratio >= 1.8) return 'Fair';
  return 'Weak';
}

export default function SuggestionsPanel({ design, result, shirt, onAction, busy, other, onShowOther }) {
  const analysisKey = design ? `${design.id}:${design.src.length}` : null;
  const [step, setStep] = useState(STEPS.length);

  // Walk through the checks briefly whenever new artwork arrives.
  useEffect(() => {
    if (!analysisKey) return undefined;
    setStep(0);
    const timers = STEPS.map((_, i) => setTimeout(() => setStep(i + 1), 260 * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [analysisKey]);

  const analyzing = design && step < STEPS.length;
  const issues = result?.suggestions.filter((s) => s.severity !== 'good') ?? [];
  const goods = result?.suggestions.filter((s) => s.severity === 'good') ?? [];
  const profile = design?.analysis?.palette ? contrastProfile(design.analysis.palette, shirt.hex) : null;

  return (
    <section className="panel check-panel" aria-labelledby="check-heading">
      <div className="check-panel__head">
        <h2 id="check-heading" className="panel__title">
          <SparkIcon size={18} />
          Design check
        </h2>
        {design && !analyzing && (
          <span className={`status-chip ${issues.length ? 'status-chip--todo' : 'status-chip--ok'}`}>
            {issues.length ? `${issues.length} to review` : 'Ready to print'}
          </span>
        )}
      </div>

      {!design && (
        <p className="check-panel__empty">
          Add artwork and the studio checks it against this shirt: resolution at print size, contrast with the fabric color, placement, and file
          format.
        </p>
      )}

      {analyzing && (
        <ol className="check-steps" aria-live="polite">
          {STEPS.map((label, i) => (
            <li key={label} className={i < step ? 'is-done' : i === step ? 'is-active' : ''}>
              {i < step ? <CheckIcon size={16} /> : <span className="spinner spinner--sm" aria-hidden="true" />}
              {label}
            </li>
          ))}
        </ol>
      )}

      {design && !analyzing && result && (
        <>
          <dl className="metrics">
            <div>
              <dt>Print size</dt>
              <dd className="data">
                {inches(result.metrics.widthIn)} × {inches(result.metrics.heightIn)}
              </dd>
            </div>
            <div>
              <dt>Resolution</dt>
              <dd className="data">{result.metrics.dpi === null ? 'Vector' : `${result.metrics.dpi} DPI`}</dd>
            </div>
            <div>
              <dt>Contrast</dt>
              <dd className="data">{profile ? contrastLabel(profile.median) : '—'}</dd>
            </div>
          </dl>

          {issues.length > 0 ? (
            <ul className="suggestions" aria-label="Suggestions">
              {issues.map((s) => (
                <SuggestionCard key={s.id} s={s} onAction={onAction} disabled={busy} />
              ))}
            </ul>
          ) : (
            <p className="check-panel__clear">Nothing to fix. This design should print the way it looks here.</p>
          )}

          {goods.length > 0 && (
            <details className="goods">
              <summary>What looks good ({goods.length})</summary>
              <ul className="suggestions suggestions--compact">
                {goods.map((s) => (
                  <SuggestionCard key={s.id} s={s} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {other && other.count > 0 && (
        <p className="check-panel__other">
          The {other.side} has {other.count} {other.count === 1 ? 'suggestion' : 'suggestions'}.{' '}
          <button type="button" className="link-btn" onClick={onShowOther}>
            Show {other.side}
          </button>
        </p>
      )}
    </section>
  );
}
