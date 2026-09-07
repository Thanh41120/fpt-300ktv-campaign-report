import React,{useState,useEffect,useCallback} from "react";
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from "recharts";
import {LayoutDashboard,Lightbulb,Palette,Users,ClipboardCheck,Printer,Search,MousePointerClick,Eye,UserRoundCheck,DollarSign,Target,ArrowUpRight,AlertTriangle,CheckCircle2,RefreshCw} from "lucide-react";

const SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vQKsh9VBPf8fGynB2hBMWfH3qF3rZyoHV9USOIKk9M09x7TFMrIQdbxSfNzAo8pb0vfRNR-WoJQDZVg/pub?gid=133568434&single=true&output=csv";
const CAMPAIGN_FILTER="300ktv";
const AGE_ORDER=["18-24","25-34","35-44","45-54","55-64","65+"];

function parseCSV(text){
 const rows=[];
 let row=[],field="",inQuotes=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(inQuotes){
   if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else inQuotes=false;}
   else field+=c;
  }else{
   if(c==='"')inQuotes=true;
   else if(c===','){row.push(field);field="";}
   else if(c==='\n'){row.push(field);rows.push(row);row=[];field="";}
   else if(c==='\r'){/*skip*/}
   else field+=c;
  }
 }
 if(field.length||row.length){row.push(field);rows.push(row);}
 const header=(rows.shift()||[]).map(h=>h.trim());
 return rows.filter(r=>r.some(v=>v!=="")).map(r=>{
  const o={};
  header.forEach((h,i)=>o[h]=(r[i]??"").trim());
  return o;
 });
}

const num=v=>{const n=parseFloat(String(v).replace(",","."));return Number.isFinite(n)?n:0;};

function normalizeRow(r){
 return{
  campaign:r["Tên chiến dịch"]||"",
  adset:r["Tên nhóm quảng cáo"]||"",
  creative:r["Tên quảng cáo"]||r["Quảng cáo"]||"",
  age:r["Độ tuổi"]||"",
  date:r["Ngày"]||"",
  status:r["Trạng thái phân phối"]||"",
  resultType:r["Loại kết quả"]||"",
  results:num(r["Kết quả"]),
  reach:num(r["Người tiếp cận"]),
  impressions:num(r["Lượt hiển thị"]),
  clicks:num(r["Lượt click vào liên kết"]),
  spend:num(r["Số tiền đã chi tiêu (USD)"]),
  leads:num(r["(Mẫu tìm kiếm) khách hàng tiềm năng"])
 };
}

function sumMetrics(rows){
 const t=rows.reduce((a,r)=>({
  reach:a.reach+r.reach,impressions:a.impressions+r.impressions,clicks:a.clicks+r.clicks,
  spend:a.spend+r.spend,leads:a.leads+r.leads,results:a.results+r.results
 }),{reach:0,impressions:0,clicks:0,spend:0,leads:0,results:0});
 return{
  ...t,
  ctr:t.impressions?t.clicks/t.impressions*100:0,
  cpm:t.impressions?t.spend/t.impressions*1000:0,
  cpc:t.clicks?t.spend/t.clicks:0,
  cpl:t.leads?t.spend/t.leads:0,
  frequency:t.reach?t.impressions/t.reach:0
 };
}

function groupBy(rows,key){
 const map=new Map();
 rows.forEach(r=>{
  const k=r[key]||"—";
  if(!map.has(k))map.set(k,[]);
  map.get(k).push(r);
 });
 return[...map.entries()].map(([k,rs])=>({[key]:k,...sumMetrics(rs)}));
}

function longestCommonPrefix(strs){
 if(!strs.length)return"";
 let prefix=strs[0];
 for(let i=1;i<strs.length;i++){
  while(prefix&&!strs[i].startsWith(prefix))prefix=prefix.slice(0,-1);
  if(!prefix)return"";
 }
 return prefix;
}
function shortCreativeName(name,prefix){
 let s=prefix&&name.startsWith(prefix)?name.slice(prefix.length):name;
 s=s.replace(/^_+/,"").replace(/^Content\s*/i,"C");
 return s||name;
}

