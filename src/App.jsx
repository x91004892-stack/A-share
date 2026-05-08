
import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, RefreshCw, Search, Star, TrendingUp, Zap, Layers, Target, ShieldAlert } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const SECTORS = [
  { name: "PCB / CCL / 电子材料", level: "核心轮动", codes: ["603328","000823","002134","600552","002579","603002","301526","603936","301511"], logic: "AI服务器带动高速PCB、CCL、电子布、铜箔、树脂等上游材料需求，适合找非涨停强势补涨。" },
  { name: "电子布 / 铜箔 / 玻纤", level: "材料扩散", codes: ["301526","301511","600876","002585","300057","300196","601636","600552"], logic: "AI高速PCB推动上游材料涨价，重点看电子布、HVLP铜箔、复合铜箔、玻纤布。" },
  { name: "光通信 / F5G / CPO", level: "高位主线", codes: ["600498","603042","603118","002429","600105","000070","600522","000988"], logic: "AI算力网络侧主线，前排强但拥挤，适合看低位补涨和分歧承接。" },
  { name: "半导体封测 / 先进封装", level: "回流观察", codes: ["002185","000021","600584","603005","002156","600171","600460","002079"], logic: "科技分歧后可能回流芯片封测、先进封装、功率/模拟芯片。" },
  { name: "人形机器人", level: "接力方向", codes: ["002031","603667","002553","000680","301368","300421","002472","603728"], logic: "资金从高位科技向机器人零部件轮动，重点看轴承、减速器、丝杠、电机、控制器。" },
  { name: "商业航天 / 军工电子", level: "题材爆发", codes: ["000547","000901","300900","600343","002389","300581","300114","600118"], logic: "题材爆发性强，容易出涨停，但持续性需要前排确认。" },
  { name: "AI应用 / 软件 / 数据", level: "轮动补涨", codes: ["300229","601360","300166","300364","300624","300058","002230"], logic: "硬件高位分歧后，资金可能向AI应用、数据要素、软件服务扩散。" },
  { name: "液冷 / 数据中心温控", level: "扩散观察", codes: ["002837","300499","603912","300249","000977","603019"], logic: "AI服务器功耗提升推动液冷、温控、数据中心基础设施需求。" },
  { name: "电力设备 / 特高压", level: "低优先级", codes: ["601179","600406","000400","600312","601126","600089","600580"], logic: "电网投资、特高压、AIDC电力需求有中期逻辑，但短线弹性通常弱于科技主线。" },
  { name: "电池 / 固态电池", level: "修复观察", codes: ["300750","002709","002812","300073","300568","002407","300014"], logic: "电池链有修复和新技术催化，但近期资金优先级低于AI硬件。" },
  { name: "化工新材料", level: "观察", codes: ["603002","300537","603650","603722","601208","002407"], logic: "只看电子化学品、树脂、光刻胶、氟化工等科技材料，不看普通周期化工。" }
];

const RECOMMEND_POOL = [
  "603328","000823","002134","600552","002579","603002","301526","301511","002585","300057","300196",
  "600498","603042","603118","002429","000988","002185","000021","600171","600460",
  "002031","603667","002553","000680","000547","000901","300900","300229","300499","603912"
];

const DEFAULT_WATCH = ["000338","000021","601179","603328","000823","002134","603002","301526","301511","002585","300057","600552","603042","600498","002031"];

