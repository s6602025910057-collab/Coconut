'use client';
import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { formatValue, metrics, summarize } from '../lib/readings.mjs';
import { windowRange, shiftRange } from '../lib/chart-range.mjs';
type Row = { id: number; [key: string]: number | null };
type Props = { rows: Row[]; field: string; color: string; label: string; unit: string };
type Drag = { first:number; current:number; origin:[number,number]; mode:string };
export default function InteractiveChart({ rows, field, color, label, unit }: Props) {
 const gradientId=useId().replaceAll(':','');
 const [range,setRange]=useState<[number,number]|null>(null);
 const [activeId,setActiveId]=useState<number|null>(null);
 const [pinned,setPinned]=useState(false);
 const [mode,setMode]=useState('inspect');
 const [style,setStyle]=useState('area');
 const [showAverage,setShowAverage]=useState(false);
 const [drag,setDrag]=useState<Drag|null>(null);
 const dragRef=useRef<Drag|null>(null);
 const svgRef=useRef<SVGSVGElement|null>(null);
 const last=Math.max(0,rows.length-1);
 const start=Math.min(range?.[0]??0,last),end=Math.max(start,Math.min(range?.[1]??last,last));
 const visible=rows.slice(start,end+1);
 const values=visible.map(r=>r[field]).filter((v):v is number=>typeof v==='number'&&Number.isFinite(v));
 const activeIndex=visible.findIndex(r=>r.id===activeId),selected=activeIndex>=0?visible[activeIndex]:null;
 const stats=summarize(visible,field);
 const minimum=values.length?Math.min(...values):0,maximum=values.length?Math.max(...values):1;
 const padding=maximum===minimum?Math.max(Math.abs(maximum)*.05,1):(maximum-minimum)*.15;
 const low=style==='bar'?Math.min(0,minimum-padding):minimum-padding,high=Math.max(style==='bar'?0:-Infinity,maximum+padding);
 const x=(i:number)=>visible.length===1?370:60+i/(visible.length-1)*620;
 const y=(v:number)=>212-(v-low)/(high-low)*170;
 const paths:{path:string;first:number;last:number}[]=[];let path='',first=0,tail=0;
 visible.forEach((row,i)=>{const v=row[field];if(typeof v==='number'&&Number.isFinite(v)){if(!path)first=i;tail=i;path+=`${path?' L':'M'}${x(i)},${y(v)}`;}else if(path){paths.push({path,first,last:tail});path='';}});if(path)paths.push({path,first,last:tail});
 function zoom(factor:number){if(!rows.length)return;const count=Math.max(Math.min(2,rows.length),Math.round(visible.length*factor));setRange(windowRange(rows.length,count,activeIndex>=0?start+activeIndex:(start+end)/2) as [number,number]);}
 useEffect(()=>{const element=svgRef.current;if(!element)return;const wheel=(event:WheelEvent)=>{if(event.shiftKey||event.ctrlKey){event.preventDefault();zoom(event.deltaY<0 ? .8 : 1.25);}};element.addEventListener('wheel',wheel,{passive:false});return()=>element.removeEventListener('wheel',wheel);});
 function pan(offset:number){setRange(shiftRange(rows.length,start,end,offset) as [number,number]);}
 function indexAt(event:PointerEvent<SVGSVGElement>){const bounds=event.currentTarget.getBoundingClientRect();return Math.max(0,Math.min(visible.length-1,Math.round(((event.clientX-bounds.left)/bounds.width*720-60)/620*(visible.length-1))));}
 function pointerDown(event:PointerEvent<SVGSVGElement>){if(!visible.length)return;event.currentTarget.focus();const index=indexAt(event);setActiveId(visible[index].id);if(mode==='inspect'){setPinned(p=>!p);return;}setPinned(false);event.currentTarget.setPointerCapture(event.pointerId);const value={first:index,current:index,origin:[start,end] as [number,number],mode};dragRef.current=value;setDrag(value);}
 function pointerMove(event:PointerEvent<SVGSVGElement>){if(!visible.length)return;const index=indexAt(event),current=dragRef.current;if(current){const value={...current,current:index};dragRef.current=value;setDrag(value);if(current.mode==='pan')setRange(shiftRange(rows.length,...current.origin,current.first-index) as [number,number]);}else if(!pinned)setActiveId(visible[index].id);}
 function pointerUp(event:PointerEvent<SVGSVGElement>){const current=dragRef.current;if(current?.mode==='select'&&current.first!==current.current)setRange([start+Math.min(current.first,current.current),start+Math.max(current.first,current.current)]);dragRef.current=null;setDrag(null);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}
 function reset(){setRange(null);setPinned(false);setActiveId(null);}
 return <div className="interactive-chart">
  <div className="chart-toolbar"><div className="chart-segment" role="group" aria-label="รูปแบบกราฟ">{[['area','พื้นที่'],['line','เส้น'],['bar','แท่ง']].map(([value,text])=><button key={value} onClick={()=>setStyle(value)} aria-pressed={style===value}>{text}</button>)}</div><div className="zoom-actions"><button disabled={visible.length<=2} onClick={()=>zoom(.5)} aria-label="ซูมเข้า">＋</button><button disabled={visible.length===rows.length} onClick={()=>zoom(2)} aria-label="ซูมออก">−</button><button disabled={!range} onClick={reset}>รีเซ็ต</button></div></div>
  <div className="chart-options"><div className="chart-segment" role="group" aria-label="เครื่องมือกราฟ">{[['inspect','⌖ ดูค่า'],['select','▧ ลากซูม'],['pan','↔ เลื่อน']].map(([value,text])=><button key={value} onClick={()=>{setMode(value);setPinned(false);}} aria-pressed={mode===value}>{text}</button>)}</div><label><input type="checkbox" checked={showAverage} onChange={e=>setShowAverage(e.target.checked)}/> เส้นค่าเฉลี่ย</label></div>
  {rows.length?<>
   <div className="chart-readout" role="status" aria-live="polite">{selected?<><b>ID {selected.id}</b><span>{label}: <strong>{formatValue(selected[field])} {typeof selected[field]==='number'?unit:''}</strong></span><span className="pin-label">{pinned?'● ล็อกจุดแล้ว':'คลิกเพื่อล็อกจุด'}</span></>:<span>ชี้หรือแตะดูค่า · Shift + ล้อเมาส์เพื่อซูม · ดับเบิลคลิกเพื่อรีเซ็ต</span>}</div>
   <svg ref={svgRef} viewBox="0 0 720 255" role="group" tabIndex={0} aria-label={`กราฟ ${label} ใช้ลูกศรเลือกจุด ปุ่มบวกหรือลบเพื่อซูม Escape เพื่อรีเซ็ต`} className={`plot mode-${mode}`} style={{touchAction:mode==='inspect'?'pan-y':'none'}}
    onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{dragRef.current=null;setDrag(null);}} onDoubleClick={reset}
    onKeyDown={event=>{if(!visible.length)return;let index=activeIndex;if(event.key==='ArrowRight')index=Math.min(visible.length-1,activeIndex+1);else if(event.key==='ArrowLeft')index=Math.max(0,activeIndex-1);else if(event.key==='Home')index=0;else if(event.key==='End')index=visible.length-1;else if(event.key==='+'||event.key==='='){event.preventDefault();zoom(.5);return;}else if(event.key==='-'){event.preventDefault();zoom(2);return;}else if(event.key==='Escape'){reset();return;}else return;event.preventDefault();setPinned(false);setActiveId(visible[index].id);}}>
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".45"/><stop offset="100%" stopColor={color} stopOpacity=".03"/></linearGradient></defs>
    {[0,1,2,3,4].map(i=>{const value=low+(high-low)*i/4,position=y(value);return <g key={i}><line x1="60" x2="680" y1={position} y2={position} stroke="#bfc5de" strokeOpacity=".45" strokeDasharray="3 6"/><text x="50" y={position+4} textAnchor="end">{formatValue(value)}</text></g>;})}
    {style==='bar'?visible.map((row,i)=>typeof row[field]==='number'&&Number.isFinite(row[field])?<rect key={row.id} x={x(i)-Math.min(20,250/visible.length)} y={Math.min(y(row[field] as number),y(0))} width={Math.min(40,500/visible.length)} height={Math.max(1,Math.abs(y(row[field] as number)-y(0)))} rx="3" fill={color} opacity={selected&&selected.id!==row.id ? .45 : .85}/>:null):paths.map((segment,i)=><g key={i}>{style==='area'&&<path d={`${segment.path} L${x(segment.last)},212 L${x(segment.first)},212 Z`} fill={`url(#${gradientId})`}/>}<path className="sensor-line" pathLength={1} d={segment.path} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/></g>)}
    {showAverage&&stats&&<g><line x1="60" x2="680" y1={y(stats.avg)} y2={y(stats.avg)} stroke="#6d6498" strokeDasharray="8 5"/><text x="675" y={y(stats.avg)-7} textAnchor="end">เฉลี่ย {formatValue(stats.avg)}</text></g>}
    {style!=='bar'&&visible.length<=100&&visible.map((row,i)=>typeof row[field]==='number'&&Number.isFinite(row[field])?<circle key={row.id} cx={x(i)} cy={y(row[field] as number)} r={row.id===activeId?6:3} fill={color} stroke="white" strokeWidth="1.5"/>:null)}
    {selected&&<g><line x1={x(activeIndex)} x2={x(activeIndex)} y1="30" y2="212" stroke={color} strokeDasharray="5 4"/>{typeof selected[field]==='number'&&Number.isFinite(selected[field])&&<circle cx={x(activeIndex)} cy={y(selected[field] as number)} r="7" stroke="white" strokeWidth="2" fill={color}/>}<rect x={Math.min(570,Math.max(60,x(activeIndex)-55))} y="10" width="110" height="23" rx="11" fill={color}/><text x={Math.min(570,Math.max(60,x(activeIndex)-55))+55} y="26" textAnchor="middle" style={{fill:'#fff',fontWeight:600}}>ID {selected.id} · {formatValue(selected[field])}</text></g>}
    {drag?.mode==='select'&&<rect x={Math.min(x(drag.first),x(drag.current))} y="34" width={Math.max(2,Math.abs(x(drag.current)-x(drag.first)))} height="178" fill={color} fillOpacity=".18" stroke={color} strokeDasharray="5 3"/>}
    <text x="60" y="238">ID {visible[0]?.id}</text><text x="680" y="238" textAnchor="end">ID {visible.at(-1)?.id}</text><text x="370" y="253" textAnchor="middle">ลำดับการบันทึก (ID)</text>
   </svg>
   {!values.length&&<div className="chart-note">ไม่มีค่าของเซ็นเซอร์นี้ในช่วงที่เลือก</div>}
   {selected&&<div className="point-details">{metrics.map(metric=><div key={metric.key}><span>{metric.label}</span><strong>{formatValue(selected[metric.key])} <small>{metric.unit}</small></strong></div>)}</div>}
   <div className="chart-range"><label>เริ่ม: ID {rows[start]?.id}<input type="range" min={0} max={last} value={start} disabled={rows.length<2} onChange={e=>{const v=Number(e.target.value);setRange([v,Math.max(v,end)]);}} aria-label="จุดเริ่มต้นช่วงกราฟ"/></label><label>สิ้นสุด: ID {rows[end]?.id}<input type="range" min={0} max={last} value={end} disabled={rows.length<2} onChange={e=>{const v=Number(e.target.value);setRange([Math.min(start,v),v]);}} aria-label="จุดสิ้นสุดช่วงกราฟ"/></label></div>
   <div className="chart-navigation"><button disabled={start===0} onClick={()=>pan(-Math.max(1,Math.floor(visible.length/2)))}>← ช่วงก่อนหน้า</button><span>{visible.length} / {rows.length} รายการ</span><button disabled={end===last} onClick={()=>pan(Math.max(1,Math.floor(visible.length/2)))}>ช่วงถัดไป →</button></div>
   <div className="range-stats"><span>ต่ำสุด <b>{formatValue(stats?.min)}</b></span><span>เฉลี่ย <b>{formatValue(stats?.avg)}</b></span><span>สูงสุด <b>{formatValue(stats?.max)}</b></span><small>เฉพาะช่วงที่เลือก {unit&&`(${unit})`}</small></div>
  </>:<div className="chart-empty">ยังไม่มีข้อมูลสำหรับกราฟ</div>}
 </div>;
}
