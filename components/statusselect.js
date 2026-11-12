'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['new', 'confirmed', 'ready', 'picked_up', 'delivered', 'cancelled'];

export default function StatusSelect({ id, current }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function change(e) {
    const next = e.target.value;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/sub-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setError('Could not update');
      } else {
        setValue(next);
        router.refresh();
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  return (
    <div>
      <select
        value={value}
        onChange={change}
        disabled={loading}
        style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {error && <span style={{ color: '#b00', fontSize: 12, marginLeft: 8 }}>{error}</span>}
    </div>
  );
}
