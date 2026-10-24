/**
 * 组装 Windows 桌面端内置服务器（Tauri sidecar）：
 *   1. 以 standalone 模式执行 next build（复用 Docker 构建开关 DOCKER_BUILD=1）
 *   2. 拷贝 server.js + node_modules + 静态资源到 src-tauri/resources/server
 *   3. 拷贝本机 node 运行时为 sidecar 二进制 src-tauri/binaries/node-server-<triple>.exe
 * 用法：node scripts/prepare-tauri-server.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const isWin = process.platform === 'win32';

console.log('[1/3] next build (standalone)…');
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const build = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: { ...process.env, DOCKER_BUILD: '1' },
});
if (build.status !== 0) throw new Error('next build 失败');

console.log('[2/3] 组装 resources/server…');
const dest = path.join(root, 'src-tauri', 'resources', 'server');
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(path.join(root, '.next', 'standalone'), dest, { recursive: true });
fs.cpSync(path.join(root, '.next', 'static'), path.join(dest, '.next', 'static'), { recursive: true });
fs.cpSync(path.join(root, 'public'), path.join(dest, 'public'), { recursive: true });

console.log('[3/3] 拷贝 Node 运行时为 sidecar…');
const triple = 'x86_64-pc-windows-msvc';
const binDir = path.join(root, 'src-tauri', 'binaries');
fs.mkdirSync(binDir, { recursive: true });
fs.copyFileSync(process.execPath, path.join(binDir, `node-server-${triple}.exe`));

console.log('sidecar 组装完成:', dest);
