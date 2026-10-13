import test from 'node:test';
import assert from 'node:assert/strict';
import {handleProgress} from '../server/progress-core.mjs';
test('교사용 역할 시작 번호 하나가 전체 모둠에 공통 적용되는 서버 설정',async()=>{
 const data=new Map();
 const store={get:async k=>data.get(k)||null,setJSON:async(k,v)=>{data.set(k,v)},list:async()=>({blobs:[...data.keys()].map(key=>({key}))}),delete:async k=>{data.delete(k)}};
 const response=await handleProgress(new Request('https://example.test/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'setRoleStart',roleStart:2})}),store);
 assert.equal(response.status,200);
 const get=await handleProgress(new Request('https://example.test/api/progress'),store);
 assert.equal((await get.json()).roleStart,2);
 const invalid=await handleProgress(new Request('https://example.test/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'setRoleStart',roleStart:7})}),store);
 assert.equal(invalid.status,400);
});
