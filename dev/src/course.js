export const platforms=[],anchors=[],flowers=[],hazards=[];
const land=[[-5,8,0],[18,24,1],[35,41,1],[48,52,7.5],[49,57,-1.8],[68,74,-3.5],[98,110,1]],buds=[[7,6],[15,8],[26,9],[34,8],[44,10],[53,11],[59,5.8],[64,10],[62,3.3],[73,6.5],[82,8],[90,10]];
export const random=n=>{let v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v)};
let next=0;
export function resetCourse(){for(let a of[platforms,anchors,flowers,hazards])a.length=0;next=0;extend(0)}
export function extend(x){let until=Math.floor((x+150)/112);while(next<=until){let n=next++,off=n*112,d=Math.min(1,n/10),height=n?Math.round(random(n)*2)-1:0;for(let [i,[a,b,y]]of land.entries()){let cut=i===1||i===2||i===4?d*1.7:0;platforms.push([a+off+cut,b+off-cut,y+height])}for(let [i,[a,b]]of buds.entries())anchors.push({x:a+off,y:b+height,z:0,id:n*12+i,ttl:n>1&&i%4===2?2.1-d*.65:0,broken:false});for(let [a,b]of[[12,3],[30,6],[49,10],[65,2],[86,8]])flowers.push({x:a+off,y:b+height,lit:false});if(n>0)for(let i=0;i<(n>3?2:1);i++)hazards.push({x:off+(i?79:30),y:0,base:(i?5:2.5)+height,phase:n*1.7+i,r:.55+d*.25,amp:1+d,speed:1+d*.65})}for(let a of[platforms,anchors,flowers,hazards])while(a.length&&(Array.isArray(a[0])?a[0][1]:a[0].x)<x-65)a.shift()}
resetCourse();
