import {getStore} from '@netlify/blobs';
const store=()=>getStore({name:'diamond-class-photos-v1',consistency:'strong'});
const noCache={'Cache-Control':'no-store'};
export default async function(request){
 try{
  const s=store();
  if(request.method==='POST'){
   const {group,images}=await request.json();
   if(!Number.isInteger(group)||group<1||group>4||!Array.isArray(images)||(images.length<2||images.length>3)||images.some(x=>typeof x!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x)||x.length>4500000))return Response.json({error:'사진 2~3장(JPEG)만 전송할 수 있어요.'},{status:400});
   for(let i=0;i<images.length;i++)await s.setJSON(`group-${group}-photo-${i}`,{group,index:i,image:images[i],updatedAt:Date.now()});
   return Response.json({ok:true},{headers:noCache});
  }
  if(request.method==='GET'){
   const photos=(await Promise.all(Array.from({length:12},(_,i)=>s.get(`group-${Math.floor(i/3)+1}-photo-${i%3}`,{type:'json'})))).filter(Boolean);
   return Response.json({photos},{headers:noCache});
  }
  return Response.json({error:'지원하지 않는 요청'},{status:405});
 }catch(e){console.error('사진 전송 오류',e);return Response.json({error:'서버 연결을 확인해 주세요.'},{status:503})}
}
