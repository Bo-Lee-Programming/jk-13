const ivory=[.76,.86,.8],gold=[1,.74,.35],colors=[[.06,.34,.36],[.17,.65,.65],[.6,.92,.82]];
export class Character{
 constructor(r){
  this.body=r.loft([[-.65,.15,0,.015],[-.46,.14,0,.24],[-.1,.14,0,.27],[.23,.24,0,.24],[.34,.5,0,.17],[.42,.73,0,.18],[.61,.78,0,.17],[.78,.68,0,.09],[.94,.67,0,.015]],12,.8);
  this.leg=r.loft([[0,0,0,.073],[.015,-.4,0,.055],[0,-1,0,.033]],8,.8);
  this.hornMesh=r.loft([[0,0,0,.065],[.04,.23,0,.033],[.12,.51,0,.001]],10);
  this.ear=r.loft([[0,0,0,.06],[-.035,.17,0,.067],[-.04,.36,0,.001]],8,.38);
  this.mane=r.loft([[.45,.87,0,.018],[.23,.76,0,.09],[.15,.51,0,.095],[-.12,.32,0,.07],[-.3,.31,0,.001]],10,.35);
  this.tail=r.loft([[0,0,0,.025],[-.28,.09,0,.105],[-.61,.03,0,.095],[-.9,-.12,0,.06],[-1.2,-.05,0,.001]],10,.4);
 }
 horn(p){let c=Math.cos(this.lean||0),s=Math.sin(this.lean||0);return[p.x+p.face*(.67*c-1.33*s),p.y+(.67*s+1.33*c)*(1-(this.squash||0))+(this.bob||0),0]}
 draw(r,p,time,steps,linked){
  let dt=Math.max(0,Math.min(.05,time-(this.time??time))),ground=!!p.ground;
  if(this.actor!==p){this.actor=p;this.squash=0;this.ground=ground}
  if(dt){this.squash=Math.max(0,this.squash-dt*1.4);if(ground&&!this.ground)this.squash=Math.min(.17,.04+Math.abs(this.vy||0)*.01);this.ground=ground;this.vy=p.vy}
  this.time=time;
  let f=p.face||.001,run=Math.min(1,Math.abs(p.vx)/6),phase=steps*2.5,lean=this.lean=ground?Math.sin(phase*2)*run*.025:Math.max(-.28,Math.min(.28,p.vy*.016)),bob=this.bob=ground?Math.abs(Math.sin(phase))*run*.045+Math.sin(time*2.7)*.008:0,c=Math.cos(lean),s=Math.sin(lean),sy=1-this.squash;
  const at=(x,y,z=0)=>[p.x+f*(x*c-y*s),p.y+(x*s+y*c)*sy+bob,z],part=(mesh,x,y,z,sx,sz,col,e=0,angle=0)=>r.shape(mesh,at(x,y,z),[f*sx,sy,sz],col,e,f*(lean+angle));
  part(this.body,0,0,0,1,1,ivory);
  for(let side of[-1,1])for(let end of[-1,1]){
   let a=phase+(side<0?Math.PI:0)+(end<0?1.5:0),tuck=linked?.85:Math.max(0,Math.min(1,(p.vy+6)/13)),hip=[end*.33,.09],foot=[end*.33+(ground?Math.sin(a)*run*.3:end*tuck*.2),ground?-.51+Math.max(0,Math.cos(a))*run*.2:-.51+tuck*.29],dx=foot[0]-hip[0],dy=foot[1]-hip[1],len=Math.hypot(dx,dy),bend=Math.sqrt(Math.max(0,.32*.32-len*len/4)),knee=[(hip[0]+foot[0])/2-dy/len*bend*end,(hip[1]+foot[1])/2+dx/len*bend*end],col=side>0?ivory:[.29,.48,.46],z=side*.17;
   for(let [a,b,w]of[[hip,knee,1],[knee,foot,.7]]){let dx=b[0]-a[0],dy=b[1]-a[1];r.shape(this.leg,at(...a,z),[f*w,Math.hypot(dx,dy)*sy,w],col,0,f*(lean+Math.atan2(dx,-dy)))}
   r.ball(...at(...foot,z),.066,.043,.057,[.14,.32,.3],.1,f*lean);
  }
  part(this.hornMesh,.55,.82,0,1,1,gold,1.2);
  for(let side of[-1,1])part(this.ear,.36,.85,side*.13,1,1,ivory,0,-.27+Math.sin(time*2+side)*.045);
  let blink=Math.min(1,Math.abs((time+1)%4.6-2.3)*14);
  r.ball(...at(.65,.81,.155),.043,.055*blink+.002,.023,[.01,.03,.028]);r.ball(...at(.662,.83,.176),.011,.014*blink,.008,[.8,1,.93],.4);
  for(let j=0;j<3;j++){
   part(this.mane,-j*.025,0,j*.055-.05,1,1,colors[j],j*.2,Math.sin(time*4-j)*.02);
   part(this.tail,-.53,.23,j*.055-.05,1+j*.1,1,colors[j],j*.2,Math.sin(time*5-j*.6)*.1-p.vy*.016);
  }
 }
}
