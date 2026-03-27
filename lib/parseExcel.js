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
  return {label,dailyData:[],centreRevenue:[],walkinData:[],leadFunnelData:{},
    totals:{revenue:0,gsRevenue:0,otherRevenue:0,admissions:0,gsAdmissions:0,otherAdmissions:0,walkins:0},
    centreGsOther:{},hasData:false};
}

// Centre column mapping for AdmissionRevenue sheet
// Each centre: [gsRevCol, otherRevCol, gsAdmCol, otherAdmCol]
const CENTRE_COLS = {
  delhi:    {gs:13, other:14, gsAdm:9,  otherAdm:11},
  patna:    {gs:20, other:21, gsAdm:16, otherAdm:18},
  lucknow:  {gs:27, other:28, gsAdm:23, otherAdm:25},
  prayagraj:{gs:34, other:35, gsAdm:30, otherAdm:32},
  indore:   {gs:41, other:42, gsAdm:37, otherAdm:39},
};

function parseOneFile(filePath,label){
  try{
    const buf=fs.readFileSync(filePath);
    const wb=XLSX.read(buf,{type:"buffer",cellDates:true});
    if(!wb.Sheets["Business - AdmissionRevenue"]||!wb.Sheets["Business - Lead Funnel 1"])return emptyMonth(label);

    const ar=XLSX.utils.sheet_to_json(wb.Sheets["Business - AdmissionRevenue"],{header:1,defval:null});
    const dailyData=[];

    // Accumulate GS/Other per centre across all days
    const centreGsOther={};
    for(const cn of["delhi","patna","lucknow","prayagraj","indore"]){
      centreGsOther[cn]={gsRev:0,otherRev:0,gsAdm:0,otherAdm:0};
    }
    let totalGsRev=0,totalOtherRev=0,totalGsAdm=0,totalOtherAdm=0;

    for(let i=5;i<Math.min(ar.length,40);i++){
      const r=ar[i];if(!r||!r[0])continue;const date=fmtDate(r[0]);if(!date)continue;

      const gsR=num(r[6]),otR=num(r[7]),gsA=num(r[2]),otA=num(r[4]);
      totalGsRev+=gsR;totalOtherRev+=otR;totalGsAdm+=gsA;totalOtherAdm+=otA;

      const row={date,rev:gsR+otR,gsRev:gsR,otherRev:otR,adm:gsA+otA,gsAdm:gsA,otherAdm:otA};

      for(const[cn,cols]of Object.entries(CENTRE_COLS)){
        const cgs=num(r[cols.gs]),cot=num(r[cols.other]);
        row[cn]=cgs+cot;
        row[cn+"_gs"]=cgs;
        row[cn+"_other"]=cot;
        centreGsOther[cn].gsRev+=cgs;
        centreGsOther[cn].otherRev+=cot;
        centreGsOther[cn].gsAdm+=num(r[cols.gsAdm]);
        centreGsOther[cn].otherAdm+=num(r[cols.otherAdm]);
      }
      dailyData.push(row);
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
      label,dailyData,centreRevenue,walkinData,leadFunnelData,centreGsOther,
      totals:{revenue:num(tR[2]),gsRevenue:totalGsRev,otherRevenue:totalOtherRev,
        admissions:num(tR[1]),gsAdmissions:totalGsAdm,otherAdmissions:totalOtherAdm,
        walkins:walkinData.reduce((s,w)=>s+w.overall,0)},
      hasData:true,
    };
  }catch(e){console.error(`Error parsing ${filePath}:`,e.message);return emptyMonth(label);}
}

function computeOverall(months){
  const valid=months.filter(m=>m.hasData);
  if(valid.length===0)return emptyMonth("Overall");

  let totalRev=0,totalAdm=0,totalWalkins=0,totalGsRev=0,totalOtherRev=0,totalGsAdm=0,totalOtherAdm=0;
  const centreRevMap={};
  const centreGsOther={};
  for(const cn of["delhi","patna","lucknow","prayagraj","indore"])centreGsOther[cn]={gsRev:0,otherRev:0,gsAdm:0,otherAdm:0};
  const leadTotals={};
  const monthSummary=[];

  for(const m of valid){
    totalRev+=m.totals.revenue;totalAdm+=m.totals.admissions;totalWalkins+=m.totals.walkins;
    totalGsRev+=m.totals.gsRevenue;totalOtherRev+=m.totals.otherRevenue;
    totalGsAdm+=m.totals.gsAdmissions;totalOtherAdm+=m.totals.otherAdmissions;

    for(const c of m.centreRevenue){
      if(!centreRevMap[c.name])centreRevMap[c.name]={name:c.name,adm:0,value:0};
      centreRevMap[c.name].adm+=c.adm;centreRevMap[c.name].value+=c.value;
    }

    // Aggregate centre GS/Other
    if(m.centreGsOther){
      for(const[cn,d]of Object.entries(m.centreGsOther)){
        centreGsOther[cn].gsRev+=d.gsRev;centreGsOther[cn].otherRev+=d.otherRev;
        centreGsOther[cn].gsAdm+=d.gsAdm;centreGsOther[cn].otherAdm+=d.otherAdm;
      }
    }

    const mRow={month:m.label,revenue:m.totals.revenue,gsRevenue:m.totals.gsRevenue,otherRevenue:m.totals.otherRevenue,
      admissions:m.totals.admissions,gsAdmissions:m.totals.gsAdmissions,otherAdmissions:m.totals.otherAdmissions,walkins:m.totals.walkins};
    for(const c of m.centreRevenue){const key=c.name.toLowerCase().replace(/\s+/g,"");mRow[key]=c.value;}
    if(m.walkinData.length>0){
      const wT={delhi:0,patna:0,lucknow:0,prayagraj:0,indore:0};
      for(const w of m.walkinData){for(const k of Object.keys(wT))wT[k]+=w[k]||0;}
      Object.assign(mRow,wT);
    }
    monthSummary.push(mRow);

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

  return {
    label:"Overall",dailyData:[],centreRevenue,walkinData:[],leadFunnelData,centreGsOther,
    totals:{revenue:totalRev,gsRevenue:totalGsRev,otherRevenue:totalOtherRev,
      admissions:totalAdm,gsAdmissions:totalGsAdm,otherAdmissions:totalOtherAdm,walkins:totalWalkins},
    hasData:true,monthSummary,isOverall:true,
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
  return{months,overall};
}
