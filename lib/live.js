export function computeLive(orders) {
  const subs = { new: 0, confirmed: 0, ready: 0 };
  const ord = { new: new Set(), confirmed: new Set(), ready: new Set() };

  (orders || []).forEach((o) => {
    if (o.status === 'cancelled') return;
    (o.sub_orders || []).forEach((so) => {
      if (subs[so.status] === undefined) return;
      subs[so.status] += 1;
      ord[so.status].add(o.id);
    });
  });

  return {
    waiting: subs.new,
    preparing: subs.confirmed,
    ready: subs.ready,
    waitingOrders: ord.new.size,
    preparingOrders: ord.confirmed.size,
    readyOrders: ord.ready.size,
  };
}
