"use client";
import{useState}from"react";
import{BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Area,AreaChart,Legend}from"recharts";

const C={bg:"#0a0e1a",card:"#111827",cardBorder:"#1e293b",accent:"#22d3ee",green:"#10b981",amber:"#f59e0b",rose:"#f43f5e",purple:"#a78bfa",pink:"#ec4899",sky:"#38bdf8",text:"#e2e8f0",textDim:"#94a3b8",gridLine:"#1e293b"};
const PC=["#22d3ee","#a78bfa","#10b981","#f59e0b","#ec4899"];
const SC={Enrolled:"#10b981",FP:"#22d3ee",Interested:"#38bdf8",Warm:"#f59e0b",Engaged:"#a78bfa",Cold:"#94a3b8",Fake:"#f43f5e",NI:"#ef4444"};
const SL={Enrolled:"Enrolled",FP:"Future Prospect",Interested:"Interested",Warm:"Warm",Engaged:"Engaged",Cold:"Cold",Fake:"Fake Lead",NI:"Not Interested"};
const SoC={Inbound:"#22d3ee",Paid:"#a78bfa",Website:"#10b981",External:"#f59e0b",Events:"#ec4899"};
const SoL={Inbound:"Inbound",Paid:"Paid Campaign",Website:"Website",External:"External",Events:"Events"};

const fmt=n=>{if(n>=1e7)return`₹${(n/1e7).toFixed(2)} Cr`;if(n>=1e5)return`₹${(n/1e5).toFixed(2)} L`;if(n>=1e3)return`₹${(n/1e3).toFixed(1)}K`;return`₹${n}`;};
const fS=n=>{if(n>=1e7)return`${(n/1e7).toFixed(1)}Cr`;if(n>=1e5)return`${(n/1e5).toFixed(1)}L`;if(n>=1e3)return`${(n/1e3).toFixed(0)}K`;return n;};
const sD=d=>{if(!d)return"";const p=d.split("-");const m=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return`${m[parseInt(p[1])]} ${parseInt(p[2])}`;};

