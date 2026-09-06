import React,{useMemo,useState} from "react";
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,PieChart,Pie,Cell,Legend} from "recharts";
import {LayoutDashboard,Lightbulb,Palette,Users,ClipboardCheck,Printer,Search,ChevronRight,MousePointerClick,Eye,UserRoundCheck,DollarSign,Target,ArrowUpRight,AlertTriangle,CheckCircle2,Download} from "lucide-react";
import {reportData as rawData} from "./data";

const mapMetrics=o=>({
 ...o,
 reach:o["Người tiếp cận"],
 impressions:o["Lượt hiển thị"],
 clicks:o["Lượt click vào liên kết"],
 spend:o["Số tiền đã chi tiêu (USD)"],
 leads:o["(Mẫu tìm kiếm) khách hàng tiềm năng"],
 frequency:o["Người tiếp cận"]?o["Lượt hiển thị"]/o["Người tiếp cận"]:0
});
const reportData={
 ...rawData,
 summary:mapMetrics(rawData.summary),
 age:rawData.age.map(mapMetrics),
 creative:rawData.creative.map(mapMetrics)
};

const fmt=(n,d=0)=>Number(n||0).toLocaleString("en-US",{maximumFractionDigits:d});
const usd=n=>`$${Number(n||0).toFixed(2)}`;
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
 const [age,setAge]=useState("Tất cả");
 const [selected,setSelected]=useState(null);
 const s=reportData.summary;

 return <div className="app">
  <header className="top no-print">
   <div className="brand"><div className="mark">F</div><div><b>FPT TELECOM</b><span>CAMPAIGN INTELLIGENCE · 300 KỸ THUẬT VIÊN</span></div></div>
   <div className="topRight"><span className="period">01/09/2026 — 06/09/2026</span><button className="print" onClick={()=>window.print()}><Printer size={16}/> Xuất PDF</button></div>
  </header>
  <div className="layout">
   <aside className="side no-print">
    <div className="sideTitle">CAMPAIGN REPORT</div>
    {tabs.map(([id,label,I])=><button className={`nav ${tab===id?"active":""}`} onClick={()=>setTab(id)} key={id}><I size={17}/>{label}</button>)}
    <div className="sideBottom"><Target size={18}/><b>300 KTV</b><span>Lead Generation</span><small>Meta Ads</small></div>
   </aside>
   <main className="main">
    <div className="heading"><div><small>FPT TELECOM · RECRUITMENT MARKETING</small><h1>{tab==="overview"?"Tổng quan chiến dịch":tab==="insight"?"Insight & Performance":tab==="creative"?"Creative Performance":tab==="audience"?"Audience Intelligence":"Action Plan"}</h1><p>Chiến dịch tuyển dụng 300 Kỹ thuật viên · Meta Ads</p></div><div className="live"><i/> Data imported</div></div>
    {tab==="overview"&&<Overview s={s} creative={reportData.creative} age={reportData.age}/>}
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

function KPI({icon:I,label,value,sub,accent=""}){return <div className={`kpi ${accent}`}><div className="kpiLabel"><span>{label}</span><I size={17}/></div><strong>{value}</strong><small>{sub}</small></div>}
function Card({title,note,children}){return <section className="card"><div className="cardHead"><div><h3>{title}</h3><span>{note}</span></div></div>{children}</section>}

