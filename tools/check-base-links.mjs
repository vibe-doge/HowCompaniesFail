#!/usr/bin/env node
// 扫构建产物里的站内绝对链接，凡是没带 base 前缀的就是断链。
//
// 起因：2026-10-07 把仓库名改回 HowCompaniesFail、base 从 '/' 改成
// '/HowCompaniesFail/' 之后，卡片上的链接还写着 '/entries/xxx'，
// 点进去全是 404。VitePress 自己生成的链接会带上 base，
// 但**手写的 href 不会**——`createContentLoader` 给的 url 就不带，
// 得自己过一遍 `withBase()`。改 base 的时候最容易漏这一处。
// （那处 FacetSearch 后来整个删了，但只要是手写在 markdown 或组件里的链接，
//   就还是这个毛病。改 base 或改仓库名之后一定要跑这一关。）
//
// 判据：产物里每个 href="/…" 和 src="/…" 都必须以 base 开头。
// 跳过 // 开头的协议相对地址和外链。
//
// 用法：npm run build 之后跑 node tools/check-base-links.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'docs', '.vitepress', 'dist')

// base 从 config.mts 里读，不在这里再写死一份——写死就会两边不同步
const config = readFileSync(join(ROOT, 'docs', '.vitepress', 'config.mts'), 'utf8')
const m = /^\s*base:\s*'([^']+)'/m.exec(config)
if (!m) {
  console.error('✗ 没能从 docs/.vitepress/config.mts 里读到 base')
  process.exit(1)
}
const BASE = m[1]

/** 递归列出所有 .html */
function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : []
  })
}

let files
try {
  files = walk(DIST)
} catch {
  console.error(`✗ 找不到构建产物 ${DIST}\n  先跑 npm run build`)
  process.exit(1)
}

const problems = []
const seen = new Set()

for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const where = file.slice(DIST.length + 1)
  for (const hit of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const url = hit[1]
    // // 开头的是协议相对地址，不是站内路径
    if (url.startsWith('//')) continue
    if (url.startsWith(BASE)) continue
    // 同一个坏链接在一个文件里出现多次只报一次
    const key = `${where} ${url}`
    if (seen.has(key)) continue
    seen.add(key)
    problems.push(`${where}：链接「${url}」没带 base 前缀，应该写成「${BASE.replace(/\/$/, '')}${url}」`)
  }
}

if (problems.length) {
  console.error(`✗ 站内链接检查没通过，${problems.length} 处断链（base = ${BASE}）：\n`)
  for (const p of problems.slice(0, 40)) console.error('  · ' + p)
  if (problems.length > 40) console.error(`  … 还有 ${problems.length - 40} 处`)
  console.error('\n  手写的站内链接要写成 /HowCompaniesFail/… 开头（组件里用 withBase()）')
  process.exit(1)
}

console.log(`✓ 站内链接检查通过，${files.length} 个页面，base = ${BASE}。`)