const Tp=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,padding:"10px 14px",fontSize:12,zIndex:999}}><p style={{color:"#e2e8f0",fontWeight:600,marginBottom:6}}>{label}</p>{payload.map((p,i)=>(<p key={i} style={{color:p.color,margin:"2px 0"}}>{p.name}: {typeof p.value==="number"&&p.value>1000?fmt(p.value):p.value}</p>))}</div>);};
const Kpi=({label,value,sub,color,icon})=>(<div style={{background:`linear-gradient(135deg,${C.card} 0%,${color}08 100%)`,border:`1px solid ${color}30`,borderRadius:16,padding:"22px 24px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-10,right:-10,fontSize:64,opacity:0.06,color}}>{icon}</div><p style={{color:C.textDim,fontSize:12,fontWeight:500,letterSpacing:1.2,textTransform:"uppercase",margin:0}}>{label}</p><p style={{color,fontSize:30,fontWeight:700,margin:"6px 0 4px",fontFamily:"'JetBrains Mono',monospace"}}>{value}</p>{sub&&<p style={{color:C.textDim,fontSize:12,margin:0}}>{sub}</p>}</div>);
const Cd=({children,style})=><div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:24,...style}}>{children}</div>;
const Tt=({children,sub})=><h3 style={{fontSize:15,fontWeight:600,margin:"0 0 16px",color:C.text}}>{children}{sub&&<span style={{color:C.textDim,fontWeight:400,fontSize:12,marginLeft:8}}>{sub}</span>}</h3>;

const cNames=["Delhi","Patna","Lucknow","Prayagraj","Indore"];
const stK=["Enrolled","FP","Interested","Warm","Cold","NI","Fake"];
const srK=["Inbound","Paid","Website","External","Events"];
const wCl=["#22d3ee","#a78bfa","#ef4444","#f59e0b","#10b981","#ec4899","#38bdf8","#84cc16","#fb923c"];

export default function Dashboard({data}){
  const{months,overall}=data;
  const validMonths=months.filter(m=>m.hasData);
  const allOptions=[{label:"Overall (All Months)",key:"overall"},...months.map((m,i)=>({label:m.label+(m.hasData?"":" (No Data)"),key:String(i),disabled:!m.hasData}))];

  const[selMonth,setSelMonth]=useState("overall");
  const[tab,setTab]=useState("revenue");
  const[sel,setSel]=useState("Overall");

  const cur=selMonth==="overall"?overall:months[Number(selMonth)];
  const isOv=selMonth==="overall";
  const mSum=cur?.monthSummary||[];

  if(!cur||!cur.hasData){
    return(<div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans',sans-serif",padding:"24px 20px"}}>
      <h1 style={{fontSize:26,fontWeight:700,color:C.accent}}>SIQ Offline — Revenue Dashboard</h1>
      <div style={{marginTop:24}}><select value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={{background:C.card,color:C.text,border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:"8px 16px",fontSize:14,fontFamily:"inherit"}}>{allOptions.map(o=><option key={o.key} value={o.key} disabled={o.disabled}>{o.label}</option>)}</select></div>
      <div style={{marginTop:60,textAlign:"center"}}><p style={{color:C.textDim,fontSize:16}}>No data available for this month.</p></div>
    </div>);
  }

  const{centreRevenue,leadFunnelData,totals}=cur;

  // Daily data (only for single month view)
  const daily=!isOv?cur.dailyData.map(d=>({...d,date:sD(d.date)})):[];
  const walkin=!isOv?cur.walkinData.map(d=>({...d,date:sD(d.date)})):[];
  const days=isOv?validMonths.reduce((s,m)=>s+m.dailyData.length,0):daily.length||1;
  const avgR=isOv&&validMonths.length>0?totals.revenue/validMonths.length:totals.revenue/(daily.length||1);
  const conv=totals.walkins>0?((totals.admissions/totals.walkins)*100).toFixed(1):"0";
  const avgT=totals.admissions>0?totals.revenue/totals.admissions:0;
  const top=!isOv?daily.reduce((a,b)=>(a.rev||0)>(b.rev||0)?a:b,daily[0]||{}):{};
  const cum=!isOv?(()=>{let c=0;return daily.map(d=>{c+=d.rev||0;return{...d,cumRev:c};});})():[];

  // Cumulative month-wise for Overall
  const cumMonth=isOv?(()=>{let c=0;return mSum.map(m=>{c+=m.revenue;return{...m,cumRev:c};});})():[];

  const cf=leadFunnelData?.[sel]||{walkins:0,leads:0,enrolled:0,convRate:0,stages:{},sources:{},webLeads:{}};
  const funnel=[{name:"Walk-ins",value:cf.walkins,color:C.sky},{name:"Warm",value:cf.stages?.Warm||0,color:C.amber},{name:"Future Prospect",value:cf.stages?.FP||0,color:C.accent},{name:"Interested",value:cf.stages?.Interested||0,color:C.purple},{name:"Enrolled",value:cf.enrolled,color:C.green}];
  const convC=cNames.map(cn=>({name:cn,convRate:leadFunnelData?.[cn]?.convRate||0}));
  const stageBar=cNames.map(cn=>({name:cn,...(leadFunnelData?.[cn]?.stages||{})}));
  const srcBar=cNames.map(cn=>({name:cn,...(leadFunnelData?.[cn]?.sources||{})}));
  const webD=Object.entries(cf.webLeads||{}).filter(([,v])=>v>0).map(([k,v])=>({name:k,value:v})).sort((a,b)=>b.value-a.value);
  const best=convC.reduce((a,b)=>a.convRate>b.convRate?a:b,{name:"-",convRate:0});
  const worst=convC.reduce((a,b)=>a.convRate<b.convRate?a:b,{name:"-",convRate:100});

  const tabs=[{id:"revenue",label:"Revenue Trends",c:C.accent},{id:"centres",label:"Centre Breakdown",c:C.accent},{id:"walkins",label:"Walk-in Funnel",c:C.accent},{id:"leads",label:"Lead Funnel",c:C.green}];

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif",padding:"24px 20px"}}>

      {/* Header */}
      <div style={{marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:8,height:32,borderRadius:4,background:`linear-gradient(180deg,${C.accent},${C.purple})`}}/>
            <h1 style={{fontSize:26,fontWeight:700,margin:0,letterSpacing:-0.5}}>SIQ Offline — Revenue Dashboard</h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{color:C.textDim,fontSize:12,fontWeight:500}}>VIEWING:</span>
            <select value={selMonth} onChange={e=>{setSelMonth(e.target.value);setSel("Overall");}} style={{background:C.card,color:C.accent,border:`1px solid ${C.accent}40`,borderRadius:10,padding:"10px 20px 10px 14px",fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",outline:"none",appearance:"auto"}}>
              {allOptions.map(o=><option key={o.key} value={o.key} disabled={o.disabled} style={{background:C.card,color:o.disabled?C.textDim:C.text}}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <p style={{color:C.textDim,fontSize:13,marginLeft:20,marginTop:4}}>
          {isOv?`${validMonths.length} months aggregated • Month-wise view`:`${cur.label} • Daily view`} • <span style={{color:C.green}}>Live from Excel</span> • {months.length} file{months.length>1?"s":""} detected
        </p>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:24}}>
        <Kpi label={isOv?"Total Revenue (All Months)":"Total Revenue"} value={fmt(totals.revenue)} sub={isOv?`Avg ${fmt(avgR)}/month`:`Avg ${fmt(totals.revenue/(daily.length||1))}/day`} color={C.accent} icon="₹"/>
        <Kpi label="Admissions" value={String(totals.admissions)} sub={isOv?`${validMonths.length} months`:`${(totals.admissions/(daily.length||1)).toFixed(1)} per day`} color={C.green} icon="▲"/>
        <Kpi label="Walk-ins" value={totals.walkins.toLocaleString()} sub={`${conv}% conversion`} color={C.amber} icon="◉"/>
        <Kpi label="Avg Ticket Size" value={fmt(avgT)} sub={isOv?`Across ${validMonths.length} months`:`Peak: ${top.date||"-"}`} color={C.purple} icon="◆"/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20,background:C.card,borderRadius:12,padding:4,border:`1px solid ${C.cardBorder}`,width:"fit-content",flexWrap:"wrap"}}>
        {tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 20px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",background:tab===t.id?t.c:"transparent",color:tab===t.id?C.bg:C.textDim,transition:"all 0.2s"}}>{t.label}</button>))}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* ═══ REVENUE TAB ═══ */}
      {/* ═══════════════════════════════════════ */}
      {tab==="revenue"&&(<div style={{display:"grid",gap:18}}>

        {/* OVERALL: Month-wise revenue bars */}
        {isOv&&mSum.length>0&&(<>
          <Cd><Tt sub="Month-wise">Revenue by Month</Tt>
            <ResponsiveContainer width="100%" height={300}><BarChart data={mSum} barCategoryGap="30%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="month" tick={{fill:C.text,fontSize:13,fontWeight:600}} tickLine={false} axisLine={false}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickFormatter={fS} tickLine={false} axisLine={false}/><Tooltip content={<Tp/>}/><Bar dataKey="revenue" name="Revenue" fill={C.accent} radius={[8,8,0,0]}/></BarChart></ResponsiveContainer>
          </Cd>
          <Cd><Tt>Cumulative Revenue (Month-wise)</Tt>
            <ResponsiveContainer width="100%" height={250}><AreaChart data={cumMonth}><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="month" tick={{fill:C.text,fontSize:12}} tickLine={false} axisLine={false}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickFormatter={fS} tickLine={false} axisLine={false}/><Tooltip content={<Tp/>}/><Area type="monotone" dataKey="cumRev" name="Cumulative" stroke={C.green} fill="url(#cg)" strokeWidth={2.5} dot={{r:5,fill:C.green}}/></AreaChart></ResponsiveContainer>
          </Cd>
          <Cd><Tt sub="Month-wise">Admissions by Month</Tt>
            <ResponsiveContainer width="100%" height={250}><BarChart data={mSum} barCategoryGap="30%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="month" tick={{fill:C.text,fontSize:13,fontWeight:600}} tickLine={false} axisLine={false}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="admissions" name="Admissions" fill={C.green} radius={[8,8,0,0]}/></BarChart></ResponsiveContainer>
          </Cd>
          {/* Monthly breakdown table */}
          <Cd><Tt>Monthly Summary</Tt>
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:13}}>
              <thead><tr>{["Month","Revenue","Admissions","Walk-ins","Avg Ticket","Conv %"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",color:C.textDim,fontWeight:600,fontSize:11,textTransform:"uppercase",borderBottom:`1px solid ${C.cardBorder}`}}>{h}</th>)}</tr></thead>
              <tbody>
                {mSum.map((m,i)=>{const at=m.admissions>0?m.revenue/m.admissions:0;const cv=m.walkins>0?((m.admissions/m.walkins)*100).toFixed(1):"0";return(
                  <tr key={m.month} style={{background:i%2===0?"transparent":C.cardBorder+"30"}}>
                    <td style={{padding:"12px 16px",fontWeight:700,color:C.accent}}>{m.month}</td>
                    <td style={{padding:"12px 16px",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{fmt(m.revenue)}</td>
                    <td style={{padding:"12px 16px",fontFamily:"'JetBrains Mono',monospace",color:C.green}}>{m.admissions}</td>
                    <td style={{padding:"12px 16px",fontFamily:"'JetBrains Mono',monospace",color:C.amber}}>{m.walkins.toLocaleString()}</td>
                    <td style={{padding:"12px 16px",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(at)}</td>
                    <td style={{padding:"12px 16px"}}><span style={{padding:"3px 10px",borderRadius:12,fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:parseFloat(cv)>=10?C.green+"20":parseFloat(cv)>=5?C.amber+"20":C.rose+"20",color:parseFloat(cv)>=10?C.green:parseFloat(cv)>=5?C.amber:C.rose}}>{cv}%</span></td>
                  </tr>
                );})}
                <tr style={{borderTop:`2px solid ${C.accent}`}}>
                  <td style={{padding:"12px 16px",fontWeight:700,color:C.accent}}>TOTAL</td>
                  <td style={{padding:"12px 16px",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(totals.revenue)}</td>
                  <td style={{padding:"12px 16px",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:C.green}}>{totals.admissions}</td>
                  <td style={{padding:"12px 16px",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:C.amber}}>{totals.walkins.toLocaleString()}</td>
                  <td style={{padding:"12px 16px",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(avgT)}</td>
                  <td style={{padding:"12px 16px"}}><span style={{padding:"3px 10px",borderRadius:12,fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:C.accent+"20",color:C.accent}}>{conv}%</span></td>
                </tr>
              </tbody>
            </table></div>
          </Cd>
        </>)}

        {/* SINGLE MONTH: Daily bars */}
        {!isOv&&(<>
          <Cd><Tt sub="( GS + Other )">Daily Revenue</Tt><ResponsiveContainer width="100%" height={280}><BarChart data={daily} barCategoryGap="18%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false} interval={Math.max(Math.floor(daily.length/15),1)}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickFormatter={fS} tickLine={false} axisLine={false}/><Tooltip content={<Tp/>}/><Bar dataKey="rev" name="Revenue" fill={C.accent} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></Cd>
          <Cd><Tt>Cumulative Revenue</Tt><ResponsiveContainer width="100%" height={250}><AreaChart data={cum}><defs><linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false} interval={Math.max(Math.floor(daily.length/12),1)}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickFormatter={fS} tickLine={false} axisLine={false}/><Tooltip content={<Tp/>}/><Area type="monotone" dataKey="cumRev" name="Cumulative" stroke={C.green} fill="url(#cg2)" strokeWidth={2.5} dot={false}/></AreaChart></ResponsiveContainer></Cd>
          <Cd><Tt>Daily Admissions</Tt><ResponsiveContainer width="100%" height={220}><BarChart data={daily} barCategoryGap="18%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false} interval={Math.max(Math.floor(daily.length/15),1)}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false}/><Tooltip content={<Tp/>}/><Bar dataKey="adm" name="Admissions" fill={C.purple} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></Cd>
        </>)}
      </div>)}

      {/* ═══════════════════════════════════════ */}
      {/* ═══ CENTRES TAB ═══ */}
      {/* ═══════════════════════════════════════ */}
      {tab==="centres"&&(<div style={{display:"grid",gap:18}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
          <Cd><Tt>Revenue Share</Tt><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={centreRevenue} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3} strokeWidth={0}>{centreRevenue.map((_,i)=><Cell key={i} fill={PC[i%5]}/>)}</Pie><Tooltip formatter={v=>fmt(v)}/></PieChart></ResponsiveContainer><div style={{display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center"}}>{centreRevenue.map((c,i)=><div key={c.name} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}><div style={{width:10,height:10,borderRadius:3,background:PC[i%5]}}/><span style={{color:C.textDim}}>{c.name}</span><span style={{color:C.text,fontWeight:600}}>{fmt(c.value)}</span></div>)}</div></Cd>
          <Cd><Tt>Performance</Tt>{centreRevenue.map((c,i)=>{const p=totals.revenue>0?(c.value/totals.revenue)*100:0;return(<div key={c.name} style={{marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,fontWeight:600}}><span style={{color:PC[i%5],marginRight:6}}>#{i+1}</span>{c.name}</span><span style={{fontSize:12,color:C.textDim}}>{c.adm} adm</span></div><div style={{height:8,background:C.cardBorder,borderRadius:4,overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:PC[i%5],borderRadius:4}}/></div><div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:11,color:C.textDim}}>{fmt(c.value)}</span><span style={{fontSize:11,color:PC[i%5]}}>{p.toFixed(1)}%</span></div></div>);})}</Cd>
        </div>

        {/* OVERALL: month-wise centre stacked bars */}
        {isOv&&mSum.length>0&&(
          <Cd><Tt sub="Month-wise">Revenue by Centre per Month</Tt>
            <ResponsiveContainer width="100%" height={300}><BarChart data={mSum} barCategoryGap="25%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="month" tick={{fill:C.text,fontSize:12,fontWeight:500}} tickLine={false} axisLine={false}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickFormatter={fS} tickLine={false} axisLine={false}/><Tooltip content={<Tp/>}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="delhi" name="Delhi" stackId="a" fill={PC[0]}/><Bar dataKey="prayagraj" name="Prayagraj" stackId="a" fill={PC[1]}/><Bar dataKey="indore" name="Indore" stackId="a" fill={PC[2]}/><Bar dataKey="patna" name="Patna" stackId="a" fill={PC[3]}/><Bar dataKey="lucknow" name="Lucknow" stackId="a" fill={PC[4]} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
          </Cd>
        )}

        {/* SINGLE MONTH: daily centre stacked bars */}
        {!isOv&&(
          <Cd><Tt>Daily Revenue by Centre</Tt><ResponsiveContainer width="100%" height={300}><BarChart data={daily} barCategoryGap="15%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false} interval={Math.max(Math.floor(daily.length/15),1)}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickFormatter={fS} tickLine={false} axisLine={false}/><Tooltip content={<Tp/>}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="delhi" name="Delhi" stackId="a" fill={PC[0]}/><Bar dataKey="prayagraj" name="Prayagraj" stackId="a" fill={PC[1]}/><Bar dataKey="indore" name="Indore" stackId="a" fill={PC[2]}/><Bar dataKey="patna" name="Patna" stackId="a" fill={PC[3]}/><Bar dataKey="lucknow" name="Lucknow" stackId="a" fill={PC[4]} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></Cd>
        )}
      </div>)}

      {/* ═══════════════════════════════════════ */}
      {/* ═══ WALKINS TAB ═══ */}
      {/* ═══════════════════════════════════════ */}
      {tab==="walkins"&&(<div style={{display:"grid",gap:18}}>

        {/* OVERALL: month-wise walkins */}
        {isOv&&mSum.length>0&&(<>
          <Cd><Tt sub="Month-wise">Walk-ins by Month</Tt>
            <ResponsiveContainer width="100%" height={280}><BarChart data={mSum} barCategoryGap="30%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="month" tick={{fill:C.text,fontSize:13,fontWeight:600}} tickLine={false} axisLine={false}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="walkins" name="Walk-ins" fill={C.amber} radius={[8,8,0,0]}/></BarChart></ResponsiveContainer>
          </Cd>
          <Cd><Tt sub="Month-wise">Walk-ins by Centre per Month</Tt>
            <ResponsiveContainer width="100%" height={280}><BarChart data={mSum} barCategoryGap="25%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="month" tick={{fill:C.text,fontSize:12}} tickLine={false} axisLine={false}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false}/><Tooltip/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="delhi" name="Delhi" stackId="a" fill={PC[0]}/><Bar dataKey="prayagraj" name="Prayagraj" stackId="a" fill={PC[1]}/><Bar dataKey="patna" name="Patna" stackId="a" fill={PC[3]}/><Bar dataKey="lucknow" name="Lucknow" stackId="a" fill={PC[4]}/><Bar dataKey="indore" name="Indore" stackId="a" fill={PC[2]} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
          </Cd>
        </>)}

        {/* SINGLE MONTH: daily walkins */}
        {!isOv&&(<>
          <Cd><Tt>Daily Walk-in Traffic</Tt><ResponsiveContainer width="100%" height={280}><AreaChart data={walkin}><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={0.3}/><stop offset="95%" stopColor={C.amber} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false} interval={Math.max(Math.floor(walkin.length/15),1)}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false}/><Tooltip content={<Tp/>}/><Area type="monotone" dataKey="overall" name="Walk-ins" stroke={C.amber} fill="url(#wg)" strokeWidth={2.5} dot={false}/></AreaChart></ResponsiveContainer></Cd>
          <Cd><Tt>Walk-ins by Centre</Tt><ResponsiveContainer width="100%" height={280}><BarChart data={walkin} barCategoryGap="15%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="date" tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false} interval={Math.max(Math.floor(walkin.length/15),1)}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false}/><Tooltip content={<Tp/>}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="delhi" name="Delhi" stackId="a" fill={PC[0]}/><Bar dataKey="prayagraj" name="Prayagraj" stackId="a" fill={PC[1]}/><Bar dataKey="patna" name="Patna" stackId="a" fill={PC[3]}/><Bar dataKey="lucknow" name="Lucknow" stackId="a" fill={PC[4]}/><Bar dataKey="indore" name="Indore" stackId="a" fill={PC[2]} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></Cd>
        </>)}
      </div>)}

      {/* ═══════════════════════════════════════ */}
      {/* ═══ LEAD FUNNEL TAB ═══ */}
      {/* ═══════════════════════════════════════ */}
      {tab==="leads"&&(<div style={{display:"grid",gap:18}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["Overall",...cNames].map(cn=>(<button key={cn} onClick={()=>setSel(cn)} style={{padding:"7px 18px",borderRadius:8,border:`1px solid ${sel===cn?C.green:C.cardBorder}`,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",background:sel===cn?C.green+"20":C.card,color:sel===cn?C.green:C.textDim}}>{cn}</button>))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:12}}>
          {[{l:"Walk-ins",v:(cf.walkins||0).toLocaleString(),c:C.sky,i:"◉"},{l:"Total Leads",v:(cf.leads||0).toLocaleString(),c:C.purple,i:"◇"},{l:"Enrolled",v:(cf.enrolled||0).toLocaleString(),c:C.green,i:"✓"},{l:"Conversion Rate",v:(cf.convRate||0)+"%",c:(cf.convRate||0)>=10?C.green:(cf.convRate||0)>=5?C.amber:C.rose,i:"%"},{l:"Hot Pipeline",v:((cf.enrolled||0)+(cf.stages?.Interested||0)+(cf.stages?.FP||0)).toLocaleString(),c:C.amber,i:"▲"}].map(k=>(<div key={k.l} style={{background:`linear-gradient(135deg,${C.card} 0%,${k.c}08 100%)`,border:`1px solid ${k.c}30`,borderRadius:14,padding:"16px 18px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-6,right:-4,fontSize:48,opacity:0.06,color:k.c}}>{k.i}</div><p style={{color:C.textDim,fontSize:11,fontWeight:500,letterSpacing:1,textTransform:"uppercase",margin:0}}>{k.l}</p><p style={{color:k.c,fontSize:26,fontWeight:700,margin:"4px 0 0",fontFamily:"'JetBrains Mono',monospace"}}>{k.v}</p></div>))}
        </div>

        <Cd><Tt sub={sel}>Walk-in → Enrollment Funnel</Tt><div style={{display:"flex",flexDirection:"column",gap:8,padding:"0 12px"}}>{funnel.map((s,i)=>{const mx=funnel[0].value||1;const w=Math.max((s.value/mx)*100,8);const dr=i>0&&funnel[i-1].value>0?((funnel[i-1].value-s.value)/funnel[i-1].value*100).toFixed(0):null;return(<div key={s.name} style={{display:"flex",alignItems:"center",gap:12}}><span style={{width:120,fontSize:12,color:C.textDim,textAlign:"right",flexShrink:0}}>{s.name}</span><div style={{flex:1}}><div style={{width:`${w}%`,height:40,borderRadius:8,background:`linear-gradient(90deg,${s.color}40,${s.color}90)`,border:`1px solid ${s.color}60`,display:"flex",alignItems:"center",paddingLeft:14}}><span style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'JetBrains Mono',monospace"}}>{s.value.toLocaleString()}</span></div></div>{dr&&<span style={{fontSize:11,color:C.rose,width:50,flexShrink:0}}>-{dr}%</span>}</div>);})}</div></Cd>

        <Cd><Tt>Conversion % by Centre</Tt><ResponsiveContainer width="100%" height={260}><BarChart data={convC} barCategoryGap="25%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="name" tick={{fill:C.text,fontSize:12,fontWeight:500}} tickLine={false} axisLine={false}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false} unit="%"/><Tooltip formatter={v=>v+"%"}/><Bar dataKey="convRate" name="Conversion %" radius={[6,6,0,0]}>{convC.map((e,i)=><Cell key={i} fill={e.convRate>=10?C.green:e.convRate>=5?C.amber:C.rose}/>)}</Bar></BarChart></ResponsiveContainer><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:8}}><span style={{fontSize:11,padding:"4px 10px",borderRadius:20,background:C.green+"20",color:C.green,fontWeight:600}}>Best: {best.name} {best.convRate}%</span><span style={{fontSize:11,padding:"4px 10px",borderRadius:20,background:C.rose+"20",color:C.rose,fontWeight:600}}>Needs Attention: {worst.name} {worst.convRate}%</span></div></Cd>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
          <Cd><Tt>Lead Stage Distribution</Tt><ResponsiveContainer width="100%" height={300}><BarChart data={stageBar} barCategoryGap="20%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="name" tick={{fill:C.text,fontSize:11}} tickLine={false} axisLine={false}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false}/><Tooltip/><Legend wrapperStyle={{fontSize:10}} formatter={v=>SL[v]||v}/>{stK.map(k=><Bar key={k} dataKey={k} name={k} stackId="s" fill={SC[k]} radius={k==="Fake"?[3,3,0,0]:undefined}/>)}</BarChart></ResponsiveContainer></Cd>
          <Cd><Tt>Lead Sources</Tt><ResponsiveContainer width="100%" height={300}><BarChart data={srcBar} barCategoryGap="20%"><CartesianGrid strokeDasharray="3 3" stroke={C.gridLine} vertical={false}/><XAxis dataKey="name" tick={{fill:C.text,fontSize:11}} tickLine={false} axisLine={false}/><YAxis tick={{fill:C.textDim,fontSize:10}} tickLine={false} axisLine={false}/><Tooltip/><Legend wrapperStyle={{fontSize:10}} formatter={v=>SoL[v]||v}/>{srK.map(k=><Bar key={k} dataKey={k} name={k} stackId="s" fill={SoC[k]} radius={k==="Events"?[3,3,0,0]:undefined}/>)}</BarChart></ResponsiveContainer></Cd>
        </div>

        {webD.length>0&&(<Cd><Tt sub={sel}>Website Leads Status</Tt><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"center"}}><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={webD} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={50} paddingAngle={2} strokeWidth={0}>{webD.map((_,i)=><Cell key={i} fill={wCl[i%wCl.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div style={{display:"flex",flexDirection:"column",gap:6}}>{webD.map((item,i)=>{const tot=webD.reduce((a,b)=>a+b.value,0);return(<div key={item.name} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}><div style={{width:10,height:10,borderRadius:3,background:wCl[i%wCl.length],flexShrink:0}}/><span style={{color:C.textDim,flex:1}}>{item.name}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:C.text}}>{item.value}</span><span style={{fontSize:10,color:C.textDim,width:40,textAlign:"right"}}>{((item.value/tot)*100).toFixed(1)}%</span></div>);})}</div></div></Cd>)}

        <Cd><Tt>Centre Comparison</Tt><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:12}}><thead><tr>{["Centre","Walk-ins","Leads","Cold","Warm","Interested","FP","Enrolled","Conv %","Hot"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:C.textDim,fontWeight:600,fontSize:11,textTransform:"uppercase",borderBottom:`1px solid ${C.cardBorder}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{cNames.map((cn,i)=>{const d=leadFunnelData?.[cn]||{};const st=d.stages||{};const hot=(d.enrolled||0)+(st.Interested||0)+(st.FP||0);return(<tr key={cn} style={{background:i%2===0?"transparent":C.cardBorder+"30"}}><td style={{padding:"10px 12px",fontWeight:600,color:PC[i]}}>{cn}</td><td style={{padding:"10px 12px",fontFamily:"'JetBrains Mono',monospace"}}>{d.walkins||0}</td><td style={{padding:"10px 12px",fontFamily:"'JetBrains Mono',monospace"}}>{(d.leads||0).toLocaleString()}</td><td style={{padding:"10px 12px",color:C.textDim}}>{st.Cold||0}</td><td style={{padding:"10px 12px",color:C.amber}}>{st.Warm||0}</td><td style={{padding:"10px 12px",color:C.sky}}>{st.Interested||0}</td><td style={{padding:"10px 12px",color:C.accent}}>{st.FP||0}</td><td style={{padding:"10px 12px",color:C.green,fontWeight:700}}>{d.enrolled||0}</td><td style={{padding:"10px 12px"}}><span style={{padding:"3px 8px",borderRadius:12,fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:(d.convRate||0)>=10?C.green+"20":(d.convRate||0)>=5?C.amber+"20":C.rose+"20",color:(d.convRate||0)>=10?C.green:(d.convRate||0)>=5?C.amber:C.rose}}>{d.convRate||0}%</span></td><td style={{padding:"10px 12px",fontWeight:600,color:C.amber}}>{hot}</td></tr>);})}</tbody></table></div></Cd>
      </div>)}

      <div style={{marginTop:28,textAlign:"center",color:C.textDim,fontSize:11,opacity:0.6}}>StudyIQ Offline Centres • Multi-Month Dashboard • {months.length} files</div>
    </div>
  );
}
