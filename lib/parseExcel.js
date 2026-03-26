import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

function num(val) {
  if (val === null || val === undefined || val === "" || val === "-") return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function fmtDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(val);
  if (s.includes("T") || s.includes("-")) return s.slice(0, 10);
  return null;
}

export function parseExcelData() {
  const fullPath = path.join(process.cwd(), "data", "dashboard.xlsx");
  const buf = fs.readFileSync(fullPath);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });

  // ─── ADMISSION REVENUE ───
  const arSheet = wb.Sheets["Business - AdmissionRevenue"];
  const ar = XLSX.utils.sheet_to_json(arSheet, { header: 1, defval: null });

  const dailyData = [];
  for (let i = 5; i < Math.min(ar.length, 40); i++) {
    const row = ar[i];
    if (!row || !row[0]) continue;
    const date = fmtDate(row[0]);
    if (!date) continue;
    dailyData.push({
      date, rev: num(row[6]) + num(row[7]), adm: num(row[2]) + num(row[4]),
      delhi: num(row[13]) + num(row[14]), patna: num(row[20]) + num(row[21]),
      lucknow: num(row[27]) + num(row[28]), prayagraj: num(row[34]) + num(row[35]),
      indore: num(row[41]) + num(row[42]),
    });
  }

  const centreRevenue = [];
  for (const rowIdx of [42, 43, 44, 45, 46]) {
    if (ar[rowIdx] && ar[rowIdx][0]) {
      centreRevenue.push({
        name: String(ar[rowIdx][0]).trim().replace("New Delhi", "Delhi"),
        adm: num(ar[rowIdx][1]), value: num(ar[rowIdx][2]),
      });
    }
  }
  centreRevenue.sort((a, b) => b.value - a.value);
  const totalRow = ar[48] || [];

  // ─── LEAD FUNNEL 1 ───
  const lfSheet = wb.Sheets["Business - Lead Funnel 1"];
  const lf = XLSX.utils.sheet_to_json(lfSheet, { header: 1, defval: null });

  const walkinData = [];
  for (let i = 6; i < Math.min(lf.length, 37); i++) {
    const row = lf[i];
    if (!row || !row[0]) continue;
    const date = fmtDate(row[0]);
    if (!date) continue;
    walkinData.push({
      date, overall: num(row[1]), delhi: num(row[14]), patna: num(row[27]),
      lucknow: num(row[40]), prayagraj: num(row[53]), indore: num(row[66]),
    });
  }

  const totalsRow = lf[38] || [];
  const cW = { Overall:1, Delhi:14, Patna:27, Lucknow:40, Prayagraj:53, Indore:66 };
  const cL = {
    Overall:{Inbound:7,Paid:8,Website:9,External:10,Events:11},
    Delhi:{Inbound:20,Paid:21,Website:22,External:23,Events:24},
    Patna:{Inbound:33,Paid:34,Website:35,External:36,Events:37},
    Lucknow:{Inbound:46,Paid:47,Website:48,External:49,Events:50},
    Prayagraj:{Inbound:59,Paid:60,Website:61,External:62,Events:63},
    Indore:{Inbound:72,Paid:73,Website:74,External:75,Events:75},
  };
  const sR = {NI:42,Fake:43,Cold:44,Warm:45,Engaged:46,Interested:47,FP:48,Enrolled:49};
  const wR = {"Not connected":51,"Dead Lead":52,"Not Interested":53,Contacted:54,"Interested To Buy":56,"Sale Closed":57,"Call Later":58,"Already Paid":59,"Language Barrier":60};
  const wC = {Overall:9,Delhi:22,Patna:35,Lucknow:48,Prayagraj:60,Indore:72};

  const leadFunnelData = {};
  for (const centre of ["Overall","Delhi","Patna","Lucknow","Prayagraj","Indore"]) {
    const walkins = num(totalsRow[cW[centre]]);
    const sources = {}; let totalLeads = 0;
    for (const [src,col] of Object.entries(cL[centre])) { const v=num(totalsRow[col]); sources[src]=v; totalLeads+=v; }
    const stages = {};
    for (const [k,r] of Object.entries(sR)) stages[k] = num((lf[r]||[])[cW[centre]]);
    const webLeads = {};
    for (const [label,r] of Object.entries(wR)) { const n=num((lf[r]||[])[wC[centre]]); if(n>0) webLeads[label]=n; }
    const enrolled = stages.Enrolled||0;
    leadFunnelData[centre] = {
      walkins, leads:totalLeads, enrolled,
      convRate: walkins>0 ? Math.round((enrolled/walkins)*1000)/10 : 0,
      stages, sources, webLeads,
    };
  }

  return {
    dailyData, centreRevenue, walkinData, leadFunnelData,
    totals: { revenue: num(totalRow[2]), admissions: num(totalRow[1]), walkins: walkinData.reduce((s,w)=>s+w.overall,0) },
  };
}
