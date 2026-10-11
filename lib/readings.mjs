export const metrics = [
 {key:'temp air', label:'อุณหภูมิอากาศ', short:'Temperature', unit:'°C', color:'#c68b76', icon:'☀'},
 {key:'hum soil', label:'ความชื้นดิน', short:'Soil moisture', unit:'%', color:'#75afa1', icon:'◉'},
 {key:'hum air', label:'ความชื้นอากาศ', short:'Air humidity', unit:'%', color:'#839dc8', icon:'◌'},
 {key:'electric wind', label:'Electric wind', short:'Sensor reading', unit:'', color:'#b28abe', icon:'≈'},
];
export function formatValue(value) { return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('th-TH',{maximumFractionDigits:2}) : '—'; }
export function summarize(rows,key) { const values=rows.map(r=>r[key]).filter(v=>typeof v==='number' && Number.isFinite(v)); return values.length ? {min:Math.min(...values),max:Math.max(...values),avg:values.reduce((a,b)=>a+b,0)/values.length} : null; }
export function csv(rows) { const keys=['id',...metrics.map(m=>m.key)];return '\uFEFF'+[keys.join(','),...rows.map(row=>keys.map(k=>formatCSV(row[k])).join(','))].join('\r\n'); }
function formatCSV(value) { if(value==null)return ''; const text=String(value); return '"'+text.replaceAll('"','""')+'"'; }
