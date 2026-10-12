import {normalizeFlow,stageOf} from './activity-flow.mjs';
export {stageOf} from './activity-flow.mjs';
const groups=[['협동','책임','경청','감사'],['배려','질서','공감','용기'],['경청','성실','협동','예의'],['공감','끈기','배려','자주'],['존중','경청','공감','협동']];
const screens=['leader','select','confirm','roles','discussion','activity','extra','finish','return','photos','oneDone','captured','upload'];
function validate(x){
 if(!x||typeof x.device!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(x.device)||!Number.isInteger(x.group)||x.group<1||x.group>5||x.record?.group!==x.group)return null;
 const r=x.record;const valid=groups[x.group-1];
 if(!Array.isArray(r.selected)||r.selected.length>4||new Set(r.selected).size!==r.selected.length||r.selected.some(v=>!valid.includes(v))||!Array.isArray(r.done)||new Set(r.done).size!==r.done.length||r.done.some(v=>!r.selected.includes(v))||!screens.includes(r.screen))return null;
 if(r.screen==='select'&&r.selected.length>2)return null;
 const record=normalizeFlow({group:x.group,selected:r.selected,done:r.done,screen:r.screen,extra:valid.includes(r.extra)?r.extra:null,pending:r.selected.includes(r.pending)?r.pending:null,leaderConfirmed:!!r.leaderConfirmed,reviewing:!!r.reviewing,role:Number.isInteger(r.role)&&r.role>=-1&&r.role<5?r.role:-1,canva:!!r.canva,uploaded:!!r.uploaded});
 const category=x.group===5?'observer':'child';
 return {id:category+'/'+x.group+'/'+x.device,device_id:x.device,group_id:x.group,category,record_json:JSON.stringify(record),stage:stageOf(record),updated_at:Date.now(),resetVersion:String(x.resetVersion??'0'),revision:Number.isFinite(x.revision)?x.revision:Date.now()};
}
export async function handleProgress(request,store){
 const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 try{
  const resetMeta=await store.get('meta/reset',{type:'json',consistency:'strong'});const resetVersion=String(resetMeta?.version??'0');
  if(request.method==='GET'){
   const {blobs}=await store.list();
   const values=await Promise.all(blobs.filter(b=>/^(child|observer)\//.test(b.key)).map(b=>store.get(b.key,{type:'json',consistency:'strong'})));
   const rows=values.filter(row=>row&&String(row.resetVersion??'0')===resetVersion).map(row=>{const record=normalizeFlow(JSON.parse(row.record_json));return {...row,record_json:JSON.stringify(record),stage:stageOf(record)}}).sort((a,b)=>b.updated_at-a.updated_at);
   return reply({rows,serverTime:Date.now(),storage:'netlify-blobs',resetVersion});
  }
  if(request.method!=='POST')return reply({error:'허용되지 않은 요청'},405);
  if(Number(request.headers.get('content-length')||0)>5000)return reply({error:'기록이 너무 커요'},413);
  const body=await request.text();if(body.length>5000)return reply({error:'기록이 너무 커요'},413);
  let input;try{input=JSON.parse(body)}catch{return reply({error:'기록 형식을 확인해 주세요'},400)}
  if(input?.action==='reset'){
   if(String(input.resetVersion??'0')!==resetVersion)return reply({error:'초기화 상태를 다시 확인해 주세요',resetVersion},409);
   const version=Math.max(Date.now(),Number(resetVersion.split('-')[0])+1)+'-'+crypto.randomUUID();await store.setJSON('meta/reset',{version,resetAt:Date.now()});
   const {blobs}=await store.list();
   for(const {key} of blobs.filter(b=>/^(child|observer)\//.test(b.key))){const row=await store.get(key,{type:'json',consistency:'strong'});const current=await store.get('meta/reset',{type:'json',consistency:'strong'});if(row&&String(row.resetVersion??'0')!==String(current.version))await store.delete(key);}
   return reply({ok:true,resetVersion:version});
  }
  if(String(input?.resetVersion??'0')!==resetVersion)return reply({error:'이전 기록은 초기화되었어요',resetVersion},409);
  const row=validate(input);if(!row)return reply({error:'기록 내용을 확인해 주세요'},400);
  const old=await store.get(row.id,{type:'json',consistency:'strong'});
  if(old&&String(old.resetVersion??'0')===resetVersion&&old.revision>row.revision)return reply({ok:true,ignoredOlder:true});
  await store.setJSON(row.id,row);
  const after=await store.get('meta/reset',{type:'json',consistency:'strong'});if(String(after?.version??'0')!==resetVersion){const saved=await store.get(row.id,{type:'json',consistency:'strong'});if(saved?.resetVersion===row.resetVersion&&saved?.revision===row.revision)await store.delete(row.id);return reply({error:'이전 기록은 초기화되었어요',resetVersion:String(after?.version??'0')},409)}
  return reply({ok:true,updatedAt:row.updated_at,resetVersion});
 }catch(error){console.error('마음보석 진행상황 저장 오류',error);return reply({error:'진행상황 연결을 확인해 주세요'},503)}
}
