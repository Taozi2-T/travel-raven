import test from 'node:test';
import assert from 'node:assert/strict';
import {formatSources,collectSources,needsAutoRead} from '../lore.js';
test('世界书包含未触发条目，跳过禁用条目，去重内嵌内容',()=>{
  const r=formatSources({name:'测试',data:{personality:'温柔'}},[{world:'关联书',content:'喜欢海边',key:['未触发']},{world:'额外书',content:'研究星空'},{world:'书',content:'不应读取',disable:true},{content:'喜欢海边'},{content:'不应读取2',enabled:false}]);
  assert.equal(r.entries,2);assert.match(r.text,/喜欢海边/);assert.match(r.text,/研究星空/);assert.doesNotMatch(r.text,/不应读取/);
});
test('资料未变化不重复生成，变化触发读取，失败后有冷却',()=>{
  const s={profileRead:{hash:'a'}};assert.equal(needsAutoRead(s,'a'),false);assert.equal(needsAutoRead(s,'b'),true);
  s.profileRead.failedHash='b';s.profileRead.failedAt=1000;assert.equal(needsAutoRead(s,'b',2000),false);assert.equal(needsAutoRead(s,'b',302000),true);
});
test('超长书限制提示长度，截取以外的更新仍改变签名',()=>{
  const a=formatSources({},[{content:'abcdef'}],3),b=formatSources({},[{content:'abcXYZ'}],3);
  assert.equal(a.truncated,true);assert.equal(a.text,b.text);assert.notEqual(a.hash,b.hash);
});
test('合并关联书和角色内嵌书',async()=>{
  const r=await collectSources({maxContext:12000},{data:{personality:'安静',character_book:{entries:[{enabled:true,content:'喜欢读书'}]}}},async()=>[{world:'主世界书',content:'爱旅行'}]);
  assert.equal(r.entries,2);assert.deepEqual(r.books,['主世界书','角色内嵌世界书']);assert.match(r.text,/喜欢读书/);assert.match(r.text,/爱旅行/);
});
test('完整接口不可用时读取主书与聊天绑定书',async()=>{
  const loaded=[];const c={chatMetadata:{world_info:'聊天书'},loadWorldInfo:async n=>{loaded.push(n);return {entries:{0:{content:n}}};}};
  const r=await collectSources(c,{data:{extensions:{world:'主书'}}},async()=>{throw Error('unavailable');});
  assert.deepEqual(loaded,['主书','聊天书']);assert.equal(r.entries,2);assert.match(r.warning,/完整世界书接口不可用/);
});