function Overview({s,creative,age}){
 const cr=creative.map(x=>({name:x.creative.replace("2609_300KTV_Lead_KTV_FTEL_","").replace("Content ","C"),leads:x.leads,spend:x.spend}));
 const ag=age.filter(x=>x.impressions>100).map(x=>({name:x.age,leads:x.leads,ctr:x.ctr}));
 return <><div className="hero"><div><span className="eyebrow">EXECUTIVE SNAPSHOT</span><h2>Chiến dịch đang tạo lead với chi phí thấp, nhưng hiệu quả phân bổ giữa các creative chênh lệch rõ.</h2><p>Giai đoạn dữ liệu: 01–06/09/2026 · Campaign: 2609_300KTV_Lead_KTV_FTEL</p></div><div className="heroNum"><span>Leads</span><b>{fmt(s.leads)}</b><small>{usd(s.cpl)} / lead</small></div></div>
 <div className="kpis">
  <KPI icon={UserRoundCheck} label="Leads" value={fmt(s.leads)} sub="Mẫu tìm kiếm khách hàng tiềm năng" accent="orange"/>
  <KPI icon={DollarSign} label="Chi tiêu" value={usd(s.spend)} sub="Meta Ads"/>
  <KPI icon={Eye} label="Reach" value={fmt(s.reach)} sub={`${fmt(s.impressions)} impressions`}/>
  <KPI icon={MousePointerClick} label="Link clicks" value={fmt(s.clicks)} sub={`CTR ${s.ctr.toFixed(2)}%`}/>
  <KPI icon={Target} label="CPL" value={usd(s.cpl,2)} sub={`CPM ${usd(s.cpm,2)}`}/>
 </div>
 <div className="grid2"><Card title="Lead theo creative" note="Số lead"><div className="chart"><ResponsiveContainer width="100%" height={260}><BarChart data={cr}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={v=>fmt(v)}/><Bar dataKey="leads" fill="#f37021" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></Card>
 <Card title="Lead theo độ tuổi" note="Nhóm có >100 impressions"><div className="chart"><ResponsiveContainer width="100%" height={260}><BarChart data={ag}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="leads" fill="#172033" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></Card></div>
 <Card title="Campaign health" note="Chỉ số hiệu quả chính"><div className="health"><div><b>{s.ctr.toFixed(2)}%</b><span>CTR</span><i style={{width:`${Math.min(100,s.ctr*25)}%`}}/></div><div><b>{usd(s.cpc,2)}</b><span>CPC</span><i style={{width:`${Math.min(100,s.cpc*300)}%`}}/></div><div><b>{s.cpm.toFixed(2)}</b><span>CPM ($)</span><i style={{width:`${Math.min(100,s.cpm*35)}%`}}/></div><div><b>{s.frequency.toFixed(2)}</b><span>Frequency</span><i style={{width:`${Math.min(100,s.frequency*40)}%`}}/></div></div></Card>
 </>;
}

function Insight({s,age,creative}){
 const top=creative[0], weak=creative[creative.length-1], bestAge=[...age].filter(x=>x.leads>0).sort((a,b)=>b.leads-a.leads)[0];
 return <div className="insights"><div className="darkHero"><div><span className="eyebrow">WHAT THE DATA SAYS</span><h2>169 leads với $61.61 spend: hiệu suất tổng thể tốt, nhưng nên tối ưu mạnh theo creative và nhóm tuổi.</h2><p>Đây là insight được suy ra trực tiếp từ file Meta Ads đã upload.</p></div><div className="bigScore"><span>CPL</span><b>{usd(s.cpl,2)}</b><small>/ lead</small></div></div>
 <InsightCard n="01" tag="WINNER" title={`Creative “${top.creative}” đang dẫn đầu`} text={`Tạo ${fmt(top.leads)} leads, chiếm ${(top.leads/s.leads*100).toFixed(1)}% tổng leads với CPL ${usd(top.cpl,2)}. Đây là creative nên ưu tiên ngân sách.`}/>
 <InsightCard n="02" tag="AUDIENCE" title={`Nhóm ${bestAge?.age||"35-44"} là động lực chính`} text={`Nhóm tuổi này tạo ${fmt(bestAge?.leads)} leads và có CTR ${bestAge?.ctr.toFixed(2)}%. Đặc biệt, 35-44 tạo 85 leads — cao nhất trong các nhóm tuổi.`}/>
 <InsightCard n="03" tag="OPTIMIZE" title={`Creative “${weak.creative}” cần xem xét`} text={`Chỉ tạo ${fmt(weak.leads)} leads trên ${usd(weak.spend)} spend, CPL ${usd(weak.cpl,2)} và CTR ${weak.ctr.toFixed(2)}%. Hiệu quả thấp hơn rõ rệt so với các creative còn lại.`}/>
 <div className="two"><Card title="Kết luận quản trị" note="Management takeaway"><ul><li><b>Scale:</b> ưu tiên creative có CPL thấp và volume lead cao.</li><li><b>Refine:</b> thử lại hook/visual/CTA của Content4 trước khi tăng ngân sách.</li><li><b>Target:</b> tiếp tục theo dõi 35-44 và 25-34; không nên đánh đồng toàn bộ độ tuổi.</li><li><b>Measurement:</b> đối chiếu 169 lead Meta với lead thực nhận/đủ điều kiện để đánh giá CPL chất lượng.</li></ul></Card>
 <Card title="Điểm cần lưu ý" note="Data interpretation"><p className="noteText">Cột “Kết quả” của file là 177, trong khi “(Mẫu tìm kiếm) khách hàng tiềm năng” là 169. Báo cáo này dùng <b>169 lead form</b> làm KPI lead chính để tránh trộn hai loại kết quả.</p></Card></div>
 </div>
}
function InsightCard({n,tag,title,text}){return <div className="insightCard"><b className="num">{n}</b><div><span className="tag">{tag}</span><h3>{title}</h3><p>{text}</p></div><ArrowUpRight className="arr"/></div>}