function buildReport(rawRows){
 const rows=rawRows.map(normalizeRow).filter(r=>r.campaign.toLowerCase().includes(CAMPAIGN_FILTER)&&r.date!=="All"&&r.age!=="All");
 const summary=sumMetrics(rows);
 const age=groupBy(rows,"age").sort((a,b)=>AGE_ORDER.indexOf(a.age)-AGE_ORDER.indexOf(b.age));
 const creative=groupBy(rows,"creative").sort((a,b)=>b.leads-a.leads);
 const dates=rows.map(r=>r.date).filter(Boolean).sort();
 const campaigns=[...new Set(rows.map(r=>r.campaign))];
 return{
  summary,age,creative,rows,
  meta:{
   campaign:campaigns.join(", ")||"—",
   period:dates.length?`${dates[0]} – ${dates[dates.length-1]}`:"—",
   source:"Google Sheet (report ads) · tự động"
  }
 };
}

const fmt=(n,d=0)=>Number(n||0).toLocaleString("en-US",{maximumFractionDigits:d});
const USD_TO_VND=26000;
const usd=n=>Math.round(Number(n||0)*USD_TO_VND).toLocaleString("vi-VN")+"đ";
const tabs=[
  ["overview","Tổng quan",LayoutDashboard],
  ["insight","Insight",Lightbulb],
  ["creative","Creative",Palette],
  ["audience","Đối tượng",Users],
  ["action","Action",ClipboardCheck]
];