function f(n, d=2){ if(n===null||n===undefined||Number.isNaN(Number(n))) return "--"; return Number(n).toFixed(d); }
function money(n){ const v=Number(n||0); if(!v) return "--"; if(Math.abs(v)>=1e8) return (v/1e8).toFixed(2)+"亿"; if(Math.abs(v)>=1e4) return (v/1e4).toFixed(2)+"万"; return String(v); }
function pctText(n){ return `${f(n)}%`; }
function Badge({children,tone="slate"}){ const c={slate:"bg-slate-100 text-slate-700",green:"bg-emerald-100 text-emerald-700",blue:"bg-blue-100 text-blue-700",amber:"bg-amber-100 text-amber-700",red:"bg-rose-100 text-rose-700",purple:"bg-purple-100 text-purple-700"}; return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c[tone]}`}>{children}</span>; }
function ScoreBar({label,value}){ const v=Math.max(0,Math.min(100,Number(value)||0)); const color=v>=80?"bg-emerald-600":v>=65?"bg-blue-600":v>=50?"bg-amber-500":"bg-rose-500"; return <div><div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span>{Math.round(v)}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{width:v+"%"}} /></div></div>; }

async function getQuotes(codes){ const r=await fetch(`/api/quotes?codes=${encodeURIComponent(codes.join(","))}`); const j=await r.json(); return j.data||[]; }
async function getKline(code){ const r=await fetch(`/api/kline?code=${encodeURIComponent(code)}&days=120`); const j=await r.json(); return j.data||[]; }

function ma(a,n,key="close"){ if(a.length<n)return null; return a.slice(-n).reduce((s,x)=>s+Number(x[key]||0),0)/n; }
function avg(a,key){ if(!a.length)return null; return a.reduce((s,x)=>s+Number(x[key]||0),0)/a.length; }
function uniqueSortedLevels(levels, close){
  return levels.filter(x=>Number.isFinite(x)&&x>0)
    .map(x=>Number(x))
    .sort((a,b)=>Math.abs(close-a)-Math.abs(close-b))
    .filter((x,i,arr)=>arr.findIndex(y=>Math.abs(y-x)/close<0.003)===i);
}
function supportResistance(k, q){
  const close=Number(q?.price||k.at(-1)?.close||0);
  const last=k.at(-1)||{};
  const prev=k.at(-2)||{};
  const ma5=ma(k,5), ma10=ma(k,10), ma20=ma(k,20);
  const lows3=k.slice(-3).map(x=>x.low), lows5=k.slice(-5).map(x=>x.low), lows10=k.slice(-10).map(x=>x.low);
  const highs3=k.slice(-3).map(x=>x.high), highs5=k.slice(-5).map(x=>x.high), highs10=k.slice(-10).map(x=>x.high);
  const pivot=(Number(prev.high||0)+Number(prev.low||0)+Number(prev.close||0))/3;
  const s1=2*pivot-Number(prev.high||0);
  const r1=2*pivot-Number(prev.low||0);
  const supportsRaw=[
    last.low, prev.low, prev.close, ma5, ma10, ma20, Math.min(...lows3), Math.min(...lows5), Math.min(...lows10), s1
  ];
  const resistRaw=[
    last.high, prev.high, prev.close, ma5, ma10, ma20, Math.max(...highs3), Math.max(...highs5), Math.max(...highs10), r1
  ];
  const below=uniqueSortedLevels(supportsRaw,close).filter(x=>x<=close*1.005).sort((a,b)=>b-a);
  const above=uniqueSortedLevels(resistRaw,close).filter(x=>x>=close*0.995).sort((a,b)=>a-b);
  const immediate=below.find(x=>x>=close*0.965) || below[0] || null;
  const defensive=below.find(x=>x<close*0.965 && x>=close*0.91) || Math.min(...lows10) || ma10 || null;
  const trend=ma20 || Math.min(...k.slice(-20).map(x=>x.low)) || null;
  const pressure1=above.find(x=>x<=close*1.05) || above[0] || null;
  const pressure2=above.find(x=>x>close*1.05) || Math.max(...highs10) || null;
  return {close, ma5, ma10, ma20, immediate, defensive, trend, pressure1, pressure2, last, prev};
}
function sectorStats(quotes){
  if(!quotes.length)return {score:0,avgPct:0,upRatio:0,limitCount:0,amount:0,strongCount:0,weakCount:0};
  const avgPct=quotes.reduce((s,q)=>s+Number(q.pct||0),0)/quotes.length;
  const upRatio=quotes.filter(q=>Number(q.pct||0)>0).length/quotes.length;
  const limitCount=quotes.filter(q=>Number(q.pct||0)>=9.5).length;
  const strongCount=quotes.filter(q=>Number(q.pct||0)>=5).length;
  const weakCount=quotes.filter(q=>Number(q.pct||0)<=-3).length;
  const amount=quotes.reduce((s,q)=>s+Number(q.amount||0),0);
  let score=45+avgPct*8+upRatio*18+limitCount*6+strongCount*3-weakCount*4;
  if(amount>5e9)score+=5;
  return {score:Math.max(0,Math.min(100,score)),avgPct,upRatio,limitCount,amount,strongCount,weakCount};
}
function marketPhase(indexes, sectors){
  const neg=indexes.filter(q=>Number(q.pct||0)<0).length;
  const pos=indexes.filter(q=>Number(q.pct||0)>0.5).length;
  const top=sectors[0];
  if(!top)return {phase:"等待数据", tone:"slate", text:"等待行情数据加载。"};
  if(neg>=2 && top.score>=78) return {phase:"指数分歧、题材活跃", tone:"amber", text:`指数偏弱但${top.name}仍强，说明资金没有离场，而是在主线内部做高低切。短线重点看强板块分歧后的承接。`};
  if(pos>=2 && top.score>=78) return {phase:"指数与题材共振", tone:"green", text:`指数和题材同时偏强，${top.name}是当前最强方向。但连续走强后，次日不宜高开追，适合等第一次分歧。`};
  if(top.score<60) return {phase:"主线不清", tone:"red", text:"板块强度不足，短线不适合重仓出击，先观察资金是否重新聚焦。"};
  return {phase:"震荡轮动", tone:"blue", text:`市场处于轮动状态，优先做${top.name}、${sectors[1]?.name||""}等强板块里的非涨停强势票，避开弱票低位幻想。`};
}
function stockScore(q,k){
  if(!q)return null;
  const sr=supportResistance(k,q);
  const close=sr.close;
  const ma5=sr.ma5, ma10=sr.ma10, ma20=sr.ma20;
  const vma5=ma(k,5,"volume");
  const volRatio=vma5?Number(k.at(-1)?.volume||0)/vma5:null;
  let score=45;
  if(Number(q.pct)>0)score+=8; if(Number(q.pct)>3)score+=10; if(Number(q.pct)>7)score+=6;
  if(Number(q.turnover)>3)score+=5; if(Number(q.turnover)>6)score+=6; if(Number(q.turnover)>12)score-=3;
  if(Number(q.amount)>3e8)score+=6; if(Number(q.amount)>8e8)score+=5;
  if(ma5&&ma10&&close>ma5&&ma5>ma10)score+=14; else if(ma5&&close>ma5)score+=6;
  if(ma20&&close>ma20)score+=5;
  if(volRatio&&volRatio>1.15)score+=6; if(volRatio&&volRatio>2.2)score-=4;
  if(Number(q.pct)<-3)score-=16;
  if(ma5&&close<ma5)score-=8;
  score=Math.max(0,Math.min(100,score));
  let label="一般观察", tone="amber";
  if(score>=84){label="快拉候选";tone="green"} else if(score>=72){label="资金关注";tone="blue"} else if(score<55){label="偏弱回避";tone="red"}
  const trend = ma5&&ma10&&close>ma5&&ma5>ma10 ? "短线趋势偏强，均线结构支持继续观察。" : ma5&&close<ma5 ? "短线跌破5日线，进攻节奏变弱。" : "处在震荡区间，需要放量确认。";
  const prediction = score>=84 ? "如果所属板块前排不退潮，次日有继续冲高甚至冲板可能；但不能高开急追，要看分时承接。" :
    score>=72 ? "具备轮动补涨可能，需要放量突破近端压力确认；板块强它弱则放弃。" :
    score>=55 ? "走势一般，暂时只观察，不作为优先买入。" :
    "偏弱，不符合快拉票标准。";
  const buy = score>=72 ? `可看买点：回踩近端支撑 ${f(sr.immediate)} 附近不破后快速翻红，或放量站上近端压力 ${f(sr.pressure1)}。` : "买点：暂不主动买，等放量转强。";
  const risk = `放弃/止损：跌破近端支撑 ${f(sr.immediate)} 后收不回，或反抽到 ${f(sr.pressure1)} 附近冲不动。防守支撑参考 ${f(sr.defensive)}。`;
  return {score,label,tone,...sr,volRatio,trend,prediction,buy,risk};
}
function recommendScore(q, sectorScoreMap){
  const sector = SECTORS.find(s => s.codes.includes(q.code));
  const sScore = sector ? (sectorScoreMap[sector.name] || 50) : 50;
  const price = Number(q.price||0), pct = Number(q.pct||0), turn = Number(q.turnover||0), amount = Number(q.amount||0);
  let sc = 0;
  sc += sScore * 0.35;
  sc += Math.max(0, Math.min(25, pct * 4 + 8));
  sc += turn >= 3 && turn <= 12 ? 15 : turn > 12 ? 8 : 5;
  sc += amount > 8e8 ? 12 : amount > 3e8 ? 9 : amount > 1e8 ? 5 : 0;
  sc += price > 0 && price <= 25 ? 12 : price <= 40 ? 5 : -6;
  if (pct >= 9.3) sc -= 20;          // 避免已涨停直接追
  if (pct < -3) sc -= 18;            // 回避弱票
  if (turn > 20) sc -= 8;            // 高换手过热
  return { score: Math.max(0, Math.min(100, sc)), sector: sector?.name || "未分类" };
}
function recReason(q, sectorName){
  const pct=Number(q.pct||0), turn=Number(q.turnover||0), price=Number(q.price||0);
  const tags=[];
  if(price<=25) tags.push("股价友好");
  if(pct>0 && pct<9.3) tags.push("非涨停强势");
  if(turn>=3 && turn<=12) tags.push("换手适中");
  if(Number(q.amount)>3e8) tags.push("成交活跃");
  tags.push(sectorName);
  return tags.join(" / ");
}

export default function App(){
  const [indexQuotes,setIndexQuotes]=useState([]);
  const [sectorQuotes,setSectorQuotes]=useState({});
  const [watchQuotes,setWatchQuotes]=useState([]);
  const [recommendQuotes,setRecommendQuotes]=useState([]);
  const [code,setCode]=useState("000338");
  const [input,setInput]=useState("000338");
  const [q,setQ]=useState(null);
  const [k,setK]=useState([]);
  const [loading,setLoading]=useState(false);
  const [updated,setUpdated]=useState("");

  async function getQuotes(codes){ const r=await fetch(`/api/quotes?codes=${encodeURIComponent(codes.join(","))}`); const j=await r.json(); return j.data||[]; }
  async function getKline(code){ const r=await fetch(`/api/kline?code=${encodeURIComponent(code)}&days=120`); const j=await r.json(); return j.data||[]; }
  async function refreshAll(){
    setLoading(true);
    try{
      setIndexQuotes(await getQuotes(["sh000001","sz399001","sz399006"]));
      const data={};
      for(const s of SECTORS){ data[s.name]=await getQuotes(s.codes); }
      setSectorQuotes(data);
      setWatchQuotes(await getQuotes(DEFAULT_WATCH));
      setRecommendQuotes(await getQuotes(RECOMMEND_POOL));
      setUpdated(new Date().toLocaleString());
    }finally{setLoading(false)}
  }
  async function analyze(c=code){
    setLoading(true);
    try{
      const qs=await getQuotes([c]); setQ(qs[0]||null);
      setK(await getKline(c)); setCode(c);
    }finally{setLoading(false)}
  }
  useEffect(()=>{refreshAll(); analyze("000338")},[]);

  const sectorRows=useMemo(()=>SECTORS.map(s=>({...s,...sectorStats(sectorQuotes[s.name]||[]),quotes:sectorQuotes[s.name]||[]})).sort((a,b)=>b.score-a.score),[sectorQuotes]);
  const sectorScoreMap=useMemo(()=>Object.fromEntries(sectorRows.map(s=>[s.name,s.score])),[sectorRows]);
  const phase=useMemo(()=>marketPhase(indexQuotes,sectorRows),[indexQuotes,sectorRows]);
  const analysis=useMemo(()=>stockScore(q,k),[q,k]);
  const recommendations=useMemo(()=>recommendQuotes.map(x=>{
    const r=recommendScore(x,sectorScoreMap);
    return {...x, recScore:r.score, sectorName:r.sector, reason:recReason(x,r.sector)}
  }).filter(x=>x.recScore>=62).sort((a,b)=>b.recScore-a.recScore).slice(0,10),[recommendQuotes,sectorScoreMap]);
  const watchRows=useMemo(()=>watchQuotes.map(x=>{
    const r=recommendScore(x,sectorScoreMap);
    return {...x, score:r.score, sectorName:r.sector}
  }).sort((a,b)=>b.score-a.score),[watchQuotes,sectorScoreMap]);

  return <div className="min-h-screen bg-slate-50 p-5 md:p-8 text-slate-900">
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500"><Activity size={16}/> A股短线主线看板 Pro Plus</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">盘面 · 板块 · 个股 · 短期推荐</h1>
          <p className="mt-2 text-slate-600">改进了个股支撑位算法，并新增“基于指标的短期看好个股推荐”。</p>
        </div>
        <button onClick={()=>{refreshAll();analyze(code)}} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 hover:bg-slate-700">
          <RefreshCw size={18} className={loading?"animate-spin":""}/> 刷新数据
        </button>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm"><BarChart3 size={16}/> 第一块：当天盘面详细分析</div>
          <h2 className="mt-1 text-2xl font-bold">市场状态：<Badge tone={phase.tone}>{phase.phase}</Badge></h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {indexQuotes.map(x=><div key={x.code} className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-sm text-slate-500">{x.name}</div>
              <div className="mt-1 text-2xl font-bold">{f(x.price)}</div>
              <div className={`mt-1 font-semibold ${Number(x.pct)>=0?"text-rose-600":"text-emerald-600"}`}>{f(x.change)} / {f(x.pct)}%</div>
              <div className="mt-2 text-xs text-slate-500">成交额 {money(x.amount)}</div>
            </div>)}
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="font-bold">盘面解读</div>
              <p className="mt-2 leading-relaxed text-slate-700">{phase.text}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="font-bold">下个交易日推演</div>
              <p className="mt-2 leading-relaxed text-slate-700">成交额维持高位时，主线仍有轮动基础；高位前排若集体高开低走，要降低仓位。优先做强板块里主动放量的票，不做板块强它弱的票。</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Star size={16}/> 当前最强主线</div>
          <h2 className="mt-1 text-2xl font-bold">{sectorRows[0]?.name||"--"}</h2>
          <div className="mt-3"><ScoreBar label="主线强度" value={sectorRows[0]?.score||0}/></div>
          <p className="mt-4 text-slate-700 leading-relaxed">{sectorRows[0]?.logic}</p>
          <div className="mt-4 text-xs text-slate-500">更新：{updated||"--"}</div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Layers size={16}/> 第二块：板块强度与后续走势预测</div>
        <h2 className="mt-1 text-2xl font-bold">板块强度、持续性和交易重点</h2>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sectorRows.map(s=><div key={s.name} className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex justify-between gap-3">
              <div><h3 className="font-bold text-lg">{s.name}</h3><div className="mt-1"><Badge tone={s.score>=80?"green":s.score>=65?"blue":s.score>=50?"amber":"red"}>{s.level}</Badge></div></div>
              <div className="text-3xl font-bold">{Math.round(s.score)}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>平均涨幅 <b>{f(s.avgPct)}%</b></div>
              <div>上涨占比 <b>{f(s.upRatio*100,0)}%</b></div>
              <div>涨停数 <b>{s.limitCount}</b></div>
              <div>强势数 <b>{s.strongCount}</b></div>
              <div className="col-span-2">成交额 <b>{money(s.amount)}</b></div>
            </div>
            <div className="mt-4"><ScoreBar label="板块评分" value={s.score}/></div>
            <p className="mt-3 text-sm text-slate-700">{s.logic}</p>
            <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3 text-sm">
              <b>预测：</b>{s.score>=80?"主线仍有延续，但追高风险增加，等分歧承接。":s.score>=65?"有轮动机会，观察前排是否继续强。":s.score>=50?"只看修复，不做主攻。":"暂时回避。"}
            </div>
          </div>)}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Zap size={16}/> 新增：短期看好个股推荐</div>
        <h2 className="mt-1 text-2xl font-bold">基于板块强度、涨幅、换手、成交额、价格和涨停风险自动筛选</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recommendations.map(x=><div key={x.code} className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex justify-between gap-3">
              <div><h3 className="text-xl font-bold">{x.name} <span className="text-sm text-slate-400">{x.code}</span></h3><div className="mt-2"><Badge tone="blue">{x.sectorName}</Badge></div></div>
              <div className="text-3xl font-bold">{Math.round(x.recScore)}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>现价 <b>{f(x.price)}</b></div><div>涨跌 <b className={Number(x.pct)>=0?"text-rose-600":"text-emerald-600"}>{f(x.pct)}%</b></div>
              <div>换手 <b>{f(x.turnover)}%</b></div><div>成交 <b>{money(x.amount)}</b></div>
            </div>
            <div className="mt-3"><ScoreBar label="短期看好评分" value={x.recScore}/></div>
            <p className="mt-3 text-sm text-slate-700">{x.reason}</p>
            <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">看点：板块不退潮时，低开不破或回踩分时均线后重新放量，可作为盘中候选。</div>
            <div className="mt-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">放弃：高开急冲、放量冲高回落、板块强它弱。</div>
          </div>)}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Search size={16}/> 第三块：个股最新走势与预测</div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div><h2 className="mt-1 text-2xl font-bold">输入股票代码，生成更实用的支撑/压力和交易计划</h2><p className="mt-2 text-slate-600">支撑位已改为近端、防守、趋势三层，不再只取过低的20日低点。</p></div>
          <div className="flex gap-2"><input className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300" value={input} onChange={e=>setInput(e.target.value)} /><button className="rounded-xl bg-slate-900 text-white px-5 py-3" onClick={()=>analyze(input)}>分析</button></div>
        </div>
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 rounded-2xl bg-slate-50 border border-slate-200 p-4 min-h-[360px]">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-2xl font-bold">{q?.name||code} <span className="text-sm text-slate-400">{q?.code}</span></h3><div className={`mt-1 text-lg font-bold ${Number(q?.pct)>=0?"text-rose-600":"text-emerald-600"}`}>{f(q?.price)} · {f(q?.pct)}%</div><div className="mt-2 text-sm text-slate-500">换手 {f(q?.turnover)}% · 成交 {money(q?.amount)}</div></div>
              {analysis&&<Badge tone={analysis.tone}>{analysis.label}</Badge>}
            </div>
            <div className="h-72 mt-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={k}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" hide /><YAxis domain={["dataMin","dataMax"]} width={50}/><Tooltip /><Line dataKey="close" dot={false} strokeWidth={2} /></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <h3 className="font-bold text-lg">个股综合判断</h3>
            {analysis?<>
              <div className="mt-3"><ScoreBar label="快拉评分" value={analysis.score}/></div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>MA5 <b>{f(analysis.ma5)}</b></div><div>MA10 <b>{f(analysis.ma10)}</b></div>
                <div>MA20 <b>{f(analysis.ma20)}</b></div><div>量比估算 <b>{f(analysis.volRatio)}</b></div>
                <div>近端支撑 <b>{f(analysis.immediate)}</b></div><div>防守支撑 <b>{f(analysis.defensive)}</b></div>
                <div>趋势支撑 <b>{f(analysis.trend)}</b></div><div>近端压力 <b>{f(analysis.pressure1)}</b></div>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <div className="rounded-xl bg-white border border-slate-200 p-3"><b>趋势判断：</b>{analysis.trend}</div>
                <div className="rounded-xl bg-white border border-slate-200 p-3"><b>走势预测：</b>{analysis.prediction}</div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">{analysis.buy}</div>
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800">{analysis.risk}</div>
              </div>
            </>:<p className="text-slate-500 mt-3">等待数据。</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Target size={16}/> 观察池强度排序</div>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500 border-b"><th className="py-3 pr-4">股票</th><th className="py-3 pr-4">现价</th><th className="py-3 pr-4">涨跌幅</th><th className="py-3 pr-4">换手</th><th className="py-3 pr-4">成交额</th><th className="py-3 pr-4">评分</th><th className="py-3 pr-4">操作</th></tr></thead>
          <tbody>{watchRows.map(x=><tr key={x.code} className="border-b last:border-0"><td className="py-3 pr-4 font-semibold">{x.name} <span className="text-slate-400">{x.code}</span></td><td className="py-3 pr-4">{f(x.price)}</td><td className={`py-3 pr-4 font-bold ${Number(x.pct)>=0?"text-rose-600":"text-emerald-600"}`}>{f(x.pct)}%</td><td className="py-3 pr-4">{f(x.turnover)}%</td><td className="py-3 pr-4">{money(x.amount)}</td><td className="py-3 pr-4"><Badge tone={x.score>=80?"green":x.score>=65?"blue":x.score>=50?"amber":"red"}>{Math.round(x.score)}</Badge></td><td className="py-3 pr-4"><button className="text-blue-600 font-medium" onClick={()=>{setInput(x.code);analyze(x.code)}}>分析</button></td></tr>)}</tbody>
        </table></div>
      </section>

      <section className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex gap-2">
        <ShieldAlert size={18} className="shrink-0 mt-0.5"/><p>提醒：这是规则模型，支撑位和推荐只是辅助决策，不保证涨跌。抓涨停必须结合竞价、盘口、板块前排、分时承接和封单质量。</p>
      </section>
    </div>
  </div>
}
