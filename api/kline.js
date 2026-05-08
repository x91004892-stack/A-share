
function toSecid(codeRaw) {
  const raw = String(codeRaw || '').trim().toLowerCase();
  if (raw.startsWith('sh')) return `1.${raw.replace('sh', '')}`;
  if (raw.startsWith('sz')) return `0.${raw.replace('sz', '')}`;
  const code = raw.replace(/\D/g, '');
  if (code === '000001') return `1.${code}`;
  if (code.startsWith('399')) return `0.${code}`;
  if (code.startsWith('6') || code.startsWith('9')) return `1.${code}`;
  return `0.${code}`;
}
function n(v) { const x = Number(v); return Number.isFinite(x) ? x : null; }
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const code = req.query.code || '000338';
  const secid = toSecid(code);
  const days = Number(req.query.days || 120);
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&beg=20240101&end=20500101`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://finance.eastmoney.com/' } });
    const data = await r.json();
    const raw = data?.data?.klines || [];
    const parsed = raw.slice(-days).map(s => {
      const [date, open, close, high, low, volume, amount, amplitude, pct, change, turnover] = s.split(',');
      return { date, open:n(open), close:n(close), high:n(high), low:n(low), volume:n(volume), amount:n(amount), amplitude:n(amplitude), pct:n(pct), change:n(change), turnover:n(turnover) };
    });
    res.status(200).json({ ok: true, code, name: data?.data?.name, data: parsed, source: 'eastmoney' });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e.message || e), data: [] });
  }
}
