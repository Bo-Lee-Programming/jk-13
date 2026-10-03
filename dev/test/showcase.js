import {Renderer} from '../src/renderer3d.js';
import {Adventure} from '../src/rainweaver.js';
import * as audio from '../src/score.js';

// Shared input policy. The Node regression executes this exact function from source.
export function pilotInput(game,key,held,tick,released,landAt){
 const p=game.p,t=tick/120;
 for(const code of['KeyD','Space','KeyE'])if(held[code]&&!game.keys[code])held[code]=false;
 key('KeyD',true);
 // Re-establish a held tether after pause; release the key after automatic obstruction breaks.
 key('KeyE',!!game.link);
 if(p.ground&&t>.7&&t-landAt>.3)key('Space',true);
 if(p.vy<=0||game.link)key('Space',false);
 if(game.link){
  if(p.x>game.link.q.x+game.link.length*.56&&p.vy>0){key('KeyE',false);released=tick}
 }else if(t>.7&&tick-released>18&&p.ground<=0&&p.vy<5){
  const q=game.candidate();if(q&&q.x>p.x+.5)key('KeyE',true);
 }
 return released;
}
// End pilot.

const $=id=>document.getElementById(id),panel=$('panel');
if(location.hash==='#debug')document.body.dataset.debug='true';
let renderer;
try{renderer=new Renderer($('c'))}
catch(e){panel.classList.remove('hide');panel.innerHTML='<div class="card"><h1>WebGL2 is needed.</h1><p>Please open this page in a browser with hardware acceleration.</p></div>';throw e}
const game=new Adventure(renderer,audio,{panel,hp:$('hp'),count:$('count'),location:$('location'),hint:$('hint')});
let mode='ready',tick=0,released=-99,landAt=0,landings=0,held={},synthetic=false,accumulator=0;
const originalSave=game.save.bind(game);
// Demonstration distances never enter the player's saved leaderboard.
game.save=()=>{if(mode==='manual')originalSave()};
const setMode=value=>{mode=value;document.body.dataset.mode=value};
setMode('ready');

function key(code,on){
 if(!!held[code]===on)return;
 held[code]=on;synthetic=true;
 dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));
 synthetic=false;
}
function clearInput(){for(const code in held)if(held[code])key(code,false);held={}}
function begin(demo){
 clearInput();setMode(demo?'demo':'manual');tick=0;released=-99;landAt=0;landings=0;accumulator=0;
 // A reset establishes the initial state. The flight itself uses only normal input events.
 game.reset();game.time=0;game.start();$('end').classList.add('hide');
 $('watch').disabled=demo;$('watch').textContent='Replay';
 $('timeline').classList.toggle('hide',!demo);
 $('chapter').textContent=demo?'01 / Wake in the grove':'Find your own rhythm.';
 $('description').textContent=demo?'A little momentum. A leap into the light.':'A / D move · Space jump · Hold E or mouse to catch · Release to fly · R restart · Esc pause · M sound';
 $('progress').value=0;$('clock').textContent='00.0 / 15.0';
}
$('watch').onclick=()=>begin(true);
$('play').onclick=$('try').onclick=()=>begin(false);
panel.onclick=()=>{if(game.state===2)game.start();else if(game.state===0||game.state===3)begin(false)};
if($('full'))$('full').onclick=()=>{const action=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();action?.catch(()=>{})};
for(const el of[document.querySelector('nav'),$('end'),$('full')].filter(Boolean))for(const type of['pointerdown','pointerup'])el.addEventListener(type,e=>e.stopPropagation());

// Real user movement cannot accidentally perturb the authored input-only demonstration.
// Esc and M still use the game's own pause and sound handlers; R enters a fresh manual run.
for(const type of['keydown','keyup'])addEventListener(type,e=>{
 if(synthetic||e.code==='Tab')return;
 // Keep native button activation; it must not double as jump / restart input.
 if(e.target.closest?.('button')&&(e.code==='Enter'||e.code==='Space')){e.stopImmediatePropagation();return}
 if(mode==='manual')return;
 if(e.code==='KeyM'||(mode==='demo'&&e.code==='Escape'))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(type==='keydown'&&!e.repeat&&(e.code==='KeyR'||e.code==='Space'))begin(false);
},true);
for(const type of['pointerdown','pointerup'])addEventListener(type,e=>{
 if(e.target.closest('nav,#end,#full')||mode==='manual')return;
 if(mode==='demo'&&game.state===2)return;
 e.stopImmediatePropagation();
 if(type==='pointerdown'&&mode!=='demo'&&e.button===0)begin(false);
},true);

function pilot(){
 released=pilotInput(game,key,held,tick,released,landAt);
}
function complete(){
 clearInput();setMode('complete');game.pause();panel.classList.add('hide');
 $('watch').disabled=false;$('end').classList.remove('hide');
 $('chapter').textContent='One flight. Endless possibilities.';
 $('description').textContent=`${Math.floor(game.wake)} metres · ${landings} landings · Real-time light, animation and sound. No recorded footage.`;
 $('progress').value=15;$('clock').textContent='15.0 / 15.0';
}
function simulate(){
 if(mode==='demo'&&game.state===1){
  pilot();const grounded=game.p.ground>0;game.update(1/120);tick++;
  if(!grounded&&game.p.ground>0){landAt=(tick-1)/120;if(tick>24)landings++}
  if(tick>=1800&&game.state===1)complete();
 }else game.update(1/120);
 if(mode==='demo'&&game.state===3){clearInput();setMode('interrupted');$('watch').disabled=false;$('chapter').textContent='Every flight has its edge.';$('description').textContent='Replay the sample or start your own run.'}
}
let previous=performance.now(),sample=previous,frames=0,renderTime=0;
function frame(now){
 accumulator+=Math.min(.1,(now-previous)/1000);previous=now;
 while(accumulator>=1/120){simulate();accumulator-=1/120}
 const renderStart=performance.now();game.render();renderTime+=performance.now()-renderStart;frames++;
 if(mode==='demo'){
  const t=tick/120;$('progress').value=t;$('clock').textContent=t.toFixed(1).padStart(4,'0')+' / 15.0';
  $('chapter').textContent=game.state===2?'Stillness / Esc to resume':t<.7?'01 / Wake in the grove':t<2?'02 / Leap. Catch. Let go.':t<6?'03 / Borrow the branches':t<10?'04 / Touch down. Rise again.':'05 / A thread through the dark';
  $('description').textContent=game.state===2?'The flight and its fifteen-second clock are paused.':game.link?'Hold a living thread. Carry the arc into the next leap.':game.p.ground?'Let the landing breathe. Gather yourself for another leap.':'Release the branch. Keep the momentum.';
 }
 $('status').textContent=mode==='ready'?'LIVE WEBGL2':mode==='manual'?`${Math.floor(game.wake)} M · ENDLESS FLIGHT`:`${Math.floor(game.wake)} M · ${landings} LANDINGS`;
 if(now-sample>=1000){$('fps').innerHTML=Math.round(frames*1000/(now-sample))+' FPS'+(document.hidden?' · BACKGROUND':'')+'<br>'+(renderTime/frames).toFixed(1)+' ms render · WEBGL '+renderer.g.getError();frames=0;renderTime=0;sample=now}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
