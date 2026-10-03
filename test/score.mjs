import assert from 'node:assert/strict';
let ctx,ended=[],peak=0,active=0,notes=0,holds=0,cancels=0,sources=[];
class Parameter {
  constructor(){this.value=1;this.sets=[]}
  cancelScheduledValues(t){assert.ok(Number.isFinite(t));this.value=1;cancels++;return this}
  cancelAndHoldAtTime(t){assert.ok(Number.isFinite(t));assert.equal(this.value,.0001,'a cancelled future envelope must start near silence');holds++;return this}
  setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));this.sets.push([v,t]);return this}
  linearRampToValueAtTime(v,t){return this.setValueAtTime(v,t)}
  exponentialRampToValueAtTime(v,t){assert.ok(v>0,'exponential gain/frequency target must be positive');return this.setValueAtTime(v,t)}
  setTargetAtTime(v,t,tau){assert.ok(tau>0);return this.setValueAtTime(v,t)}
}
class Node {
  constructor(kind){this.kind=kind;for(let k of ['gain','frequency','detune','pan','Q','delayTime','threshold','knee','ratio'])this[k]=new Parameter()}
  connect(n){this.out=n;return n}
  disconnect(){}
  setPeriodicWave(){}
  start(t){active++;peak=Math.max(peak,active);notes++;this.startAt=t;sources.push(this)}
  stop(t){ended=ended.filter(([,node])=>node!==this);ended.push([t,this])}
}
globalThis.AudioContext=class {
  constructor(){ctx=this;this.currentTime=0;this.sampleRate=48000;this.destination=new Node()}
  createGain(){return new Node()}
  createDynamicsCompressor(){return new Node()}
  createDelay(){return new Node()}
  createBiquadFilter(){return new Node()}
  createStereoPanner(){return new Node()}
  createOscillator(){return new Node('tone')}
  createBufferSource(){return new Node()}
  createPeriodicWave(){return {}}
  createBuffer(){return {getChannelData:()=>new Float32Array(96000)}}
  resume(){this.suspended=false;return Promise.resolve()}
  suspend(){this.suspended=true;return Promise.resolve()}
};
const score=await import('../src/score.js');
const advance=dt=>{if(!ctx.suspended)ctx.currentTime+=dt;ended=ended.filter(([t,n])=>{if(t>ctx.currentTime)return true;active--;n.onended?.();return false})};
score.death();score.reset();
score.unlock();score.reset();
for(let i=0;i<120*120;i++){
  ctx.currentTime=i/120;
  ended=ended.filter(([t,n])=>{if(t>ctx.currentTime)return true;active--;n.onended?.();return false});
  score.update(1/120,12,3);
  if(i%90===0)score.fixed(i%8);
  if(i%90===45)score.recall();
  if(i%270===10)score.flower(i%8);
  if(i%100===0)score.land(i%13);
  if(i===700){score.pause(true);const before=notes;score.fixed();score.update(1,20,4);assert.equal(notes,before);score.pause(false)}
  if(i===800){score.toggleMute();const before=notes;score.fixed();score.update(1,20,4);assert.equal(notes,before);score.toggleMute()}
}
assert.ok(peak<=33,`32 transient voices plus wind, got ${peak}`);
assert.ok(notes>300,'full score and gameplay effects exercised');
for(let i=0;i<12;i++){
  score.reset();score.update(1/120,8,1);
  ctx.currentTime+=.1;
  ended=ended.filter(([t,n])=>{if(t>ctx.currentTime)return true;active--;n.onended?.();return false});
  assert.ok(active<=8,'restart must quickly retire the preceding phrase');
}
assert.ok(peak<=33);
score.reset();advance(.1);score.update(0,8,1);
const beforeDeath=notes,heldBefore=holds,oldSources=new Set(ended.map(([,n])=>n)),deathTime=ctx.currentTime;
score.death();
assert.equal(notes-beforeDeath,4,'death creates an air release and three quiet tones');
assert.equal(holds-heldBefore,oldSources.size,'death holds each existing envelope before its release');
assert.ok(ended.filter(([,n])=>oldSources.has(n)).every(([t])=>t<=deathTime+.641),'existing notes fade out within the transition');
const resolution=sources.slice(-3);
assert.deepEqual(resolution.map(n=>Math.round(12*Math.log2(n.frequency.value/146.832))),[12,7,0],'death falls through a consonant tonic and fifth');
assert.ok(resolution.every(n=>n.kind==='tone'));
const afterDeath=notes;
score.death();score.update(1,20,4);
assert.equal(notes,afterDeath,'death is idempotent and blocks the normal phrase');
advance(.3);const pausedDeathTime=ctx.currentTime,pausedDeathVoices=active;
score.pause(true);score.unlock();advance(10);score.update(10,8,1);
assert.equal(ctx.currentTime,pausedDeathTime,'pause freezes audio time even if unlock is called');
assert.equal(active,pausedDeathVoices,'long pause preserves the partially played death cue');
score.pause(false);advance(1.5);
assert.equal(active,1,'only ambient wind remains after the final resolve');
score.reset();score.update(0,8,1);
assert.equal(notes-afterDeath,5,'restart restores opening chord and melody');
score.pause(true);const pausedTime=ctx.currentTime,pausedVoices=active;advance(10);const pausedNotes=notes;score.update(10,8,1);
assert.equal(notes,pausedNotes);
score.pause(false);score.update(0,8,1);
assert.equal(ctx.currentTime,pausedTime,'pad envelopes remain frozen during a long pause');
assert.equal(active,pausedVoices);
assert.equal(notes,pausedNotes,'resume continues the existing phrase without duplicating its chord');
const hold=Parameter.prototype.cancelAndHoldAtTime;
delete Parameter.prototype.cancelAndHoldAtTime;
const fadingGains=ended.map(([,n])=>n.out.out.gain),beforeCancels=cancels;
for(const g of fadingGains)g.value=.013;
score.reset();
assert.equal(cancels-beforeCancels,fadingGains.length,'fallback cancels each active envelope');
assert.ok(fadingGains.every(g=>g.sets.some(([v,t])=>v===.013&&t===ctx.currentTime)),'fallback anchors the pre-cancellation gain');
advance(.1);assert.equal(active,1,'fallback releases all transient voices');
Parameter.prototype.cancelAndHoldAtTime=hold;
score.update(0,8,1);
assert.equal(active,6,'normal music resumes after fallback cleanup');
assert.ok(peak<=33);
console.log(`Audio graph checks passed: 120 seconds, ${notes} sources, maximum ${peak-1} transient voices; mute, pause, death resolve, restart, voice cleanup and positive envelopes valid. This is not an auditory evaluation.`);
