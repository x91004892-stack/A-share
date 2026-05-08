
function num(v) {
  if (v === '-' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const type = String(req.query.type || 'concept'); // concept | industry
  const fs = type === 'industry' ? 'm:90+t:2' : 'm:90+t:3';
  const pz = Number(req.query.pz || 300);
  const fields = [
    'f12','f13','f14','f2','f3','f4','f5','f6','f7','f8','f20','f21','f62'
  ].join(',');
  const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${pz}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${encodeURIComponent(fs)}&fields=${fields}`;

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://finance.eastmoney.com/' }
    });
    const data = await r.json();
    const list = data?.data?.diff || [];
    const result = list.map(x => ({
      code: x.f12,
      market: x.f13,
      name: x.f14,
      price: num(x.f2),
      pct: num(x.f3),
      change: num(x.f4),
      volume: num(x.f5),
      amount: num(x.f6),
      amplitude: num(x.f7),
      turnover: num(x.f8),
      totalMarketCap: num(x.f20),
      floatMarketCap: num(x.f21),
      mainNetInflow: num(x.f62)
    }));
    res.status(200).json({ ok: true, type, data: result, source: 'eastmoney-board-list' });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e.message || e), data: [] });
  }
}