function Creative({creative}){
 return <><div className="creativeTop"><div><span className="eyebrow">CREATIVE LAB</span><h2>3 creative · 169 leads · hiệu quả phân hoá</h2><p>So sánh volume, CTR và CPL để quyết định phân bổ ngân sách.</p></div></div>
 <Card title="Bảng xếp hạng creative" note="Từ hiệu quả tốt → thấp"><div className="creativeList">{creative.map((x,i)=><div className="creativeRow" key={x.creative}><div className="rank">{i+1}</div><div className="creativeName"><b>{x.creative}</b><span>{fmt(x.impressions)} impressions · {fmt(x.clicks)} clicks</span></div><div><b>{fmt(x.leads)}</b><span>leads</span></div><div><b>{usd(x.cpl,2)}</b><span>CPL</span></div><div><b>{x.ctr.toFixed(2)}%</b><span>CTR</span></div><div className="miniBar"><i style={{width:`${x.leads/creative[0].leads*100}%`}}/></div></div>)}</div></Card>
 <div className="two"><Card title="Đọc creative"><div className="creativeCompare">{creative.map(x=><div key={x.creative}><span>{x.creative.replace("2609_300KTV_Lead_KTV_FTEL_","")}</span><div className="bar"><i style={{width:`${x.ctr/2.5*100}%`}}/></div></div>)}</div></Card><Card title="Khuyến nghị"><p className="noteText">Giữ creative 1 làm benchmark. Content 3 có CPL tốt nhất trong 3 creative; nên test thêm biến thể dựa trên hook/visual của nhóm này. Content4 cần giảm ngân sách hoặc thay mới.</p></Card></div></>
}

