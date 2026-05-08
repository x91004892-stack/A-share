
function toSecid(codeRaw) {
  const raw = String(codeRaw || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.startsWith('sh')) return `1.${raw.replace('sh', '')}`;
  if (raw.startsWith('sz')) return `0.${raw.replace('sz', '')}`;
  const code = raw.replace(/\D/g, '');
  if (!code) return null;
  if (code === '000001') return `1.${code}`;
  if (code.startsWith('399')) return `0.${code}`;
  if (code.startsWith('6') || code.startsWith('9')) return `1.${code}`;
  return `0.${code}`;
}
function num(v) {
  if (v === '-' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const codesParam = req.query.codes || 'sh000001,sz399001,sz399006';
  const codes = String(codesParam).split(',').map(s => s.trim()).filter(Boolean);
  const secids = codes.map(toSecid).filter(Boolean).join(',');
  const fields = ['f12','f13','f14','f2','f3','f4','f5','f6','f7','f8','f9','f10','f15','f16','f17','f18','f20','f21','f23','f24','f25','f62'].join(',');
  const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=${fields}&secids=${encodeURIComponent(secids)}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://finance.eastmoney.com/' } });
    const data = await r.json();
    const list = data?.data?.diff || [];
    const result = list.map(x => ({
      code: x.f12, market: x.f13, name: x.f14,
      price: num(x.f2), pct: num(x.f3), change: num(x.f4),
      volume: num(x.f5), amount: num(x.f6), amplitude: num(x.f7), turnover: num(x.f8),
      pe: num(x.f9), high: num(x.f15), low: num(x.f16), open: num(x.f17), preClose: num(x.f18),
      totalMarketCap: num(x.f20), floatMarketCap: num(x.f21), pb: num(x.f23),
      pct5: num(x.f24), pctYtd: num(x.f25), mainNetInflow: num(x.f62)
    }));
    res.status(200).json({ ok: true, data: result, source: 'eastmoney' });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e.message || e), data: [] });
  }
}
