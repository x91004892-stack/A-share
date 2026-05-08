import React, { useMemo, useState } from "react";
import { Search, AlertTriangle, Activity, ShieldCheck, Zap, BarChart3, Filter, Target, RefreshCw } from "lucide-react";

const sectors = [
  { name: "PCB / CCL / 电子材料", strength: 92, status: "主线延续", note: "AI硬件链扩散，关注非涨停强势补涨", risk: "前排高位分歧" },
  { name: "人形机器人", strength: 88, status: "新接力", note: "看减速器、轴承、丝杠、电机方向", risk: "前排连板后分化" },
  { name: "商业航天", strength: 84, status: "题材爆发", note: "适合看低位补涨和换手板", risk: "持续性需确认" },
  { name: "光通信 / F5G", strength: 81, status: "高位分歧", note: "只看低位承接，不追高位核心", risk: "涨幅较大" },
  { name: "半导体封测", strength: 76, status: "轮动观察", note: "适合等科技分歧后的资金回流", risk: "弹性弱于前排" },
  { name: "电池 / 化工", strength: 58, status: "修复观察", note: "不是当前第一主线，只看新材料细分", risk: "资金优先级低" }
];

const candidates = [
  {
    code: "603328",
    name: "依顿电子",
    sector: "PCB",
    price: 13.0,
    limitUp: false,
    score: 86,
    momentum: 82,
    fund: 78,
    position: 76,
    risk: 52,
    style: "低价补涨",
    trigger: "PCB前排不退潮，低开不破后快速翻红",
    buy: "回踩12.8—13.0附近承接，放量站回分时均线",
    avoid: "高开急冲、板块前排炸板、放量冲高回落"
  },
  {
    code: "000823",
    name: "超声电子",
    sector: "PCB / 覆铜板",
    price: 14.8,
    limitUp: false,
    score: 84,
    momentum: 80,
    fund: 83,
    position: 72,
    risk: 55,
    style: "资金补拉",
    trigger: "PCB资金继续扩散，早盘主动放量",
    buy: "4%—7%半路放量突破，分时均线不破",
    avoid: "板块强它不强，或10点半前仍无主动性"
  },
  {
    code: "002134",
    name: "天津普林",
    sector: "PCB",
    price: 12.5,
    limitUp: false,
    score: 82,
    momentum: 79,
    fund: 74,
    position: 78,
    risk: 58,
    style: "抓板候选",
    trigger: "低价PCB补涨，前排继续强时容易点火",
    buy: "高开3%以内，快速放量突破前高",
    avoid: "高开过大，或冲板失败快速回落"
  },
  {
    code: "600552",
    name: "凯盛科技",
    sector: "电子材料",
    price: 15.6,
    limitUp: false,
    score: 79,
    momentum: 76,
    fund: 81,
    position: 69,
    risk: 60,
    style: "材料补涨",
    trigger: "电子材料扩散，资金继续从PCB上游挖掘",
    buy: "小幅回踩不破，重新放量站上前一日高点",
    avoid: "近期涨幅过快后高开低走"
  },
  {
    code: "002579",
    name: "中京电子",
    sector: "PCB / 封装载板",
    price: 10.8,
    limitUp: false,
    score: 72,
    momentum: 69,
    fund: 58,
    position: 81,
    risk: 63,
    style: "低价观察",
    trigger: "板块强势时才看是否补拉",
    buy: "放量转强、突破平台再考虑",
    avoid: "板块涨它横盘，直接放弃"
  }
];

const holdings = [
  { name: "潍柴动力", status: "高位分歧", cost: "填写你的成本", current: "33.06", pnl: "自动/手动计算", support: "32.75—32.88", pressure: "33.8—34.5", action: "反抽冲不动可做T/减仓" },
  { name: "深科技", status: "趋势偏慢", cost: "填写你的成本", current: "31.02", pnl: "自动/手动计算", support: "30.46", pressure: "32.0", action: "板块强仍弱则降级" },
  { name: "中国西电", status: "震荡修复", cost: "填写你的成本", current: "17.50", pnl: "自动/手动计算", support: "17.0—17.2", pressure: "17.8—18.0", action: "不重仓恋战，看18元突破" }
];

