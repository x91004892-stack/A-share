
import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, LineChart as LineIcon, RefreshCw, Search, ShieldCheck, Target, TrendingUp, Zap, Newspaper, Layers, Star } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

const SECTORS = [
  { name: "PCB / CCL / 电子材料", type: "科技硬件", level: "核心轮动", codes: ["603328","000823","002134","600552","002579","603002","301526","603936","301511"], logic: "AI服务器带动高速PCB、CCL、电子布、铜箔、树脂等上游材料需求，适合找非涨停强势补涨。", watch: "前排不退潮时，看低价PCB、电子材料、铜箔/电子布扩散。" },
  { name: "电子布 / 铜箔 / 玻纤", type: "材料分支", level: "补涨扩散", codes: ["301526","301511","600876","002585","300057","000012","300196","601636"], logic: "AI高速PCB推动上游材料涨价，重点看电子布、HVLP铜箔、复合铜箔、玻纤布。", watch: "不能追高位核心，优先看放量转强、回踩承接的中低位票。" },
  { name: "光通信 / F5G / CPO", type: "科技硬件", level: "高位主线", codes: ["600498","603042","603118","002429","600105","000070","600522","000988"], logic: "AI算力网络侧主线，前排强但拥挤，适合看低位补涨和分歧承接。", watch: "前排涨停连续加速时不追，只看未涨停强势票。" },
  { name: "铜缆高速连接", type: "AI硬件", level: "弹性分支", codes: ["002130","300252","002281","300476","002463"], logic: "AI服务器内部高速连接需求提升，弹性大但波动也大。", watch: "必须看板块同步，弱票不提前埋伏。" },
  { name: "半导体封测 / 先进封装", type: "芯片", level: "回流观察", codes: ["002185","000021","600584","603005","002156","600171","600460","002079"], logic: "科技分歧后可能回流芯片封测、功率/模拟芯片，但短线不如CPO和PCB直接。", watch: "只看放量站上压力位的票，避免磨人中军。" },
  { name: "人形机器人", type: "题材接力", level: "新接力", codes: ["002031","603667","002553","000680","301368","300421","002472","603728"], logic: "资金从高位科技向机器人零部件轮动，重点看轴承、减速器、丝杠、电机、控制器。", watch: "前排连板不崩时，看后排低位换手补涨。" },
  { name: "商业航天 / 军工电子", type: "题材接力", level: "爆发观察", codes: ["000547","000901","300900","600343","002389","300581","300114","600118"], logic: "题材爆发性强，容易出涨停，但持续性需要前排确认。", watch: "只做强延续，不做冲高回落。" },
  { name: "AI应用 / 软件 / 数据", type: "轮动补涨", level: "补涨观察", codes: ["300229","601360","300166","300364","300624","300058","002230"], logic: "硬件高位分歧后，资金可能向AI应用、数据要素、软件服务扩散。", watch: "不作为第一主线，适合小仓快进快出。" },
  { name: "液冷 / 数据中心温控", type: "AI基础设施", level: "扩散观察", codes: ["002837","300499","603912","300249","300502","000977"], logic: "AI服务器功耗提升推动液冷、温控、数据中心基础设施需求。", watch: "前排已涨停时，后排必须放量确认。" },
  { name: "电力设备 / 特高压", type: "补涨防守", level: "低优先级", codes: ["601179","600406","000400","600312","601126","600089","600580"], logic: "电网投资、特高压、AIDC电力需求有中期逻辑，但短线弹性通常弱于科技主线。", watch: "科技分歧且板块整体回流时才看。" },
  { name: "电池 / 固态电池", type: "成长修复", level: "修复观察", codes: ["300750","002709","002812","300073","300568","002407","300014"], logic: "电池链有修复和新技术催化，但近期资金优先级低于AI硬件。", watch: "宁德等核心止跌后再看低位补涨。" },
  { name: "化工新材料", type: "材料补涨", level: "观察", codes: ["603002","300537","603650","603722","601208","002407"], logic: "只看电子化学品、树脂、光刻胶、氟化工等科技材料，不看普通周期化工。", watch: "必须贴科技主线，否则容易弱反抽。" }
];

const DEFAULT_WATCH = ["000338","000021","601179","603328","000823","002134","603002","301526","301511","002585","300057","600552","603042","600498","002031"];

