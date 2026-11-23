'use client';

import { useRef, useState } from 'react';
import { theme } from '@/lib/theme';

export default function ProductGallery({ images, video, alt }) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const slides = [
    ...images.map((src) => ({ type: 'img', src })),
    ...(video ? [{ type: 'video', src: video }] : []),
  ];

  function onScroll() {
    const el = ref.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    setIdx(Math.max(0, Math.min(slides.length - 1, i)));
  }

  function go(i) {
    const el = ref.current;
    const child = el && el.children[i];
    if (child && child.scrollIntoView) {
      child.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }

  if (slides.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '4 / 5',
          borderRadius: theme.radius,
          background: theme.goldSoft,
          marginTop: 14,
        }}
      />
    );
  }

  return (
    <div style={{ marginTop: 14 }}>
      <style>{'.sh-gal::-webkit-scrollbar{display:none}'}</style>
      <div style={{ position: 'relative' }}>
        <div
          ref={ref}
          className="sh-gal"
          onScroll={onScroll}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            borderRadius: theme.radius,
            boxShadow: theme.shadow,
            background: theme.goldSoft,
          }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              style={{ flex: '0 0 100%', scrollSnapAlign: 'start', aspectRatio: '4 / 5', background: theme.goldSoft }}
            >
              {s.type === 'img' ? (
                <img
                  src={s.src}
                  alt={alt}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <video
                  src={s.src}
                  controls
                  playsInline
                  preload="metadata"
                  poster={images[0] || undefined}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000', display: 'block' }}
                />
              )}
            </div>
          ))}
        </div>
        {slides.length > 1 && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              insetInlineEnd: 10,
              background: 'rgba(20,20,20,0.6)',
              color: '#fff',
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 12,
            }}
          >
            {idx + 1} / {slides.length}
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 8 }}>
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={String(i + 1)}
              style={{
                flex: '0 0 auto',
                width: 60,
                height: 60,
                padding: 0,
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                border: i === idx ? `2px solid ${theme.ink}` : `1px solid ${theme.line}`,
                background: theme.goldSoft,
                cursor: 'pointer',
              }}
            >
              <img
                src={s.type === 'img' ? s.src : images[0] || ''}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {s.type === 'video' && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(20,20,20,0.35)',
                    color: '#fff',
                    fontSize: 18,
                  }}
                >
                  ▶
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
