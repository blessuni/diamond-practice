export const capturedAll=r=>r.selected.length>=2&&r.selected.every(v=>r.done.includes(v));
export function normalizeFlow(r){const done=[...new Set(r.done.filter(v=>r.selected.includes(v)))];let x={...r,done};
 // 이전 완료·추가 선택 화면은 새 흐름으로 복원하고 기존 보석 기록은 보존.
 if(x.screen==='finish')x={...x,screen:x.uploaded?'upload':'captured',canva:!!x.uploaded||!!x.canva};
 if(x.screen==='extra')x={...x,screen:capturedAll(x)?'captured':'activity',extra:null};
 if(!capturedAll(x)&&['captured','return','photos','sendphoto','upload','padlet','score','complete'].includes(x.screen))x={...x,screen:done.length?'oneDone':'activity',canva:false};
 if(['discussion','director','promise'].includes(x.screen)&&done.length&&!x.reviewing)x.screen=capturedAll(x)?'captured':'oneDone';
 if(['discussion','director','promise'].includes(x.screen)&&x.selected.length!==2)x.screen='select';
 if(x.screen==='oneDone'&&capturedAll(x)&&!x.reviewing)x.screen='captured';
 if(x.screen==='oneDone'&&!done.length)x.screen='activity';
 if(x.canva&&(!capturedAll(x)||!['upload','padlet','score','complete'].includes(x.screen)))x.canva=false;
 delete x.uploaded;return x;}
export function toggleDone(r,v){if(!r.selected.includes(v))return r;const done=r.done.includes(v)?r.done.filter(x=>x!==v):[...r.done,v];const next={...r,done,canva:false,pending:v,screen:'activity'};delete next.uploaded;return next;}
export function moveTo(r,screen){return normalizeFlow({...r,screen,extra:null,canva:false,reviewing:['discussion','director','promise','activity','oneDone'].includes(screen)&&!!r.reviewing});}
export function backTo(r,screen){return normalizeFlow({...r,screen,extra:null,canva:false,reviewing:true});}
export function stageOf(r){r=normalizeFlow(r);if(r.screen==='leader')return '오늘의 진행자 확인';if(r.screen==='select')return `활동 선택 중 (${r.selected.length}/2)`;if(r.canva&&['score','complete'].includes(r.screen))return '🎨 캔바 업로드 완료';if(r.screen==='return')return '🪑 모둠 자리로 이동';if(r.screen==='photos')return '📱 사진 확인';if(r.screen==='sendphoto')return '📤 선생님께 사진 전송';if(r.screen==='padlet')return '📌 패들렛 사진 올리기';if(r.screen==='upload')return '🎨 Canva 업로드 안내';if(r.screen==='discussion')return '두 활동 표현 방법 의논 중';if(r.screen==='promise')return '우리의 약속 확인 중';if(r.screen==='director')return '🎬 감독 촬영 준비 확인';if(['confirm','roles'].includes(r.screen))return '역할 확인';if(['activity','oneDone','captured'].includes(r.screen)){if(r.reviewing&&r.screen==='activity')return '첫 번째 활동 표현 중 (0/2)';if(r.reviewing&&r.screen==='oneDone')return '두 번째 활동 표현 중 (1/2)';if(capturedAll(r))return `두 활동 촬영 완료 (${r.done.length}/${r.selected.length})`;return r.done.length?`두 번째 활동 표현 중 (${r.done.length}/${r.selected.length})`:`첫 번째 활동 표현 중 (0/${r.selected.length})`;}return '활동 고르는 중';}
