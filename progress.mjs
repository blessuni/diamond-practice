import {getStore} from '@netlify/blobs';
import {handleProgress} from '../../server/progress-core.mjs';
export default async function(request){
 try{return await handleProgress(request,getStore({name:'jinju-maeum-progress-v1',consistency:'strong'}));}
 catch(error){console.error('진행상황 저장 연결 오류',error);return Response.json({error:'진행상황 서버 연결을 확인해 주세요'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
