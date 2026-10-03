import assert from 'node:assert/strict';
import {Character} from '../src/character.js';
import {Grove} from '../src/grove.js';
import {create} from './rain-route.mjs';

let calls=[],geometry=[],count=0;
const finite=a=>{for(const x of a.flat(Infinity))if(typeof x==='number')assert(Number.isFinite(x))};
const r={
 loft(points){finite(points);return count++},
 mesh(data){finite(data);geometry.push(data);return count++},
 shape(...args){finite(args);calls.push(args)},
 ball(...args){finite(args);calls.push(args)},branch(...args){finite(args);calls.push(args)},
 box(...args){finite(args)},glow(...args){finite(args)},
};
new Grove(r);
let top=0;
for(const data of geometry)for(let i=0;i<data.length;i+=18){
 if([1,7,13].every(j=>Math.abs(data[i+j])<1e-8)){
  assert(data[i+4]>.99,'grass faces must point upward, not into the island');top++;
 }
}
assert(top>0);
const actor=new Character(r);
for(let i=0;i<300;i++){
 let p={x:3,y:2,face:i%2?1:-1,ground:i%3?0:.1,vx:Math.sin(i)*18,vy:Math.cos(i)*18};
 calls=[];actor.draw(r,p,i/60,i*.2,i%4===0);finite(actor.horn(p));
 const before=JSON.stringify(calls);calls=[];
 actor.draw(r,p,i/60,i*.2,i%4===0);
 assert.equal(JSON.stringify(calls),before,'paused animation must not advance');
}
let game=create();game.start();
for(let i=0;i<60;i++){game.burst(1,1,[.2,1,1],8);game.update(1/120)}
assert(game.particles.length<=100);assert(game.pulses.length<=12);
game.pause();const pulses=JSON.stringify(game.pulses);game.update(1);
assert.equal(JSON.stringify(game.pulses),pulses);
game.respawn();assert.equal(game.pulses.length,0);assert.equal(game.particles.length,0);
game.state=0;game.handlers.keydown({code:'Tab'});assert.equal(game.state,0);
game.start();game.weave();let tether=game.link;game.pause();
game.handlers.keydown({code:'KeyD'});assert.deepEqual(game.keys,{});
game.handlers.keydown({code:'Enter'});assert.equal(game.state,1);assert.equal(game.link,tether);assert.equal(game.jumpBuffer,0);
game.p.vy=5;game.jumpCut=true;game.pause();game.handlers.keydown({code:'Space',preventDefault(){}});assert.equal(game.state,1);assert.equal(game.link,tether);assert.equal(game.jumpBuffer,0);game.handlers.keyup({code:'Space'});assert.equal(game.p.vy,5);
calls=[];game.ring(r,0,0,1,[1,1,1],1,1,.5);assert.equal(calls.length,12);
calls=[];game.ring(r,0,0,1,[1,1,1],1,1,0);assert.equal(calls.length,0);
console.log('Polish checks passed: upward terrain normals, 300 finite/frozen character poses, bounded and pause-safe effects.');
