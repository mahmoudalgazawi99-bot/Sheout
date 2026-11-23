export async function fetchAll(build) {
  const out = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data, error } = await build().range(from, from + 999);
    if (error || !data) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}
