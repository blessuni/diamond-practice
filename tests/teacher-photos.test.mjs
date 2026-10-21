import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const server=readFileSync(new URL('../netlify/functions/photos.mjs',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
test('선생님용 5번 그룹도 사진 전송 허용',()=>{assert.match(server,/group>5/);assert.match(server,/group<1/)});
test('전체 초기화에 선생님용 사진 포함',()=>assert.match(server,/for\(const group of \[1,2,3,4,5\]\)/));
test('사진 모아보기에 5번 그룹 포함',()=>assert.match(server,/\[1,2,3,4,5\]\.map\(g=>countFor\(s,g\)\)/));
test('선생님 사진 JPG PNG 제한',()=>assert.match(app,/s\.group===5\?"image\/jpeg,image\/png/));
