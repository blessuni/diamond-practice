import {getStore} from '@netlify/blobs';
const store=()=>getStore({name:'diamond-class-photos-v1',consistency:'strong'});
const noCache={'Cache-Control':'no-store'};
const valid=x=>typeof x==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x)&&x.length<=4500000;
async function countFor(s,group){
 const value=await s.get(`group-${group}-photo-count`,{type:'json'});
 if(Number.isInteger(value?.count)&&value.count>=0)return value.count;
 // 이전 버전에서 저장한 사진 2장도 그대로 보존합니다.
 const old=await Promise.all([0,1].map(i=>s.get(`group-${group}-photo-${i}`,{type:'json'})));
 return old[1]?2:old[0]?1:0;
}
export default async function(request){
 try{
  const s=store();
  if(request.method==='POST'){
   const input=await request.json();
   if(input?.action==='reset'){
    // 전체 초기화 시 저장된 모든 모둠 사진과 카운트를 실제 삭제합니다.
    for(const group of [1,2,3,4]){
     const count=await countFor(s,group);
     for(let index=0;index<count;index++)await s.delete(`group-${group}-photo-${index}`);
     await s.delete(`group-${group}-photo-count`);
    }
    return Response.json({ok:true,photos:[]},{headers:noCache});
   }
   const {group,images}=input;
   if(!Number.isInteger(group)||group<1||group>4||!Array.isArray(images)||images.length<1||images.some(x=>!valid(x)))return Response.json({error:'JPEG 사진을 1장 이상 선택해 주세요.'},{status:400});
   let count=await countFor(s,group);
   for(const image of images){await s.setJSON(`group-${group}-photo-${count}`,{group,index:count,image,updatedAt:Date.now()});count++}
   await s.setJSON(`group-${group}-photo-count`,{count});
   return Response.json({ok:true,count},{headers:noCache});
  }
  if(request.method==='GET'){
   const counts=await Promise.all([1,2,3,4].map(g=>countFor(s,g)));
   const ids=counts.flatMap((count,g)=>Array.from({length:count},(_,i)=>({group:g+1,index:i})));
   const photos=(await Promise.all(ids.map(({group,index})=>s.get(`group-${group}-photo-${index}`,{type:'json'})))).filter(Boolean);
   return Response.json({photos},{headers:noCache});
  }
  return Response.json({error:'지원하지 않는 요청'},{status:405});
 }catch(e){console.error('사진 전송 오류',e);return Response.json({error:'서버 연결을 확인해 주세요.'},{status:503})}
}