function Audience({age}){
 return <><div className="audHero"><span className="eyebrow">AUDIENCE INTELLIGENCE</span><h2>35–44 là nhóm tạo lead lớn nhất.</h2><p>Không chỉ nhìn volume: CTR và CPL cho thấy 45–54 cũng đáng theo dõi vì hiệu quả tương đối tốt.</p></div>
 <Card title="Performance theo độ tuổi" note="Lead · CTR · CPL"><div className="ageGrid">{age.map(x=><div className="ageCard" key={x.age}><div className="ageHead"><b>{x.age}</b><span>{fmt(x.leads)} leads</span></div><div className="ageMetric"><span>Reach</span><b>{fmt(x.reach)}</b></div><div className="ageMetric"><span>CTR</span><b>{x.ctr.toFixed(2)}%</b></div><div className="ageMetric"><span>CPL</span><b>{x.cpl?usd(x.cpl,2):"—"}</b></div><div className="ageLine"><i style={{width:`${Math.min(100,x.leads/Math.max(...age.map(a=>a.leads))*100)}%`}}/></div></div>)}</div></Card>
 <Card title="Audience takeaway" note="Ưu tiên theo dữ liệu"><div className="takeaways"><div><CheckCircle2/><b>35–44</b><span>85 leads · CPL {usd(age.find(x=>x.age==="35-44")?.cpl,2)} — nhóm chủ lực.</span></div><div><CheckCircle2/><b>25–34</b><span>45 leads — volume tốt, nên duy trì.</span></div><div><ArrowUpRight/><b>45–54</b><span>21 leads nhưng CTR 3.05% và CPL {usd(age.find(x=>x.age==="45-54")?.cpl,2)} — tín hiệu hiệu quả đáng test.</span></div><div><AlertTriangle/><b>55+</b><span>Volume thấp; chưa đủ dữ liệu để ưu tiên ngân sách.</span></div></div></Card></>
}

function Action({s,creative,age}){
 return <><div className="actionHero"><div><span className="eyebrow">NEXT 7 DAYS</span><h2>Biến kết quả quảng cáo thành hành động tối ưu.</h2><p>Ưu tiên volume lead, sau đó tối ưu chất lượng lead.</p></div><div><b>{fmt(s.leads)}</b><span>leads hiện tại</span></div></div>
 <div className="actionGrid">
  <ActionBox n="01" title="Scale winner" priority="HIGH" text={`Tăng ngân sách có kiểm soát cho ${creative[0].creative}. Theo dõi CPL và frequency sau mỗi 24–48h.`}/>
  <ActionBox n="02" title="Test new variants" priority="HIGH" text="Tạo 2–3 biến thể từ creative hiệu quả: đổi hook 3 giây đầu, headline và CTA tuyển dụng."/>
  <ActionBox n="03" title="Reduce weak creative" priority="MEDIUM" text={`Content4 có CPL ${usd(creative[creative.length-1].cpl,2)}. Giảm ngân sách hoặc thay creative trước khi scale.`}/>
  <ActionBox n="04" title="Validate lead quality" priority="HIGH" text="Đối soát 169 lead Meta với lead hợp lệ/đã liên hệ/đủ điều kiện để tính CPL thực tế."/>
 </div>
 <Card title="Suggested reporting cadence" note="Để chiến dịch 300 KTV dễ quản trị"><div className="cadence"><div><b>Daily</b><span>Spend · Leads · CPL · Frequency</span></div><div><b>Every 3 days</b><span>Creative ranking · Age breakdown · CTR</span></div><div><b>Weekly</b><span>Lead quality · Cost per qualified lead · Hiring progress</span></div></div></Card></>
}
function ActionBox({n,title,priority,text}){return <div className="actionBox"><b className="num">{n}</b><span className={`prio ${priority==="HIGH"?"high":"medium"}`}>{priority}</span><h3>{title}</h3><p>{text}</p></div>}
function Detail({row,close}){return <div className="overlay" onClick={close}><div className="drawer" onClick={e=>e.stopPropagation()}><button onClick={close} className="x">×</button><span className="eyebrow">AD DETAIL</span><h2>{row.creative}</h2><p>{row.age} · {row.status}</p><div className="detailKpi"><b>{fmt(row.leads)}</b><span>leads</span><b>{usd(row.spend)}</b><span>spend</span></div><div className="detailRows">{[["Reach",fmt(row.reach)],["Impressions",fmt(row.impressions)],["Clicks",fmt(row.clicks)],["CTR",row.ctr.toFixed(2)+"%"],["CPC",usd(row.cpc,2)],["Frequency",row.frequency.toFixed(2)]].map(a=><div><span>{a[0]}</span><b>{a[1]}</b></div>)}</div></div></div>}