export default function App(){
 const [tab,setTab]=useState("overview");
 const [q,setQ]=useState("");
 const [reportData,setReportData]=useState(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(null);
 const [lastUpdated,setLastUpdated]=useState(null);
 const [selected,setSelected]=useState(null);

 const load=useCallback(()=>{
  setLoading(true);setError(null);
  const url=SHEET_CSV_URL+(SHEET_CSV_URL.includes("?")?"&":"?")+"_ts="+Date.now();
  fetch(url).then(res=>{
   if(!res.ok)throw new Error("Không tải được Sheet (HTTP "+res.status+")");
   return res.text();
  }).then(text=>{
   const built=buildReport(parseCSV(text));
   if(!built.rows.length)throw new Error('Sheet không có dòng nào khớp chiến dịch "300KTV".');
   setReportData(built);
   setLastUpdated(new Date());
  }).catch(err=>{
   setError(err.message||"Lỗi tải dữ liệu từ Google Sheet");
  }).finally(()=>setLoading(false));
 },[]);

 useEffect(()=>{load();},[load]);

 if(!reportData&&loading)return <StatusScreen icon={RefreshCw} spin title="Đang tải dữ liệu..." text="Kết nối tới Google Sheet 'report ads' để lấy số liệu mới nhất."/>;
 if(!reportData&&error)return <StatusScreen icon={AlertTriangle} title="Không tải được dữ liệu" text={error} retry={load}/>;

 const s=reportData.summary;

 return <div className="app">
  <header className="top no-print">
   <div className="brand"><div className="mark">F</div><div><b>FPT TELECOM</b><span>CAMPAIGN INTELLIGENCE · 300 KỸ THUẬT VIÊN</span></div></div>
   <div className="topRight">
    <span className="period">{reportData.meta.period}</span>
    <button className="print" onClick={load} disabled={loading}><RefreshCw size={16} className={loading?"spin":""}/> {loading?"Đang tải...":"Làm mới"}</button>
    <button className="print" onClick={()=>window.print()}><Printer size={16}/> Xuất PDF</button>
   </div>
  </header>
  <div className="layout">
   <aside className="side no-print">
    <div className="sideTitle">CAMPAIGN REPORT</div>
    {tabs.map(([id,label,I])=><button className={`nav ${tab===id?"active":""}`} onClick={()=>setTab(id)} key={id}><I size={17}/>{label}</button>)}
    <div className="sideBottom"><Target size={18}/><b>300 KTV</b><span>Lead Generation</span><small>Meta Ads</small></div>
   </aside>
   <main className="main">
    <div className="heading"><div><small>FPT TELECOM · RECRUITMENT MARKETING</small><h1>{tab==="overview"?"Tổng quan chiến dịch":tab==="insight"?"Insight & Performance":tab==="creative"?"Creative Performance":tab==="audience"?"Audience Intelligence":"Action Plan"}</h1><p>Chiến dịch tuyển dụng 300 Kỹ thuật viên · Meta Ads</p></div><div className="live"><i/> {error?`Làm mới gần nhất lỗi: ${error}`:`Live từ Google Sheet${lastUpdated?" · cập nhật "+lastUpdated.toLocaleTimeString("vi-VN"):""}`}</div></div>
    {tab==="overview"&&<Overview s={s} creative={reportData.creative} age={reportData.age} meta={reportData.meta}/>}
    {tab==="insight"&&<Insight s={s} age={reportData.age} creative={reportData.creative}/>}
    {tab==="creative"&&<Creative creative={reportData.creative}/>}
    {tab==="audience"&&<Audience age={reportData.age}/>}
    {tab==="action"&&<Action s={s} creative={reportData.creative} age={reportData.age}/>}
   </main>
  </div>
  {tab==="audience"&&<div className="srch no-print"><Search size={15}/><input placeholder="Tìm kiếm..." value={q} onChange={e=>setQ(e.target.value)}/></div>}
  {selected&&<Detail row={selected} close={()=>setSelected(null)}/>}
 </div>
}

function StatusScreen({icon:I,title,text,retry,spin}){
 return <div className="statusScreen"><I size={34} className={spin?"spin":""}/><h2>{title}</h2><p>{text}</p>{retry&&<button className="print" onClick={retry}><RefreshCw size={16}/> Thử lại</button>}</div>;
}

function KPI({icon:I,label,value,sub,accent=""}){return <div className={`kpi ${accent}`}><div className="kpiLabel"><span>{label}</span><I size={17}/></div><strong>{value}</strong><small>{sub}</small></div>}
function Card({title,note,children}){return <section className="card"><div className="cardHead"><div><h3>{title}</h3><span>{note}</span></div></div>{children}</section>}

function Overview({s,creative,age,meta}){
 const prefix=longestCommonPrefix(creative.map(x=>x.creative));
 const cr=creative.map(x=>({name:shortCreativeName(x.creative,prefix),leads:x.leads,spend:x.spend}));
 const ag=age.filter(x=>x.impressions>100).map(x=>({name:x.age,leads:x.leads,ctr:x.ctr}));
 return <><div className="hero"><div><span className="eyebrow">EXECUTIVE SNAPSHOT</span><h2>Chiến dịch đang tạo lead với chi phí thấp, nhưng hiệu quả phân bổ giữa các creative chênh lệch rõ.</h2><p>Giai đoạn dữ liệu: {meta.period} · Campaign: {meta.campaign}</p></div><div className="heroNum"><span>Leads</span><b>{fmt(s.leads)}</b><small>{usd(s.cpl)} / lead</small></div></div>
 <div className="kpis">
  <KPI icon={UserRoundCheck} label="Leads" value={fmt(s.leads)} sub="Mẫu tìm kiếm khách hàng tiềm năng" accent="orange"/>
  <KPI icon={DollarSign} label="Chi tiêu" value={usd(s.spend)} sub="Meta Ads"/>
  <KPI icon={Eye} label="Reach" value={fmt(s.reach)} sub={`${fmt(s.impressions)} impressions`}/>
  <KPI icon={MousePointerClick} label="Link clicks" value={fmt(s.clicks)} sub={`CTR ${s.ctr.toFixed(2)}%`}/>
  <KPI icon={Target} label="CPL" value={usd(s.cpl,2)} sub={`CPM ${usd(s.cpm,2)}`}/>
 </div>
 <div className="grid2"><Card title="Lead theo creative" note="Số lead"><div className="chart"><ResponsiveContainer width="100%" height={260}><BarChart data={cr}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={v=>fmt(v)}/><Bar dataKey="leads" fill="#f37021" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></Card>
 <Card title="Lead theo độ tuổi" note="Nhóm có >100 impressions"><div className="chart"><ResponsiveContainer width="100%" height={260}><BarChart data={ag}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="leads" fill="#172033" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></Card></div>
 <Card title="Campaign health" note="Chỉ số hiệu quả chính"><div className="health"><div><b>{s.ctr.toFixed(2)}%</b><span>CTR</span><i style={{width:`${Math.min(100,s.ctr*25)}%`}}/></div><div><b>{usd(s.cpc,2)}</b><span>CPC</span><i style={{width:`${Math.min(100,s.cpc*300)}%`}}/></div><div><b>{s.cpm.toFixed(2)}</b><span>CPM</span><i style={{width:`${Math.min(100,s.cpm*35)}%`}}/></div><div><b>{s.frequency.toFixed(2)}</b><span>Frequency</span><i style={{width:`${Math.min(100,s.frequency*40)}%`}}/></div></div></Card>
 </>;
}

function Insight({s,age,creative}){
 const top=creative[0], weak=creative[creative.length-1], bestAge=[...age].filter(x=>x.leads>0).sort((a,b)=>b.leads-a.leads)[0];
 return <div className="insights"><div className="darkHero"><div><span className="eyebrow">WHAT THE DATA SAYS</span><h2>{fmt(s.leads)} leads với {usd(s.spend)} spend: hiệu suất tổng thể tốt, nhưng nên tối ưu mạnh theo creative và nhóm tuổi.</h2><p>Đây là insight được suy ra trực tiếp từ dữ liệu mới nhất trên Google Sheet.</p></div><div className="bigScore"><span>CPL</span><b>{usd(s.cpl,2)}</b><small>/ lead</small></div></div>
 {top&&<InsightCard n="01" tag="WINNER" title={`Creative "${top.creative}" đang dẫn đầu`} text={`Tạo ${fmt(top.leads)} leads, chiếm ${s.leads?(top.leads/s.leads*100).toFixed(1):"0"}% tổng leads với CPL ${usd(top.cpl,2)}. Đây là creative nên ưu tiên ngân sách.`}/>}
 <InsightCard n="02" tag="AUDIENCE" title={`Nhóm ${bestAge?.age||"—"} là động lực chính`} text={`Nhóm tuổi này tạo ${fmt(bestAge?.leads)} leads và có CTR ${bestAge?bestAge.ctr.toFixed(2):"0"}% — cao nhất trong các nhóm tuổi có lead.`}/>
 {weak&&weak!==top&&<InsightCard n="03" tag="OPTIMIZE" title={`Creative "${weak.creative}" cần xem xét`} text={`Chỉ tạo ${fmt(weak.leads)} leads trên ${usd(weak.spend)} spend, CPL ${usd(weak.cpl,2)} và CTR ${weak.ctr.toFixed(2)}%. Hiệu quả thấp hơn rõ rệt so với các creative còn lại.`}/>}
 <div className="two"><Card title="Kết luận quản trị" note="Management takeaway"><ul><li><b>Scale:</b> ưu tiên creative có CPL thấp và volume lead cao.</li><li><b>Refine:</b> thử lại hook/visual/CTA của creative yếu trước khi tăng ngân sách.</li><li><b>Target:</b> tiếp tục theo dõi nhóm tuổi dẫn đầu; không nên đánh đồng toàn bộ độ tuổi.</li><li><b>Measurement:</b> đối chiếu {fmt(s.results)} kết quả Meta với lead thực nhận/đủ điều kiện để đánh giá CPL chất lượng.</li></ul></Card>
 <Card title="Điểm cần lưu ý" note="Data interpretation"><p className="noteText">Cột "Kết quả" của Sheet là {fmt(s.results)}, trong khi "(Mẫu tìm kiếm) khách hàng tiềm năng" là {fmt(s.leads)}. Báo cáo này dùng <b>{fmt(s.leads)} lead form</b> làm KPI lead chính để tránh trộn hai loại kết quả.</p></Card></div>
 </div>
}
function InsightCard({n,tag,title,text}){return <div className="insightCard"><b className="num">{n}</b><div><span className="tag">{tag}</span><h3>{title}</h3><p>{text}</p></div><ArrowUpRight className="arr"/></div>}

function Creative({creative}){
 const prefix=longestCommonPrefix(creative.map(x=>x.creative));
 const totalLeads=creative.reduce((a,x)=>a+x.leads,0);
 const maxLeads=Math.max(1,...creative.map(x=>x.leads));
 return <><div className="creativeTop"><div><span className="eyebrow">CREATIVE LAB</span><h2>{creative.length} creative · {fmt(totalLeads)} leads · hiệu quả phân hoá</h2><p>So sánh volume, CTR và CPL để quyết định phân bổ ngân sách.</p></div></div>
 <Card title="Bảng xếp hạng creative" note="Từ hiệu quả tốt → thấp"><div className="creativeList">{creative.map((x,i)=><div className="creativeRow" key={x.creative}><div className="rank">{i+1}</div><div className="creativeName"><b>{x.creative}</b><span>{fmt(x.impressions)} impressions · {fmt(x.clicks)} clicks</span></div><div><b>{fmt(x.leads)}</b><span>leads</span></div><div><b>{usd(x.cpl,2)}</b><span>CPL</span></div><div><b>{x.ctr.toFixed(2)}%</b><span>CTR</span></div><div className="miniBar"><i style={{width:`${x.leads/maxLeads*100}%`}}/></div></div>)}</div></Card>
 <div className="two"><Card title="Đọc creative"><div className="creativeCompare">{creative.map(x=><div key={x.creative}><span>{shortCreativeName(x.creative,prefix)}</span><div className="bar"><i style={{width:`${Math.min(100,x.ctr/2.5*100)}%`}}/></div></div>)}</div></Card><Card title="Khuyến nghị"><p className="noteText">Ưu tiên ngân sách cho creative dẫn đầu leads/CPL. Test thêm biến thể dựa trên hook/visual của creative đang hiệu quả nhất; giảm ngân sách hoặc thay mới creative có CPL cao nhất.</p></Card></div></>
}

function Audience({age}){
 const sorted=[...age].filter(x=>x.leads>0).sort((a,b)=>b.leads-a.leads);
 const top=sorted[0],second=sorted[1],third=sorted[2];
 const topKeys=new Set(sorted.slice(0,3).map(x=>x.age));
 const lowNames=age.filter(x=>!topKeys.has(x.age)).map(x=>x.age).join(", ");
 const maxLeads=Math.max(1,...age.map(a=>a.leads));
 return <><div className="audHero"><span className="eyebrow">AUDIENCE INTELLIGENCE</span><h2>{top?`${top.age} là nhóm tạo lead lớn nhất.`:"Chưa đủ dữ liệu độ tuổi có lead."}</h2><p>Không chỉ nhìn volume: CTR và CPL cho thấy các nhóm khác cũng đáng theo dõi vì hiệu quả tương đối tốt.</p></div>
 <Card title="Performance theo độ tuổi" note="Lead · CTR · CPL"><div className="ageGrid">{age.map(x=><div className="ageCard" key={x.age}><div className="ageHead"><b>{x.age}</b><span>{fmt(x.leads)} leads</span></div><div className="ageMetric"><span>Reach</span><b>{fmt(x.reach)}</b></div><div className="ageMetric"><span>CTR</span><b>{x.ctr.toFixed(2)}%</b></div><div className="ageMetric"><span>CPL</span><b>{x.cpl?usd(x.cpl,2):"—"}</b></div><div className="ageLine"><i style={{width:`${Math.min(100,x.leads/maxLeads*100)}%`}}/></div></div>)}</div></Card>
 <Card title="Audience takeaway" note="Ưu tiên theo dữ liệu"><div className="takeaways">
  {top&&<div><CheckCircle2/><b>{top.age}</b><span>{fmt(top.leads)} leads · CPL {usd(top.cpl,2)} — nhóm chủ lực.</span></div>}
  {second&&<div><CheckCircle2/><b>{second.age}</b><span>{fmt(second.leads)} leads — volume tốt, nên duy trì.</span></div>}
  {third&&<div><ArrowUpRight/><b>{third.age}</b><span>{fmt(third.leads)} leads, CTR {third.ctr.toFixed(2)}% và CPL {usd(third.cpl,2)} — tín hiệu hiệu quả đáng test.</span></div>}
  {lowNames&&<div><AlertTriangle/><b>Nhóm còn lại</b><span>{lowNames}: volume thấp; chưa đủ dữ liệu để ưu tiên ngân sách.</span></div>}
 </div></Card></>
}

function Action({s,creative,age}){
 const top=creative[0],weak=creative[creative.length-1];
 return <><div className="actionHero"><div><span className="eyebrow">NEXT 7 DAYS</span><h2>Biến kết quả quảng cáo thành hành động tối ưu.</h2><p>Ưu tiên volume lead, sau đó tối ưu chất lượng lead.</p></div><div><b>{fmt(s.leads)}</b><span>leads hiện tại</span></div></div>
 <div className="actionGrid">
  <ActionBox n="01" title="Scale winner" priority="HIGH" text={top?`Tăng ngân sách có kiểm soát cho ${top.creative}. Theo dõi CPL và frequency sau mỗi 24–48h.`:"Chưa có creative nổi bật để scale."}/>
  <ActionBox n="02" title="Test new variants" priority="HIGH" text="Tạo 2–3 biến thể từ creative hiệu quả: đổi hook 3 giây đầu, headline và CTA tuyển dụng."/>
  <ActionBox n="03" title="Reduce weak creative" priority="MEDIUM" text={weak?`${weak.creative} có CPL ${usd(weak.cpl,2)}. Giảm ngân sách hoặc thay creative trước khi scale.`:"Chưa có creative yếu rõ rệt."}/>
  <ActionBox n="04" title="Validate lead quality" priority="HIGH" text={`Đối soát ${fmt(s.leads)} lead Meta với lead hợp lệ/đã liên hệ/đủ điều kiện để tính CPL thực tế.`}/>
 </div>
 <Card title="Suggested reporting cadence" note="Để chiến dịch 300 KTV dễ quản trị"><div className="cadence"><div><b>Daily</b><span>Spend · Leads · CPL · Frequency</span></div><div><b>Every 3 days</b><span>Creative ranking · Age breakdown · CTR</span></div><div><b>Weekly</b><span>Lead quality · Cost per qualified lead · Hiring progress</span></div></div></Card></>
}
function ActionBox({n,title,priority,text}){return <div className="actionBox"><b className="num">{n}</b><span className={`prio ${priority==="HIGH"?"high":"medium"}`}>{priority}</span><h3>{title}</h3><p>{text}</p></div>}
function Detail({row,close}){return <div className="overlay" onClick={close}><div className="drawer" onClick={e=>e.stopPropagation()}><button onClick={close} className="x">×</button><span className="eyebrow">AD DETAIL</span><h2>{row.creative}</h2><p>{row.age} · {row.status}</p><div className="detailKpi"><b>{fmt(row.leads)}</b><span>leads</span><b>{usd(row.spend)}</b><span>spend</span></div><div className="detailRows">{[["Reach",fmt(row.reach)],["Impressions",fmt(row.impressions)],["Clicks",fmt(row.clicks)],["CTR",row.ctr.toFixed(2)+"%"],["CPC",usd(row.cpc,2)],["Frequency",row.frequency.toFixed(2)]].map(a=><div key={a[0]}><span>{a[0]}</span><b>{a[1]}</b></div>)}</div></div></div>}
