export function windowRange(total, count, center) {
 if(total < 1) return [0,0];
 const size=Math.min(total,Math.max(1,Math.round(count)));
 const start=Math.max(0,Math.min(total-size,Math.round(center-(size-1)/2)));
 return [start,start+size-1];
}
export function shiftRange(total,start,end,offset) {
 const nextStart=Math.max(0,Math.min(total-(end-start+1),start+Math.round(offset)));
 return [nextStart,nextStart+end-start];
}
