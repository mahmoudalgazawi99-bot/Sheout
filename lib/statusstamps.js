export function stampsFor(status, current = {}) {
  const now = new Date().toISOString();

  if (status === 'new') {
    return { status, confirmed_at: null, ready_at: null, delivered_at: null };
  }
  if (status === 'confirmed') {
    return { status, confirmed_at: current.confirmed_at || now, ready_at: null, delivered_at: null };
  }
  if (status === 'ready') {
    return { status, ready_at: current.ready_at || now, delivered_at: null };
  }
  if (status === 'delivered') {
    return { status, delivered_at: current.delivered_at || now };
  }
  return { status };
}
