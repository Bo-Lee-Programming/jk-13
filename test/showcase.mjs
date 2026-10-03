// Run the exact browser input policy without booting its DOM/rendering harness.
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./showcase.js',import.meta.url),'utf8');
const start=source.indexOf('export function pilotInput'),end=source.indexOf('// End pilot.',start);
if(start<0||end<0)throw Error('Showcase pilot source marker is missing');
const pilotInput=Function('return ('+source.slice(start,end).replace(/^export /,'')+')')();

if(typeof process!=='undefined'&&process.argv[1]?.endsWith('showcase.mjs')){
 const {default:assert}=await import('node:assert/strict');
 const {create}=await import('./rain-route.mjs');
 function run(paused){
  const game=create(),held={};let released=-99,landAt=0,firstCatch=null,landings=0;
  game.start();
  function event(code,on){game.handlers[on?'keydown':'keyup']({code,repeat:false,preventDefault(){}})}
  function key(code,on){if(!!held[code]===on)return;held[code]=on;event(code,on)}
  for(let tick=0;tick<1800;tick++){
   if(paused&&(tick===360||tick===900)){
    event('Escape',true);assert.equal(game.state,2);
    const before=[game.time,game.elapsed,game.p.x,game.p.y,game.storm];
    for(let j=0;j<120;j++)game.update(1/120);
    assert.deepEqual([game.time,game.elapsed,game.p.x,game.p.y,game.storm],before);
    event('Escape',true);assert.equal(game.state,1);
   }
   released=pilotInput(game,key,held,tick,released,landAt);
   if(game.link&&firstCatch===null)firstCatch=tick/120;
   if(tick<=84){assert.equal(game.link,null);assert.equal(game.p.y,.52)}
   const grounded=game.p.ground>0;game.update(1/120);
   assert.equal(game.state,1,`Demo failed at ${tick/120} s`);
   if(!grounded&&game.p.ground>0){landAt=tick/120;if(tick>24)landings++}
  }
  assert(firstCatch>.7);assert(landings>=1);assert(Math.abs(game.elapsed-15)<1e-8);
  return{seconds:game.elapsed,x:game.p.x,y:game.p.y,firstCatch,landings};
 }
 const plain=run(false),paused=run(true);assert.deepEqual(paused,plain);
 console.log('PASS: 0.7 s grounded opening, delayed first catch, complete 15 s flight, landings, pause/resume determinism');
 console.log(plain);
}
