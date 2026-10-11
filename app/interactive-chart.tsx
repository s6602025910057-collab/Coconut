'use client';
import { useState } from 'react';
import { formatValue } from '../lib/readings.mjs';
type Row = { id: number; [key: string]: number | null };
type Props = { rows: Row[]; field: string; color: string; label: string; unit: string };
export default function InteractiveChart({ rows, field, color, label, unit }: Props) {
 const [range, setRange] = useState<[number, number] | null>(null);
 const [activeId, setActiveId] = useState<number | null>(null);
 const last = Math.max(0, rows.length - 1);
 const start = Math.min(range?.[0] ?? 0, last);
 const end = Math.max(start, Math.min(range?.[1] ?? last, last));
 const visible = rows.slice(start, end + 1);
 const values = visible.map(r => r[field]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
 const activeIndex = visible.findIndex(r => r.id === activeId);
 const selected = activeIndex >= 0 ? visible[activeIndex] : null;
 const minimum = values.length ? Math.min(...values) : 0;
 const maximum = values.length ? Math.max(...values) : 1;
 const padding = maximum === minimum ? Math.max(Math.abs(maximum) * .05, 1) : (maximum - minimum) * .12;
 const low = minimum - padding, high = maximum + padding;
 const x = (index: number) => visible.length === 1 ? 370 : 60 + index / (visible.length - 1) * 620;
 const y = (value: number) => 192 - (value - low) / (high - low) * 160;
 const segments: string[] = []; let path = '';
 visible.forEach((row, index) => { const value = row[field]; if (typeof value === 'number' && Number.isFinite(value)) path += `${path ? ' L' : 'M'}${x(index)},${y(value)}`; else if (path) { segments.push(path); path = ''; } });
 if (path) segments.push(path);
 function zoom(factor: number) {
  const count = Math.min(rows.length, Math.max(Math.min(2, rows.length), Math.round(visible.length * factor)));
  const center = activeIndex >= 0 ? start + activeIndex : (start + end) / 2;
  const nextStart = Math.max(0, Math.min(rows.length - count, Math.round(center - (count - 1) / 2)));
  setRange([nextStart, nextStart + count - 1]);
 }
 return <div className="interactive-chart">
  <div className="chart-toolbar"><span>ชี้หรือแตะกราฟเพื่อดูค่า</span><div><button type="button" disabled={visible.length <= 2} onClick={() => zoom(.5)} aria-label="ซูมเข้า">＋</button><button type="button" disabled={visible.length === rows.length} onClick={() => zoom(2)} aria-label="ซูมออก">−</button><button type="button" disabled={!range} onClick={() => { setRange(null); setActiveId(null); }}>แสดงทั้งหมด</button></div></div>
  {rows.length ? <>
   <div className="chart-readout" role="status" aria-live="polite">{selected ? <><b>ID {selected.id}</b><span>{label}: <strong>{formatValue(selected[field])} {typeof selected[field] === 'number' ? unit : ''}</strong></span></> : <span>เลือกจุดข้อมูล · ใช้ปุ่มลูกศร ← → บนกราฟได้</span>}</div>
   <svg viewBox="0 0 720 235" role="group" tabIndex={0} aria-label={`กราฟ ${label} ใช้ลูกศรซ้ายขวาเลือกจุดข้อมูล Home และ End ไปจุดแรกและจุดสุดท้าย`} style={{touchAction:'pan-y'}}
    onPointerMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); const position = (event.clientX - bounds.left) / bounds.width * 720; const index = Math.max(0, Math.min(visible.length - 1, Math.round((position - 60) / 620 * (visible.length - 1)))); setActiveId(visible[index].id); }}
    onPointerDown={event => { event.currentTarget.focus(); const bounds = event.currentTarget.getBoundingClientRect(); const position = (event.clientX - bounds.left) / bounds.width * 720; const index = Math.max(0, Math.min(visible.length - 1, Math.round((position - 60) / 620 * (visible.length - 1)))); setActiveId(visible[index].id); }}
    onKeyDown={event => { let index = activeIndex; if (event.key === 'ArrowRight') index = Math.min(visible.length - 1, activeIndex + 1); else if (event.key === 'ArrowLeft') index = Math.max(0, activeIndex - 1); else if (event.key === 'Home') index = 0; else if (event.key === 'End') index = visible.length - 1; else return; event.preventDefault(); setActiveId(visible[index].id); }}>
    {[0,1,2,3,4].map(i => { const value = low + (high-low)*i/4; const position = y(value); return <g key={i}><line x1="60" x2="680" y1={position} y2={position} stroke="#e2e9e2" strokeDasharray="4 5"/><text x="50" y={position+4} textAnchor="end">{formatValue(value)}</text></g>; })}
    {segments.map((segment,i) => <path key={i} d={segment} fill="none" stroke={color} strokeWidth="3"/>)}
    {visible.length <= 100 && visible.map((row,index) => typeof row[field] === 'number' && Number.isFinite(row[field]) ? <circle key={row.id} cx={x(index)} cy={y(row[field] as number)} r={row.id === activeId ? 6 : 3} fill={color}/> : null)}
    {selected && <g><line x1={x(activeIndex)} x2={x(activeIndex)} y1="25" y2="192" stroke={color} strokeDasharray="5 4"/>{typeof selected[field] === 'number' && Number.isFinite(selected[field]) && <circle cx={x(activeIndex)} cy={y(selected[field] as number)} r="6" stroke="white" strokeWidth="2" fill={color}/>}</g>}
    <text x="60" y="218">ID {visible[0]?.id}</text><text x="680" y="218" textAnchor="end">ID {visible.at(-1)?.id}</text>
    <text x="370" y="233" textAnchor="middle">ลำดับการบันทึก (ID)</text>
   </svg>
   {!values.length && <div className="chart-note">ไม่มีค่าของเซ็นเซอร์นี้ในช่วงที่เลือก</div>}
   <div className="chart-range"><label>เริ่ม: ID {rows[start]?.id}<input type="range" min={0} max={last} value={start} disabled={rows.length < 2} onChange={event => { const value=Number(event.target.value);setRange([value,Math.max(value,end)]); }} aria-label="จุดเริ่มต้นช่วงกราฟ"/></label><label>สิ้นสุด: ID {rows[end]?.id}<input type="range" min={0} max={last} value={end} disabled={rows.length < 2} onChange={event => { const value=Number(event.target.value);setRange([Math.min(start,value),value]); }} aria-label="จุดสิ้นสุดช่วงกราฟ"/></label></div>
   <div className="chart-note">แสดง {visible.length} จาก {rows.length} รายการ · ค่าขาดหายจะเว้นช่องว่างในเส้นกราฟ</div>
  </> : <div className="chart-empty">ยังไม่มีข้อมูลสำหรับกราฟ</div>}
 </div>;
}
