import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {handleProgress} from '../server/progress-core.mjs';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://class.example/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
const nativeFetch=globalThis.fetch;
const data=new Map();let offline=false;
const store={list:async()=>({blobs:[...data.keys()].map(key=>({key}))}),get:async(key:string)=>data.get(key)||null,setJSON:async(key:string,value:any)=>data.set(key,value),delete:async(key:string)=>data.delete(key)};
const endpoint=process.env.PROGRESS_TEST_URL;
globalThis.fetch=async(url:any,options:any={})=>{if(offline)throw Error('offline');if(endpoint)return nativeFetch(endpoint,options);return handleProgress(new Request('https://class.example'+url,options),store)};
Object.defineProperty(navigator,'sendBeacon',{value:()=>false,configurable:true});
const React=await import('react');
const {render,cleanup,fireEvent,within,waitFor}=await import('@testing-library/react');
const {default:App}=await import('../src/App.tsx');
const gems=[['협동','책임'],['배려','질서'],['경청','성실'],['공감','끈기'],['존중','경청']];
for(let group=1;group<=5;group++)test(`기기 간 진행상황 공유: 모둠 ${group}${endpoint?' (실제 Netlify Functions/Blobs)':''}`,async()=>{
 cleanup();localStorage.clear();const selected=gems[group-1];const device='dashboard-writer-'+group;const initial=await(await fetch('/api/progress')).json();
 localStorage.setItem('maeum-reset-version',String(initial.resetVersion??'0'));localStorage.setItem('maeum-device',device);localStorage.setItem('diamond-maeum-v1',JSON.stringify({group,selected:[],done:[],screen:'leader',leaderConfirmed:false,extra:null}));
 const writer=render(React.createElement(App));const w=within(writer.container);
 // 두 번째 앱 인스턴스는 다른 기기 번호와 빈 로컬 기록으로 시작: 공유 GET만으로 첫 기기 기록 확인.
 localStorage.clear();localStorage.setItem('maeum-reset-version',String(initial.resetVersion??'0'));localStorage.setItem('maeum-device','dashboard-teacher-'+group);
 const teacher=render(React.createElement(App));const t=within(teacher.container);
 assert.equal(teacher.container.querySelector('.settings'),null);assert.doesNotMatch(teacher.container.textContent!,/⚙️|교사용 설정/);
 fireEvent.click(t.getByRole('button',{name:'📊 진행상황 보기'}));
 const status=async(expected:string)=>{await waitFor(async()=>{const response=await fetch('/api/progress');const {rows}=await response.json();assert.equal(rows.find((row:any)=>row.device_id===device)?.stage,expected)},{timeout:8000});fireEvent.click(t.getByRole('button',{name:'↻ 새로고침'}));await waitFor(()=>{const row=teacher.container.querySelector('[data-group="'+group+'"]')!;const states=expected==='🎨 Canva 업로드로 이동'?['done','done','done','done','done']:expected==='🎨 Canva 업로드 안내'?['done','done','done','done','current']:['두 마음보석 촬영 완료 (2/2)','🪑 모둠 자리로 이동','📱 사진 확인'].includes(expected)?['done','done','done','current','pending']:expected==='두 번째 마음보석 표현 중 (1/2)'?['done','done','current','pending','pending']:expected==='첫 번째 마음보석 표현 중 (0/2)'?['done','current','pending','pending','pending']:['current','pending','pending','pending','pending'];assert.deepEqual([...row.querySelectorAll('[data-step]')].map(x=>x.getAttribute('data-state')),states)})};
 await status('오늘의 진행자 확인');fireEvent.click(w.getByRole('button',{name:'🌟 오늘의 진행자 확인하기'}));fireEvent.click(w.getByRole('button',{name:/① 진행자 준비됐어요/}));await status('마음보석 고르는 중');for(const gem of selected)fireEvent.click(w.getByRole('button',{name:gem,exact:true}));fireEvent.click(w.getByRole('button',{name:/선택했어요/}));fireEvent.click(w.getByRole('button',{name:/우리 역할 보기/}));await status('역할 확인');fireEvent.click(w.getByRole('button',{name:/두 마음보석 이야기해요/}));await status('두 마음보석 표현 방법 의논 중');fireEvent.click(w.getByRole('button',{name:/의논했어요! 촬영하러 출발/}));await status('첫 번째 마음보석 표현 중 (0/2)');
 fireEvent.click(w.getAllByRole('button',{name:/이 마음보석 다 했어요/})[0]);await status('두 번째 마음보석 표현 중 (1/2)');
 fireEvent.click(w.getByRole('button',{name:/이 마음보석 다 했어요/}));await status('두 마음보석 촬영 완료 (2/2)');
 fireEvent.click(w.getByRole('button',{name:/모둠 자리로 돌아가요/}));await status('🪑 모둠 자리로 이동');
 fireEvent.click(w.getByRole('button',{name:/모였어요/}));await status('📱 사진 확인');
 fireEvent.click(w.getByRole('button',{name:/사진을 확인했어요/}));await status('🎨 Canva 업로드 안내');
 fireEvent.click(w.getByRole('button',{name:'← 뒤로'}));await status('📱 사진 확인');assert.deepEqual(JSON.parse(localStorage.getItem('diamond-maeum-v1')!).done,selected);fireEvent.click(w.getByRole('button',{name:/사진을 확인했어요/}));await status('🎨 Canva 업로드 안내');
 const link=w.getByRole('link',{name:/우리 사진 올리기/});link.addEventListener('click',event=>event.preventDefault());fireEvent.click(link);await status('🎨 Canva 업로드로 이동');assert.equal(t.queryByText('완료',{exact:true}),null);
 fireEvent.click(t.getByRole('button',{name:'← 돌아가기'}));assert.equal(t.queryByRole('dialog'),null);assert.ok(t.getByRole('heading',{name:'우리 모둠을 정해요'}));cleanup();
});
test(`전체 초기화 화면·다른 기기 재접속·오프라인 기록 부활 차단${endpoint?' (실제 Netlify)':''}`,async()=>{cleanup();offline=false;localStorage.clear();const before=await(await fetch('/api/progress')).json();const oldVersion=String(before.resetVersion??'0');const oldRecord={group:1,selected:gems[0],done:['협동'],screen:'oneDone',extra:null};localStorage.setItem('maeum-reset-version',oldVersion);localStorage.setItem('maeum-device','reset-teacher');render(React.createElement(App));fireEvent.click(within(document.body).getByRole('button',{name:'📊 진행상황 보기'}));fireEvent.click(within(document.body).getByRole('button',{name:'🔄 전체 진행상황 초기화'}));assert.ok(within(document.body).getByRole('dialog',{name:'전체 진행상황 초기화 확인'}));fireEvent.click(within(document.body).getByRole('button',{name:'취소'}));assert.equal(within(document.body).queryByRole('dialog',{name:'전체 진행상황 초기화 확인'}),null);assert.equal(String((await(await fetch('/api/progress')).json()).resetVersion??'0'),oldVersion);fireEvent.click(within(document.body).getByRole('button',{name:'🔄 전체 진행상황 초기화'}));fireEvent.click(within(document.body).getByRole('button',{name:'모두 초기화'}));await waitFor(()=>assert.ok(within(document.body).getByText('모든 진행상황을 초기화했어요 ✓')),{timeout:15000});const after=await(await fetch('/api/progress')).json();assert.notEqual(after.resetVersion,oldVersion);assert.equal(after.rows.length,0);cleanup();
 for(const [index,selected] of gems.entries()){localStorage.clear();localStorage.setItem('maeum-device','stale-tablet-'+index);localStorage.setItem('maeum-reset-version',oldVersion);localStorage.setItem('diamond-maeum-v1',JSON.stringify({...oldRecord,group:index+1,selected,done:[selected[0]]}));localStorage.setItem('maeum-group-records',JSON.stringify({[index+1]:{...oldRecord,group:index+1,selected,done:[selected[0]]}}));render(React.createElement(App));await waitFor(()=>assert.ok(within(document.body).getByRole('heading',{name:'우리 모둠을 정해요'})),{timeout:10000});assert.equal(localStorage.getItem('diamond-maeum-v1'),null);assert.equal(localStorage.getItem('maeum-group-records'),'{}');assert.equal(localStorage.getItem('maeum-reset-version'),after.resetVersion);cleanup()}
 const stale=await fetch('/api/progress',{method:'POST',body:JSON.stringify({device:'offline-old-device',group:1,record:oldRecord,resetVersion:oldVersion})});assert.equal(stale.status,409);assert.equal((await(await fetch('/api/progress')).json()).rows.length,0);
});
if(!endpoint)test('오프라인 로컬 보존 후 재연결 공유 및 교사 로컬 대체 표시',async()=>{
 cleanup();localStorage.clear();const snapshot=await(await fetch('/api/progress')).json();localStorage.setItem('maeum-reset-version',String(snapshot.resetVersion??'0'));offline=true;localStorage.setItem('maeum-device','offline-writer');localStorage.setItem('diamond-maeum-v1',JSON.stringify({group:1,selected:gems[0],done:[],screen:'activity',extra:null}));const app=render(React.createElement(App));const ui=within(app.container);fireEvent.click(ui.getAllByRole('button',{name:/이 마음보석 다 했어요/})[0]);assert.deepEqual(JSON.parse(localStorage.getItem('diamond-maeum-v1')!).done,['협동']);fireEvent.click(ui.getByRole('button',{name:'📊 진행상황 보기'}));await waitFor(()=>assert.equal(app.container.querySelector('[data-group="1"] [data-step="사진2"]')?.getAttribute('data-state'),'current'));offline=false;window.dispatchEvent(new dom.window.Event('online'));await waitFor(async()=>{const {rows}=await (await fetch('/api/progress')).json();assert.equal(rows.find((r:any)=>r.device_id==='offline-writer')?.stage,'두 번째 마음보석 표현 중 (1/2)')},{timeout:8000});fireEvent.click(ui.getByRole('button',{name:'↻ 새로고침'}));await waitFor(()=>assert.ok(ui.getByText('여러 태블릿의 진행상황 · 4초마다 확인')));cleanup();
});
test.afterEach(()=>{offline=false;cleanup()});test.after(()=>dom.window.close());
