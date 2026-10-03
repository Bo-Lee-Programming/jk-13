import {Adventure} from '../src/rainweaver.js';
globalThis.addEventListener=()=>{};
export const saved=new Map();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,String(v))},configurable:true});
export function create(){let handlers={};globalThis.addEventListener=(type,fn)=>handlers[type]=fn;const el=()=>({textContent:'',classList:{add(){},remove(){}},innerHTML:''});let g=new Adventure({loft(){return 0},mesh(){return 0}}, {},{hp:el(),count:el(),hint:el(),location:el(),panel:el()});g.handlers=handlers;return g}
export function route(mode='high',verbose=false){let g=create();g.start();let released=-1,log=[];for(let i=0;i<120*45&&g.state===1;i++){let p=g.p;g.keys.KeyD=1;if(p.ground>0&&p.x<94)g.jumpBuffer=.12;if(g.link){let q=g.link.q;if(p.x>q.x+g.link.length*(typeof mode==='number'?mode:mode==='high'?.65:.58)&&p.vy>0){g.release();released=i}}else if(i-released>18&&p.ground<=0&&p.vy<5&&p.x<94){let q=g.candidate();if(q&&q.x>p.x+.5)g.weave()}g.update(1/120);if(i%120===0)log.push([i/120,+p.x.toFixed(1),+p.y.toFixed(1),g.link?.q.id,g.falls]);}if(verbose)console.log(log);return g}
if(process.argv[1]?.endsWith('rain-route.mjs')){for(let mode of['high','low']){let g=route(mode,true);console.log(mode,{state:g.state,x:g.p.x,time:g.elapsed,falls:g.falls,chain:g.bestChain})}}
