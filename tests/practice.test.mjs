import test from 'node:test';
import assert from 'node:assert/strict';
import {handleProgress} from '../server/progress-core.mjs';
import {normalizeFlow,stageOf} from '../server/activity-flow.mjs';
const base={group:1,selected:['활동 1','활동 2'],done:['활동 1','활동 2'],screen:'score',extra:null,score:5,roleStart:4,roleChecks:[true,true,true,true,true],promiseChecks:[true,true,true],discussionChecks:{'활동 1':{place:true,pose:true},'활동 2':{place:true,pose:true}},canva:true};
test('활동 1·2와 별점 화면 복원',()=>{const r=normalizeFlow(base);assert.equal(r.screen,'score');assert.equal(r.score,5);assert.ok(stageOf(r));});
test('실제 4개 모둠의 별점과 역할 시작 번호 저장',async()=>{
 const m=new Map();
 const store={get:async(k)=>m.get(k)||null,list:async()=>({blobs:[...m.keys()].map(key=>({key}))}),setJSON:async(k,v)=>{m.set(k,v)},delete:async(k)=>{m.delete(k)}};
 const request=new Request('https://example.test/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({device:'tablet-test',group:1,record:base,resetVersion:'0',revision:123})});
 const res=await handleProgress(request,store);assert.equal(res.status,200);
 const get=await handleProgress(new Request('https://example.test/api/progress'),store);
 const {rows}=await get.json();assert.equal(rows.length,1);
 const record=JSON.parse(rows[0].record_json);assert.equal(record.score,5);assert.equal(record.roleStart,4);
 assert.equal(record.discussionChecks['활동 1'].place,true);
});
test('선생님용 시범은 실제 모둠 기록으로 저장되지 않음',async()=>{
 const store={get:async()=>null,list:async()=>({blobs:[]}),setJSON:async()=>{},delete:async()=>{}};
 const request=new Request('https://example.test/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({device:'tablet-test',group:5,record:{...base,group:5},resetVersion:'0',revision:123})});
 const res=await handleProgress(request,store);assert.equal(res.status,400);
});
