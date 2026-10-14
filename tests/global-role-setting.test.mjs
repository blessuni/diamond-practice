import test from 'node:test';
import assert from 'node:assert/strict';
import {handleProgress} from '../server/progress-core.mjs';
const entries=new Map();
const store={get:async(k)=>entries.get(k)||null,setJSON:async(k,v)=>{entries.set(k,v)},list:async()=>({blobs:[...entries.keys()].map(key=>({key}))}),delete:async(k)=>entries.delete(k)};
test('공통 시작 번호는 전체 모둠과 교사용에 동일하게 전달된다',async()=>{
 const set=await handleProgress(new Request('https://example.test/api/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'set-role-start',roleStart:2})}),store);
 assert.equal(set.status,200);
 const get=await handleProgress(new Request('https://example.test/api/progress'),store);
 assert.equal((await get.json()).roleStart,2);
});
test('잘못된 공통 번호는 저장되지 않는다',async()=>{
 const response=await handleProgress(new Request('https://example.test/api/progress',{method:'POST',body:JSON.stringify({action:'set-role-start',roleStart:7})}),store);
 assert.equal(response.status,400);
});