function f(n, d=2){ if(n===null||n===undefined||Number.isNaN(Number(n))) return "--"; return Number(n).toFixed(d); }
function money(n){ const v=Number(n||0); if(!v) return "--"; if(Math.abs(v)>=1e8) return (v/1e8).toFixed(2)+"亿"; if(Math.abs(v)>=1e4) return (v/1e4).toFixed(2)+"万"; return String(v); }
function Badge({children,tone="slate"}){ const c={slate:"bg-slate-100 text-slate-700",green:"bg-emerald-100 text-emerald-700",blue:"bg-blue-100 text-blue-700",amber:"bg-amber-100 text-amber-700",red:"bg-rose-100 text-rose-700",purple:"bg-purple-100 text-purple-700"}; return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c[tone]}`}>{children}</span>; }
function ScoreBar({label,value}){ const v=Math.max(0,Math.min(100,Number(value)||0)); const color=v>=80?"bg-emerald-600":v>=65?"bg-blue-600":v>=50?"bg-amber-500":"bg-rose-500"; return <div><div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span>{Math.round(v)}</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{width:v+"%"}} /></div></div>; }

async function getQuotes(codes){ const r=await fetch(`/api/quotes?codes=${encodeURIComponent(codes.join(","))}`); const j=await r.json(); return j.data||[]; }
async function getKline(code){ const r=await fetch(`/api/kline?code=${encodeURIComponent(code)}&days=120`); const j=await r.json(); return j.data||[]; }

function ma(a,n,key="close"){ if(a.length<n)return null; return a.slice(-n).reduce((s,x)=>s+Number(x[key]||0),0)/n; }
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
  const close=Number(q.price||k.at(-1)?.close||0);
  const ma5=ma(k,5), ma10=ma(k,10), ma20=ma(k,20), vma5=ma(k,5,"volume");
  const hi20=Math.max(...k.slice(-20).map(x=>Number(x.high||0)));
  const lo20=Math.min(...k.slice(-20).map(x=>Number(x.low||999999)));
  const volRatio=vma5?Number(k.at(-1)?.volume||0)/vma5:null;
  let score=45;
  if(Number(q.pct)>0)score+=8; if(Number(q.pct)>3)score+=10; if(Number(q.pct)>7)score+=6;
  if(Number(q.turnover)>5)score+=8; if(Number(q.turnover)>10)score+=6;
  if(Number(q.amount)>5e8)score+=8;
  if(ma5&&ma10&&close>ma5&&ma5>ma10)score+=14; else if(ma5&&close>ma5)score+=6;
  if(ma20&&close>ma20)score+=6;
  if(hi20&&close>hi20*0.97)score+=6;
  if(volRatio&&volRatio>1.3)score+=8;
  if(Number(q.pct)<-3)score-=16;
  if(ma5&&close<ma5)score-=8;
  score=Math.max(0,Math.min(100,score));
  let label="一般观察", tone="amber";
  if(score>=84){label="快拉候选";tone="green"} else if(score>=72){label="资金关注";tone="blue"} else if(score<55){label="偏弱回避";tone="red"}
  const prediction = score>=84 ? "如果所属板块前排不退潮，次日有继续冲高甚至冲板可能；但不能高开急追，要看分时承接。" :
    score>=72 ? "具备轮动补涨可能，需要放量突破压力位确认；板块强它弱则放弃。" :
    score>=55 ? "走势一般，暂时只观察，不作为优先买入。" :
    "偏弱，不符合快拉票标准。";
  const buy = score>=72 ? `可看买点：低开不破${f(lo20)}附近、快速翻红，或放量站上${f(hi20)}附近。` : "买点：暂不主动买，等放量转强。";
  const risk = `风险/放弃：跌破${f(lo20)}附近收不回，或高开后放量冲高回落。`;
  return {score,label,tone,ma5,ma10,ma20,hi20,lo20,volRatio,prediction,buy,risk};
}

export default function App(){
  const [indexQuotes,setIndexQuotes]=useState([]);
  const [sectorQuotes,setSectorQuotes]=useState({});
  const [watchQuotes,setWatchQuotes]=useState([]);
  const [code,setCode]=useState("000338");
  const [input,setInput]=useState("000338");
  const [q,setQ]=useState(null);
  const [k,setK]=useState([]);
  const [loading,setLoading]=useState(false);
  const [updated,setUpdated]=useState("");

  async function refreshAll(){
    setLoading(true);
    try{
      setIndexQuotes(await getQuotes(["sh000001","sz399001","sz399006"]));
      const data={};
      for(const s of SECTORS){ data[s.name]=await getQuotes(s.codes); }
      setSectorQuotes(data);
      setWatchQuotes(await getQuotes(DEFAULT_WATCH));
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
  const phase=useMemo(()=>marketPhase(indexQuotes,sectorRows),[indexQuotes,sectorRows]);
  const analysis=useMemo(()=>stockScore(q,k),[q,k]);
  const watchRows=useMemo(()=>watchQuotes.map(x=>{
    let sc=45+Math.max(-10,Math.min(10,Number(x.pct||0)))*3+(Number(x.turnover||0)>5?8:0)+(Number(x.amount||0)>5e8?8:0)+(Number(x.pct||0)>5?8:0);
    return {...x,score:Math.max(0,Math.min(100,sc))}
  }).sort((a,b)=>b.score-a.score),[watchQuotes]);

  return <div className="min-h-screen bg-slate-50 p-5 md:p-8 text-slate-900">
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500"><Activity size={16}/> A股短线主线看板 Pro</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">大盘 · 板块 · 个股 · 走势预测</h1>
          <p className="mt-2 text-slate-600">更详细的盘面复盘，更多板块强度，个股自动抓取报价和K线，生成短线交易计划。</p>
        </div>
        <button onClick={()=>{refreshAll();analyze(code)}} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 hover:bg-slate-700">
          <RefreshCw size={18} className={loading?"animate-spin":""}/> 刷新数据
        </button>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Newspaper size={16}/> 第一块：当天盘面详细分析</div>
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
              <p className="mt-2 leading-relaxed text-slate-700">如果成交额维持高位，主线仍有轮动基础；如果高位前排集体高开低走，要降低仓位，等待低位强分支重新确认。优先做强板块里主动放量的票，不做板块强它弱的票。</p>
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
        <h2 className="mt-1 text-2xl font-bold">覆盖更多板块：强度、持续性、交易重点</h2>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sectorRows.map(s=><div key={s.name} className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg">{s.name}</h3>
                <div className="mt-1 flex gap-2 flex-wrap"><Badge tone="blue">{s.type}</Badge><Badge tone={s.score>=80?"green":s.score>=65?"blue":s.score>=50?"amber":"red"}>{s.level}</Badge></div>
              </div>
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
              <br/><b>交易重点：</b>{s.watch}
            </div>
          </div>)}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Search size={16}/> 第三块：个股最新走势与预测</div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="mt-1 text-2xl font-bold">输入股票代码，生成更详细交易计划</h2>
            <p className="mt-2 text-slate-600">支持：000338、000021、601179、603328、301526 等 A股代码。</p>
          </div>
          <div className="flex gap-2">
            <input className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300" value={input} onChange={e=>setInput(e.target.value)} />
            <button className="rounded-xl bg-slate-900 text-white px-5 py-3" onClick={()=>analyze(input)}>分析</button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 rounded-2xl bg-slate-50 border border-slate-200 p-4 min-h-[360px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold">{q?.name||code} <span className="text-sm text-slate-400">{q?.code}</span></h3>
                <div className={`mt-1 text-lg font-bold ${Number(q?.pct)>=0?"text-rose-600":"text-emerald-600"}`}>{f(q?.price)} · {f(q?.pct)}%</div>
                <div className="mt-2 text-sm text-slate-500">换手 {f(q?.turnover)}% · 成交 {money(q?.amount)} · 量能/波动需结合分时判断</div>
              </div>
              {analysis&&<Badge tone={analysis.tone}>{analysis.label}</Badge>}
            </div>
            <div className="h-72 mt-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={k}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={["dataMin","dataMax"]} width={50}/>
                  <Tooltip />
                  <Line dataKey="close" dot={false} strokeWidth={2} />
                </LineChart>
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
                <div>支撑 <b>{f(analysis.lo20)}</b></div><div>压力 <b>{f(analysis.hi20)}</b></div>
                <div>市盈率 <b>{f(q?.pe)}</b></div><div>市净率 <b>{f(q?.pb)}</b></div>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <div className="rounded-xl bg-white border border-slate-200 p-3"><b>走势预测：</b>{analysis.prediction}</div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">{analysis.buy}</div>
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800">{analysis.risk}</div>
              </div>
            </>:<p className="text-slate-500 mt-3">等待数据。</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Zap size={16}/> 快拉候选池：自动强度排序</div>
        <h2 className="mt-1 text-2xl font-bold">优先找强板块里的非弱票</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b">
              <th className="py-3 pr-4">股票</th><th className="py-3 pr-4">现价</th><th className="py-3 pr-4">涨跌幅</th><th className="py-3 pr-4">换手</th><th className="py-3 pr-4">成交额</th><th className="py-3 pr-4">评分</th><th className="py-3 pr-4">操作</th>
            </tr></thead>
            <tbody>{watchRows.map(x=><tr key={x.code} className="border-b last:border-0">
              <td className="py-3 pr-4 font-semibold">{x.name} <span className="text-slate-400">{x.code}</span></td>
              <td className="py-3 pr-4">{f(x.price)}</td>
              <td className={`py-3 pr-4 font-bold ${Number(x.pct)>=0?"text-rose-600":"text-emerald-600"}`}>{f(x.pct)}%</td>
              <td className="py-3 pr-4">{f(x.turnover)}%</td>
              <td className="py-3 pr-4">{money(x.amount)}</td>
              <td className="py-3 pr-4"><Badge tone={x.score>=80?"green":x.score>=65?"blue":x.score>=50?"amber":"red"}>{Math.round(x.score)}</Badge></td>
              <td className="py-3 pr-4"><button className="text-blue-600 font-medium" onClick={()=>{setInput(x.code);analyze(x.code)}}>分析</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex gap-2">
        <AlertTriangle size={18} className="shrink-0 mt-0.5"/>
        <p>提醒：本看板的“预测”是规则模型，不构成投资建议。抓涨停必须结合竞价、盘口、板块前排、分时承接、封单质量和个人仓位纪律。</p>
      </section>
    </div>
  </div>
}
