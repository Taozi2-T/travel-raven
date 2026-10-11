import test from 'node:test';
import assert from 'node:assert/strict';
import {createRaven,inferProfile,advance,interact,turnToken,validateProfile,parseJSON,choosePlace,DEFAULT_PROFILE} from '../engine.js';
test('完整旅行：至少在家两轮，途中寄信，回家带礼物',()=>{
  const s=createRaven('角色',inferProfile('勇敢冒险 温柔'));
  advance(s,()=>0);assert.equal(s.mode,'home');
  advance(s,()=>0);assert.equal(s.mode,'away');const duration=s.trip.duration;
  for(let i=0;i<duration;i++)advance(s,()=>0);
  assert.equal(s.mode,'home');assert.equal(s.trip,null);assert.equal(s.cards.length,1);assert.equal(s.gifts.length,1);assert.equal(s.turn,duration+2);
});
test('行为由人设改变，同一随机值下宅角色留家，冒险角色出门',()=>{
  const a=createRaven('a',inferProfile('勇敢冒险')),b=createRaven('b',inferProfile('宅 慵懒'));
  advance(a,()=>.3);advance(b,()=>.3);advance(a,()=>.3);advance(b,()=>.3);
  assert.equal(a.mode,'away');assert.equal(b.mode,'home');
});
test('互动每轮每种一次、旅行中禁止互动，数值有界',()=>{
  const s=createRaven('a');s.hunger=95;
  interact(s,'feed');assert.equal(s.hunger,100);const bond=s.bond;
  interact(s,'feed');assert.equal(s.bond,bond);interact(s,'pet');assert.ok(s.bond>bond);
  s.mode='away';const old=s.bond;interact(s,'pet');assert.equal(s.bond,old);
});
test('同一个用户轮次的重生成/续写得到相同标记，开场白不计轮次',()=>{
  const chat=[{mes:'开场白'},{is_user:true,send_date:'a',mes:'你好'},{mes:'回复'},{mes:'续写'}];
  assert.equal(turnToken(chat,0),null);assert.equal(turnToken(chat,2),turnToken(chat,3));
  chat.push({is_user:true,send_date:'b',mes:'再聊'},{mes:'回复2'});assert.notEqual(turnToken(chat,2),turnToken(chat,5));
  assert.equal(turnToken(chat,1),null);assert.equal(turnToken([...chat,{mes:'',is_system:false}],6),null);
});
test('模型输出验证与回退：拒绝缺失、非数字；约束颜色与偏好',()=>{
  assert.throws(()=>validateProfile({adventure:'abc'}));
  const p=validateProfile({...DEFAULT_PROFILE,adventure:5,likes:['bad','nature'],color:'url(javascript:evil)'});
  assert.equal(p.adventure,1);assert.deepEqual(p.likes,['nature']);assert.match(p.color,/^#[a-f0-9]{6}$/i);
  assert.deepEqual(parseJSON('<think>test</think>```json\n{"ok":1}\n```'),{ok:1});assert.throws(()=>parseJSON('not json'));
});
test('长期推进收藏有界，所有旅行最终结束，不会耗尽食物后永久离家',()=>{
  const s=createRaven('a');for(let i=0;i<3000;i++){if(s.mode==='home')interact(s,'feed');advance(s,()=>0);}
  assert.ok(s.cards.length<=80);assert.ok(s.gifts.length<=120);assert.ok(s.logs.length<=60);assert.ok(s.hunger>=0&&s.hunger<=100);
});
test('目的地偏好真的改变选择权重',()=>{
  const p={...DEFAULT_PROFILE,likes:['food']};let count=0;for(let i=0;i<1000;i++)if(choosePlace(p,()=>i/1000).id==='market')count++;
  assert.ok(count>300);
});
