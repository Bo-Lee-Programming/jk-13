import {Renderer} from './renderer3d.js';
import {Adventure} from './rainweaver.js';
import * as audio from './score.js';

const $=id=>document.getElementById(id),ui={panel:$('panel'),hp:$('hp'),count:$('count'),location:$('location'),hint:$('hint')};
let renderer;
try{renderer=new Renderer($('c'))}catch(e){ui.panel.innerHTML='<div><h1>WEBGL2 NEEDED</h1><p>'+e.message+'</p></div>';throw e}
const game=new Adventure(renderer,audio,ui);let last=performance.now(),acc=0;
function frame(now){let d=Math.min(.1,(now-last)/1000);last=now;acc+=d;while(acc>=1/120){game.update(1/120);acc-=1/120}game.render();requestAnimationFrame(frame)}
requestAnimationFrame(frame);
