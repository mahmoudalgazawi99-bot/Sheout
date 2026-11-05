'use client';

import { useState } from 'react';

export default function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <textarea
        readOnly
        value={value}
        rows={3}
        onFocus={(e) => e.target.select()}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 8,
          border: '1px solid #ddd',
          fontFamily: 'monospace',
          fontSize: 13,
          wordBreak: 'break-all',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={copy}
        style={{
          marginTop: 6,
          border: '1px solid #ddd',
          background: '#fff',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
