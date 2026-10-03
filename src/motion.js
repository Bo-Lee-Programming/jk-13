export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
import {platforms} from './course.js';
export {platforms,anchors} from './course.js';
export const ground=x=>Math.max(-30,...platforms.filter(q=>x>=q[0]&&x<=q[1]).map(q=>q[2]));
export function body(x,y){return{x,y,z:0,px:x,py:y,vx:0,vy:0,r:.52,ground:0}}
export function visible(p,q){for(let i=1;i<20;i++){let t=i/20,x=p.x+(q.x-p.x)*t,y=p.y+.6+(q.y-p.y-.6)*t;for(let [a,b,h]of platforms)if(x>a&&x<b&&y<h&&y>h-2)return false}return true}
export function contacts(p){for(let [a,b,y]of platforms){let bottom=y-2;if(p.x>=a&&p.x<=b){if(p.py-p.r>=y-.025&&p.y-p.r<=y&&p.vy<=0){p.y=y+p.r;p.vy=0;p.ground=.1}else if(p.py+p.r<=bottom&&p.y+p.r>bottom&&p.vy>0){p.y=bottom-p.r;p.vy=0}}if(p.y+p.r>bottom+.1&&p.y-p.r<y-.025){if(p.px+p.r<=a&&p.x+p.r>a){p.x=a-p.r;p.vx=Math.min(0,p.vx)}else if(p.px-p.r>=b&&p.x-p.r<b){p.x=b+p.r;p.vx=Math.max(0,p.vx)}}}}
export function integrate(p,dt){p.px=p.x;p.py=p.y;p.ground=Math.max(0,p.ground-dt);p.vy-=18*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;contacts(p)}
export function tether(p,a,len){let dx=p.x-a.x,dy=p.y-a.y,l=Math.hypot(dx,dy);if(l<=len||l<1e-7)return 0;let nx=dx/l,ny=dy/l,out=p.vx*nx+p.vy*ny;p.x=a.x+nx*len;p.y=a.y+ny*len;if(out>0){p.vx-=nx*out;p.vy-=ny*out}return l-len}
