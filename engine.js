export const KEY = 'travel_raven_v1';
export const PLACES = [
  {id:'forest',name:'苔藓森林',gift:'一颗圆圆的松果',icon:'🌲',tags:['quiet','nature'],scene:'forest'},
  {id:'port',name:'雨天港口',gift:'一枚磨亮的贝壳',icon:'⛵',tags:['adventure','quiet'],scene:'sea'},
  {id:'books',name:'巷尾旧书店',gift:'夹着干花的书签',icon:'📚',tags:['curious','quiet'],scene:'town'},
  {id:'market',name:'晨光集市',gift:'一小袋烤栗子',icon:'🌻',tags:['social','food'],scene:'town'},
  {id:'mountain',name:'山间小屋',gift:'一片带着木香的落叶',icon:'⛰️',tags:['adventure','nature'],scene:'mountain'},
  {id:'lake',name:'月光湖畔',gift:'一颗银灰色小石头',icon:'🌙',tags:['quiet','romantic'],scene:'sea'},
  {id:'garden',name:'花园茶屋',gift:'一包香甜的花茶',icon:'🌷',tags:['romantic','social'],scene:'forest'},
  {id:'station',name:'远方小车站',gift:'一张旧车票',icon:'🚂',tags:['adventure','curious'],scene:'town'},
];
export const DEFAULT_PROFILE = {summary:'一只把你的角色习惯藏在羽毛里的小乌鸦。',adventure:0.5,affection:0.5,sociability:0.5,curiosity:0.5,voice:'温柔',likes:['quiet'],color:'#829477',source:'关键词初读'};
const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
export function cardText(card) {
  const d=card?.data||card||{};
  return [card?.name,d.name,d.description,d.personality,d.scenario,d.mes_example,card?.description,card?.personality].filter(Boolean).join('\n').slice(0,24000);
}
export function inferProfile(text='') {
  const p=structuredClone(DEFAULT_PROFILE);
  if (/冒险|旅行|自由|勇敢|adventur|brave|wander/i.test(text)) p.adventure=.85;
  if (/宅|懒|慵懒|怕生|homebody|lazy|timid/i.test(text)) p.adventure=.25;
  if (/温柔|黏人|亲切|体贴|affection|gentle|caring/i.test(text)) p.affection=.85;
  if (/冷淡|冷漠|傲娇|孤僻|aloof|cold|tsundere/i.test(text)) {p.affection=.3;p.voice='含蓄';}
  if (/活泼|外向|热情|开朗|social|outgoing|cheerful/i.test(text)) {p.sociability=.85;p.voice='活泼';}
  if (/内向|寡言|安静|introvert|quiet|reserved/i.test(text)) p.sociability=.2;
  if (/好奇|学者|读书|研究|curious|scholar|book/i.test(text)) p.curiosity=.85;
  p.likes=[];
  if(p.adventure>.6)p.likes.push('adventure');
  if(p.sociability>.6)p.likes.push('social');
  if(p.sociability<.4)p.likes.push('quiet');
  if(p.curiosity>.6)p.likes.push('curious');
  if(/自然|森林|花草|nature|forest/i.test(text))p.likes.push('nature');
  if(/浪漫|恋|romantic/i.test(text))p.likes.push('romantic');
  if(/美食|吃货|食物|food/i.test(text))p.likes.push('food');
  if(!p.likes.length)p.likes=['quiet'];
  p.summary=`${p.adventure>.6?'爱远行':p.adventure<.4?'喜欢守着窝':'偶尔出门'}、${p.affection>.6?'亲近你':p.affection<.4?'不太坦率':'慢慢熟悉你'}的小乌鸦。`;
  p.color=p.voice==='含蓄'?'#758396':p.voice==='活泼'?'#b78a62':'#829477';
  return p;
}
export function validateProfile(raw) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('人设结果不是对象');
  const p=structuredClone(DEFAULT_PROFILE);
  for(const k of ['adventure','affection','sociability','curiosity']) {
    if(typeof raw[k]!=='number'||!Number.isFinite(raw[k]))throw Error(`人设缺少 ${k}`);
    p[k]=clamp(raw[k]);
  }
  p.summary=String(raw.summary||p.summary).slice(0,180);
  p.voice=['温柔','含蓄','活泼'].includes(raw.voice)?raw.voice:'温柔';
  p.likes=Array.isArray(raw.likes)?raw.likes.filter(x=>['quiet','nature','adventure','curious','social','food','romantic'].includes(x)).slice(0,7):['quiet'];
  p.color=/^#[0-9a-f]{6}$/i.test(raw.color||'')?raw.color:p.color;
  p.source='模型读取';
  return p;
}
export function parseJSON(text) {
  const str=String(text).replace(/<think>[\s\S]*?<\/think>/gi,'');
  const start=str.indexOf('{'),end=str.lastIndexOf('}');
  if(start<0||end<=start)throw Error('模型没有返回有效 JSON');
  return JSON.parse(str.slice(start,end+1));
}
export function createRaven(name,profile=DEFAULT_PROFILE) {
  return {version:1,name,profile:structuredClone(profile),turn:0,mode:'home',homeTurns:0,trip:null,hunger:70,bond:15,packed:false,lastAction:{},cards:[],gifts:[],logs:[{turn:0,text:'小乌鸦搬进了鸟窝。'}],lastText:'它在窝里整理羽毛，偷偷看了你一眼。',customImage:null};
}
function log(s,text){s.lastText=text;s.logs.unshift({turn:s.turn,text});s.logs=s.logs.slice(0,60);}
function pick(items,rng){return items[Math.min(items.length-1,Math.floor(rng()*items.length))];}
export function choosePlace(p,rng=Math.random) {
  const list=PLACES.flatMap(x=>Array(1+x.tags.filter(t=>p.likes.includes(t)).length*3).fill(x));
  return structuredClone(pick(list,rng));
}
export function postcard(s,place) {
  const voice=s.profile.voice;
  const text=voice==='含蓄'?`路过${place.name}。这里还行。看到${place.gift}，顺便给你带一个。别多想。`:voice==='活泼'?`我到${place.name}啦！这里好有意思！发现了${place.gift}，给你留着，等我回家！`:`在${place.name}停了一会儿。风很轻，想起你了。找到${place.gift}，回去放在你手心里。`;
  return {id:`${s.turn}-${s.cards.length}`,turn:s.turn,place:place.name,scene:place.scene,icon:place.icon,text,ai:false};
}
export function advance(s,rng=Math.random) {
  s.turn++;s.hunger=clamp(s.hunger-5,0,100);
  if(s.mode==='away'&&s.trip) {
    s.trip.elapsed++;
    if(!s.trip.sent && s.trip.elapsed>=Math.ceil(s.trip.duration/2)) {
      s.trip.sent=true;s.cards.unshift(postcard(s,s.trip.place));s.cards=s.cards.slice(0,80);
      log(s,`从${s.trip.place.name}寄来一张明信片。`);
    } else log(s,`还在${s.trip.place.name}旅行。也许正在${s.profile.curiosity>.6?'研究路边的新鲜事物':'慢悠悠地散步'}。`);
    if(s.trip.elapsed>=s.trip.duration) {
      const place=s.trip.place;
      s.gifts.unshift({turn:s.turn,name:place.gift,place:place.name,icon:place.icon});s.gifts=s.gifts.slice(0,120);
      s.mode='home';s.trip=null;s.homeTurns=0;
      log(s,`回家了！带回${place.gift}，在窝边轻轻放下。`);
    }
    return;
  }
  s.homeTurns++;
  const chance=.12+s.profile.adventure*.32+(s.packed?.18:0);
  if(s.homeTurns>=2&&s.hunger>=20&&rng()<chance) {
    const place=choosePlace(s.profile,rng);
    s.trip={place,duration:3+Math.floor(rng()*4)+(s.profile.adventure>.7?1:0),elapsed:0,sent:false};
    s.mode='away';s.packed=false;log(s,`背起小包，飞向${place.name}。窝里留着一点温暖。`);
  } else log(s,pick(s.profile.voice==='含蓄'?['它站在窝边，假装没有等你。','它把一颗亮石头悄悄推到你这边。']:['它在窝里打了个小盹。','它认真整理羽毛，又抬头看看你。','它把窝边的树叶摆得整整齐齐。'],rng));
}
export function interact(s,action) {
  if(s.mode!=='home')return '它还没回家。先看看远方的明信片吧。';
  if(!['feed','pet','pack'].includes(action))return '它歪了歪头。';
  if(s.lastAction[action]===s.turn)return '这一轮已经做过啦，聊一轮再来看看它。';
  s.lastAction[action]=s.turn;
  if(action==='feed'){s.hunger=clamp(s.hunger+25,0,100);s.bond=clamp(s.bond+3,0,100);log(s,s.profile.voice==='含蓄'?'它慢慢啄完食物，留下最好的一粒在你手边。':'它开心地啄了几口，尾巴轻轻翘起来。');}
  if(action==='pet'){s.bond=clamp(s.bond+2+Math.round(s.profile.affection*3),0,100);log(s,s.profile.affection<.4?(s.bond>45?'它嘴上不愿意，身体却悄悄往你手里靠。':'它偏过头，却没有躲开你的手。'):'它把毛茸茸的脑袋塞进你的手心。');}
  if(action==='pack'){s.packed=true;log(s,'你放好小点心和护身符。它会自己决定什么时候出发。');}
  return s.lastText;
}
export function turnToken(chat,messageId) {
  const m=chat[messageId];
  if(!m||m.is_user||m.is_system||!String(m.mes||'').trim())return null;
  for(let i=messageId-1;i>=0;i--){if(chat[i]?.is_user&&!chat[i]?.is_system)return `${i}:${String(chat[i].send_date||'')}`;}
  return null;
}
