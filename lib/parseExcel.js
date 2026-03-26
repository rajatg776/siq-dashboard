import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

function num(v){if(v===null||v===undefined||v===""||v==="-")return 0;const n=Number(v);return isNaN(n)?0:n;}
function fmtDate(v){
  if(!v)return null;
  if(v instanceof Date)return v.toISOString().slice(0,10);
  if(typeof v==="number"){const d=XLSX.SSF.parse_date_code(v);if(d)return`${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;}
  const s=String(v);if(s.includes("T")||s.includes("-"))return s.slice(0,10);return null;
}

function emptyMonth(label){
  return {
    label, dailyData:[], centreRevenue:[], walkinData:[], leadFunnelData:{},
    totals:{revenue:0,admissions:0,walkins:0}, hasData:false,
  };
}

function parseOneFile(filePath, label){
  try{
    const buf=fs.readFileSync(filePath);
    const wb=XLSX.read(buf,{type:"buffer",cellDates:true});
    if(!wb.Sheets["Business - AdmissionRevenue"]||!wb.Sheets["Business - Lead Funnel 1"])return emptyMonth(label);

    // ── AdmissionRevenue ──
    const ar=XLSX.utils.sheet_to_json(wb.Sheets["Business - AdmissionRevenue"],{header:1,defval:null});
    const dailyData=[];
    for(let i=5;i<Math.min(ar.length,40);i++){
      const r=ar[i];if(!r||!r[0])continue;const date=fmtDate(r[0]);if(!date)continue;
      dailyData.push({date,rev:num(r[6])+num(r[7]),adm:num(r[2])+num(r[4]),
        delhi:num(r[13])+num(r[14]),patna:num(r[20])+num(r[21]),lucknow:num(r[27])+num(r[28]),
        prayagraj:num(r[34])+num(r[35]),indore:num(r[41])+num(r[42])});
    }
    if(dailyData.length===0)return emptyMonth(label);

    const centreRevenue=[];
    for(const ri of[42,43,44,45,46]){
      if(ar[ri]&&ar[ri][0])centreRevenue.push({name:String(ar[ri][0]).trim().replace("New Delhi","Delhi"),adm:num(ar[ri][1]),value:num(ar[ri][2])});
    }
    centreRevenue.sort((a,b)=>b.value-a.value);
    const tR=ar[48]||[];

    // ── Lead Funnel 1 ──
    const lf=XLSX.utils.sheet_to_json(wb.Sheets["Business - Lead Funnel 1"],{header:1,defval:null});
    const walkinData=[];
    for(let i=6;i<Math.min(lf.length,37);i++){
      const r=lf[i];if(!r||!r[0])continue;const date=fmtDate(r[0]);if(!date)continue;
      walkinData.push({date,overall:num(r[1]),delhi:num(r[14]),patna:num(r[27]),lucknow:num(r[40]),prayagraj:num(r[53]),indore:num(r[66])});
    }

    const tot=lf[38]||[];
    const cW={Overall:1,Delhi:14,Patna:27,Lucknow:40,Prayagraj:53,Indore:66};
    const cL={Overall:{Inbound:7,Paid:8,Website:9,External:10,Events:11},Delhi:{Inbound:20,Paid:21,Website:22,External:23,Events:24},Patna:{Inbound:33,Paid:34,Website:35,External:36,Events:37},Lucknow:{Inbound:46,Paid:47,Website:48,External:49,Events:50},Prayagraj:{Inbound:59,Paid:60,Website:61,External:62,Events:63},Indore:{Inbound:72,Paid:73,Website:74,External:75,Events:75}};
    const sR={NI:42,Fake:43,Cold:44,Warm:45,Engaged:46,Interested:47,FP:48,Enrolled:49};
    const wR={"Not connected":51,"Dead Lead":52,"Not Interested":53,Contacted:54,"Interested To Buy":56,"Sale Closed":57,"Call Later":58,"Already Paid":59,"Language Barrier":60};
    const wC={Overall:9,Delhi:22,Patna:35,Lucknow:48,Prayagraj:60,Indore:72};

    const leadFunnelData={};
    for(const c of["Overall","Delhi","Patna","Lucknow","Prayagraj","Indore"]){
      const walkins=num(tot[cW[c]]);
      const sources={};let tLeads=0;
      for(const[s,col]of Object.entries(cL[c])){const v=num(tot[col]);sources[s]=v;tLeads+=v;}
      const stages={};for(const[k,r]of Object.entries(sR))stages[k]=num((lf[r]||[])[cW[c]]);
      const webLeads={};for(const[lb,r]of Object.entries(wR)){const n=num((lf[r]||[])[wC[c]]);if(n>0)webLeads[lb]=n;}
      const enrolled=stages.Enrolled||0;
      leadFunnelData[c]={walkins,leads:tLeads,enrolled,convRate:walkins>0?Math.round((enrolled/walkins)*1000)/10:0,stages,sources,webLeads};
    }

    return {
      label, dailyData, centreRevenue, walkinData, leadFunnelData,
      totals:{revenue:num(tR[2]),admissions:num(tR[1]),walkins:walkinData.reduce((s,w)=>s+w.overall,0)},
      hasData:true,
    };
  }catch(e){console.error(`Error parsing ${filePath}:`,e.message);return emptyMonth(label);}
}

function computeOverall(months){
  const valid=months.filter(m=>m.hasData);
  if(valid.length===0)return emptyMonth("Overall");

  let totalRev=0,totalAdm=0,totalWalkins=0;
  const centreRevMap={};
  const leadTotals={};
  const allDaily=[];
  const allWalkins=[];

  for(const m of valid){
    totalRev+=m.totals.revenue;
    totalAdm+=m.totals.admissions;
    totalWalkins+=m.totals.walkins;
    for(const c of m.centreRevenue){
      if(!centreRevMap[c.name])centreRevMap[c.name]={name:c.name,adm:0,value:0};
      centreRevMap[c.name].adm+=c.adm;centreRevMap[c.name].value+=c.value;
    }
    allDaily.push(...m.dailyData);
    allWalkins.push(...m.walkinData);

    // Aggregate lead funnel
    for(const[centre,fd]of Object.entries(m.leadFunnelData)){
      if(!leadTotals[centre])leadTotals[centre]={walkins:0,leads:0,enrolled:0,stages:{},sources:{},webLeads:{}};
      const lt=leadTotals[centre];
      lt.walkins+=fd.walkins;lt.leads+=fd.leads;lt.enrolled+=fd.enrolled;
      for(const[k,v]of Object.entries(fd.stages))lt.stages[k]=(lt.stages[k]||0)+v;
      for(const[k,v]of Object.entries(fd.sources))lt.sources[k]=(lt.sources[k]||0)+v;
      for(const[k,v]of Object.entries(fd.webLeads))lt.webLeads[k]=(lt.webLeads[k]||0)+v;
    }
  }

  const centreRevenue=Object.values(centreRevMap).sort((a,b)=>b.value-a.value);
  const leadFunnelData={};
  for(const[c,lt]of Object.entries(leadTotals)){
    leadFunnelData[c]={...lt,convRate:lt.walkins>0?Math.round((lt.enrolled/lt.walkins)*1000)/10:0};
  }

  // Monthly summary for trend chart
  const monthSummary=valid.map(m=>({month:m.label,revenue:m.totals.revenue,admissions:m.totals.admissions,walkins:m.totals.walkins}));

  return {
    label:"Overall",dailyData:allDaily,centreRevenue,walkinData:allWalkins,leadFunnelData,
    totals:{revenue:totalRev,admissions:totalAdm,walkins:totalWalkins},
    hasData:true,monthSummary,
  };
}

export function parseAllExcelFiles(){
  const dataDir=path.join(process.cwd(),"data");
  const files=fs.readdirSync(dataDir).filter(f=>f.endsWith(".xlsx")).sort();

  const months=files.map(f=>{
    const label=f.replace(".xlsx","").replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());
    return parseOneFile(path.join(dataDir,f),label);
  });

  const overall=computeOverall(months);
  return {months,overall};
}
