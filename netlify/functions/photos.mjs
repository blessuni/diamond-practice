import {getStore} from '@netlify/blobs';
const store=()=>getStore({name:'diamond-class-photos-v1',consistency:'strong'});
const progressStore=()=>getStore({name:'jinju-maeum-progress-v1',consistency:'strong'});
const noCache={'Cache-Control':'no-store'};
async function version(){const meta=await progressStore().get('meta/reset',{type:'json',consistency:'strong'});return String(meta?.version??'0')}
export default async function(request){
 try{
  const s=store();
  if(request.method==='POST'){
   const {group,images}=await request.json();
   if(!Number.isInteger(group)||group<1||group>4||!Array.isArray(images)||(images.length<2||images.length>3)||images.some(x=>typeof x!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x)||x.length>4500000))return Response.json({error:'사진 2~3장(JPEG)만 전송할 수 있어요.'},{status:400});
   const currentVersion=await version();
   for(let i=0;i<images.length;i++)await s.setJSON(`group-${group}-photo-${i}`,{group,index:i,image:images[i],updatedAt:Date.now(),resetVersion:currentVersion});
   // 이전 활동에서 남은 3번째 사진이 새 전송에 섞이지 않도록 정리
   for(let i=images.length;i<3;i++)await s.delete(`group-${group}-photo-${i}`);
   if(await version()!==currentVersion){for(let i=0;i<3;i++){const key=`group-${group}-photo-${i}`;const photo=await s.get(key,{type:'json'});if(photo?.resetVersion===currentVersion)await s.delete(key)}return Response.json({error:'진행상황이 초기화되었어요. 다시 전송해 주세요.'},{status:409,headers:noCache})}
   return Response.json({ok:true},{headers:noCache});
  }
  if(request.method==='GET'){
   const currentVersion=await version();
   const photos=(await Promise.all(Array.from({length:12},(_,i)=>s.get(`group-${Math.floor(i/3)+1}-photo-${i%3}`,{type:'json'})))).filter(p=>p&&p.resetVersion===currentVersion);
   return Response.json({photos},{headers:noCache});
  }
  return Response.json({error:'지원하지 않는 요청'},{status:405});
 }catch(e){console.error('사진 전송 오류',e);return Response.json({error:'서버 연결을 확인해 주세요.'},{status:503})}
}
