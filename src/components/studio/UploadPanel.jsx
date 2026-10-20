import { useState } from 'react';
import { ACCEPT_ATTR } from '../../lib/imageUtils.js';
import { SAMPLES } from '../../lib/samples.js';
import { formatBytes } from '../../lib/format.js';
import { ImageIcon, TrashIcon, UndoIcon, UploadIcon } from '../Icons.jsx';

const FORMAT_LABEL = { png: 'PNG', jpg: 'JPG', svg: 'SVG' };

export default function UploadPanel({ side, design, otherSideEmpty, error, busy, inputRef, onFile, onSample, onRemove, onUndo, onCopyToOther }) {
  const [over, setOver] = useState(false);
  const sideName = side === 'front' ? 'front' : 'back';
  const otherName = side === 'front' ? 'back' : 'front';

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT_ATTR}
      className="visually-hidden"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
        e.target.value = '';
      }}
    />
  );

  return (
    <section className="panel" aria-labelledby="artwork-heading">
      <h2 id="artwork-heading" className="panel__title">
        Artwork <span className="panel__aside">on the {sideName}</span>
      </h2>
      {input}

      {design ? (
        <div className="file-card">
          <div className="file-card__thumb">
            <img src={design.src} alt="" />
          </div>
          <div className="file-card__meta">
            <p className="file-card__name" title={design.name}>
              {design.name}
            </p>
            <p className="file-card__facts">
              {design.isVector ? 'Vector' : `${design.naturalWidth} × ${design.naturalHeight} px`}, {FORMAT_LABEL[design.format]},{' '}
              {formatBytes(design.fileSize)}
            </p>
          </div>
          <button type="button" className="icon-btn icon-btn--danger file-card__remove" onClick={onRemove} disabled={busy} aria-label={`Remove ${design.name}`} title="Remove artwork">
            <TrashIcon size={18} />
          </button>
          <div className="file-card__actions">
            <button type="button" className="btn btn--small btn--outline" onClick={() => inputRef.current?.click()} disabled={busy}>
              Replace
            </button>
            {design.previous && (
              <button type="button" className="btn btn--small btn--outline" onClick={onUndo} disabled={busy}>
                <UndoIcon size={16} />
                Undo edit
              </button>
            )}
            {otherSideEmpty && (
              <button type="button" className="btn btn--small btn--outline" onClick={onCopyToOther} disabled={busy}>
                Copy to {otherName}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`dropzone${over ? ' is-over' : ''}${busy ? ' is-busy' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget || !e.target.closest('button')) inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onFile(file);
          }}
        >
          <UploadIcon size={26} />
          <span className="dropzone__main">
            Drop your artwork here or{' '}
            <button type="button" className="dropzone__browse" onClick={() => inputRef.current?.click()} disabled={busy}>
              browse files
            </button>
          </span>
          <span className="dropzone__hint">PNG, JPG or SVG, up to 15 MB</span>
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!design && (
        <div className="samples">
          <p className="samples__label">No file handy? Try a sample:</p>
          <div className="samples__row">
            {SAMPLES.map((s) => (
              <button key={s.id} type="button" className="sample-btn" onClick={() => onSample(s.id)} disabled={busy}>
                <ImageIcon size={16} />
                <span>
                  {s.label}
                  <small>{s.note}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
