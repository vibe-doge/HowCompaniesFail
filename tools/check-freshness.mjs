#!/usr/bin/env node
// 列出超过 N 个月没复核的条目。
//
// 这个赛道和医学不一样：政策、税率、平台规则、公司法条文一年就变，
// 一条写着「截至 2026 年 3 月」的条目放到 2027 年就是在骗人。
// 所以每条都有 checked 字段，这个脚本把过期的挑出来，提醒回去核对来源。
//
// 用法：node tools/check-freshness.mjs [月数]     默认 6 个月
// 恒不报错（退出码永远是 0）：这是提醒，不是拦路虎。

import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'docs', 'entries')
const MONTHS = Number(process.argv[2] ?? 6)

const now = new Date()
const cutoff = new Date(now)
cutoff.setMonth(cutoff.getMonth() - MONTHS)

const rows = []
for (const file of readdirSync(DIR).sort()) {
  if (!file.endsWith('.md') || file.startsWith('_') || file === 'index.md') continue
  const raw = readFileSync(join(DIR, file), 'utf8')
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  if (!m) continue
  const t = /^title:\s*(.+)$/m.exec(m[1])
  const c = /^checked:\s*(\d{4}-\d{2}-\d{2})/m.exec(m[1])
  const day = c ? new Date(c[1] + 'T00:00:00') : null
  if (!day || Number.isNaN(day.getTime())) {
    rows.push({ file, title: t?.[1] ?? file, checked: '（缺 checked）', months: Infinity })
    continue
  }
  const months = (now - day) / (1000 * 60 * 60 * 24 * 30.44)
  if (day < cutoff) rows.push({ file, title: t?.[1] ?? file, checked: c[1], months })
}

rows.sort((a, b) => b.months - a.months)

if (!rows.length) {
  console.log(`✓ 没有超过 ${MONTHS} 个月没复核的条目。`)
  process.exit(0)
}

console.log(`⚠ 有 ${rows.length} 条超过 ${MONTHS} 个月没复核，去核对一下来源：\n`)
for (const r of rows) {
  const age = r.months === Infinity ? '—' : `${Math.floor(r.months)} 个月前`
  console.log(`  · ${r.checked}（${age}）  ${r.title}`)
  console.log(`      ${r.file}`)
}
console.log('\n政策、金额、时限这三类最容易过期，优先看它们。')