function ScoreBar({ value, label }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-blue-100 text-blue-700"
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(25);
  const [minScore, setMinScore] = useState(75);
  const [hideLimitUp, setHideLimitUp] = useState(true);

  const filtered = useMemo(() => {
    return candidates.filter((item) => {
      const matchQuery = `${item.name}${item.code}${item.sector}`.includes(query.trim());
      const matchPrice = item.price <= maxPrice;
      const matchScore = item.score >= minScore;
      const matchLimit = hideLimitUp ? !item.limitUp : true;
      return matchQuery && matchPrice && matchScore && matchLimit;
    });
  }, [query, maxPrice, minScore, hideLimitUp]);

  const topSector = sectors[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-5 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Activity size={16} /> A股短线主线选股看板 · 初版模板
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">主线强度、快拉候选与持仓风控</h1>
            <p className="mt-2 text-slate-600 max-w-3xl">用于盘后复盘和次日计划：先判断板块，再筛非涨停强势票，最后给出买点、放弃条件和持仓处理。</p>
          </div>
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 min-w-[240px]">
            <div className="text-xs text-slate-500">当前优先主线</div>
            <div className="mt-1 text-xl font-bold">{topSector.name}</div>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone="green">强度 {topSector.strength}</Badge>
              <Badge tone="blue">{topSector.status}</Badge>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm"><Zap size={16} /> 快拉筛选原则</div>
            <h2 className="mt-2 text-xl font-bold">强板块里的非涨停强票</h2>
            <p className="mt-2 text-sm text-slate-600">不买弱票幻想补涨；不盲追连续涨停；重点看资金开始进攻、价格不高、回踩承接强的票。</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm"><Target size={16} /> 买点原则</div>
            <h2 className="mt-2 text-xl font-bold">分歧后确认，不开盘盲冲</h2>
            <p className="mt-2 text-sm text-slate-600">优先等低开不破、快速翻红、站回分时均线，或4%—7%半路放量突破。</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm"><ShieldCheck size={16} /> 风控原则</div>
            <h2 className="mt-2 text-xl font-bold">错了快走，涨停票更谨慎</h2>
            <p className="mt-2 text-sm text-slate-600">板块前排炸板、个股放量冲高回落、板块强它弱，全部视为放弃信号。</p>
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm"><BarChart3 size={16} /> 板块强度</div>
              <h2 className="text-2xl font-bold mt-1">先选板块，再选个股</h2>
            </div>
            <Badge tone="amber">盘后手动更新数据</Badge>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sectors.map((s) => (
              <div key={s.name} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-lg">{s.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{s.note}</p>
                  </div>
                  <Badge tone={s.strength >= 85 ? "green" : s.strength >= 75 ? "blue" : "slate"}>{s.status}</Badge>
                </div>
                <div className="mt-4"><ScoreBar label="板块强度" value={s.strength} /></div>
                <div className="mt-3 flex items-center gap-2 text-xs text-rose-600"><AlertTriangle size={14} /> 风险：{s.risk}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-500 text-sm"><Filter size={16} /> 快拉候选池</div>
              <h2 className="text-2xl font-bold mt-1">非涨停强势票筛选</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="relative sm:col-span-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" placeholder="搜索名称/代码/板块" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                股价≤
                <input type="number" className="w-16 bg-transparent outline-none font-semibold" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
              </label>
              <label className="flex items-center gap-2 text-sm bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                评分≥
                <input type="number" className="w-14 bg-transparent outline-none font-semibold" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
              </label>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <input id="hideLimit" type="checkbox" checked={hideLimitUp} onChange={(e) => setHideLimitUp(e.target.checked)} />
            <label htmlFor="hideLimit" className="text-slate-600">隐藏已涨停票</label>
          </div>

          <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <article key={item.code} className="rounded-2xl border border-slate-200 p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <span className="text-sm text-slate-400">{item.code}</span>
                      <Badge tone="blue">{item.sector}</Badge>
                      <Badge tone={item.score >= 84 ? "green" : "amber"}>{item.style}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">现价参考：{item.price} 元 · 综合评分 {item.score}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{item.score}</div>
                    <div className="text-xs text-slate-500">快拉评分</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ScoreBar label="动量" value={item.momentum} />
                  <ScoreBar label="资金" value={item.fund} />
                  <ScoreBar label="位置" value={item.position} />
                  <ScoreBar label="安全边际" value={100 - item.risk} />
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="font-semibold text-slate-900">触发条件</div>
                    <p className="mt-1 text-slate-600">{item.trigger}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <div className="font-semibold text-emerald-900">可看买点</div>
                    <p className="mt-1 text-emerald-700">{item.buy}</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-3">
                    <div className="font-semibold text-rose-900">放弃条件</div>
                    <p className="mt-1 text-rose-700">{item.avoid}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm"><RefreshCw size={16} /> 持仓监控</div>
          <h2 className="text-2xl font-bold mt-1">不是所有持仓都适合继续恋战</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-3 pr-4">股票</th>
                  <th className="py-3 pr-4">状态</th>
                  <th className="py-3 pr-4">成本</th>
                  <th className="py-3 pr-4">当前价</th>
                  <th className="py-3 pr-4">盈亏</th>
                  <th className="py-3 pr-4">支撑位</th>
                  <th className="py-3 pr-4">压力位</th>
                  <th className="py-3 pr-4">处理建议</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.name} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-semibold">{h.name}</td>
                    <td className="py-3 pr-4"><Badge tone={h.status.includes("分歧") ? "amber" : "slate"}>{h.status}</Badge></td>
                    <td className="py-3 pr-4">{h.cost}</td>
                    <td className="py-3 pr-4">{h.current}</td>
                    <td className="py-3 pr-4">{h.pnl}</td>
                    <td className="py-3 pr-4">{h.support}</td>
                    <td className="py-3 pr-4">{h.pressure}</td>
                    <td className="py-3 pr-4 text-slate-600">{h.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-xs text-slate-500 leading-relaxed">
          提醒：此看板用于训练复盘和交易计划，不构成投资建议。实际交易前需要结合实时盘口、竞价、成交量、板块前排状态和个人风险承受能力。
        </footer>
      </div>
    </div>
  );
}
