#!/usr/bin/env node
// 校验 docs/entries/ 下每一条错题的 frontmatter 与正文骨架是否合规。
// 零依赖：frontmatter 全是扁平的 `key: value`，自己解析就够了，不引 YAML 库。
//
// 查五件事：
//   1. 必须有的字段一个不少
//   2. 枚举字段的取值在允许范围内
//   3. checked 是合法的 YYYY-MM-DD
//   4. frontmatter 的 title 和正文的一级标题逐字一致
//   5. 固定五段都在，顺序没乱

import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'docs', 'entries')

const ENUM = {
  stage: ['想法', '合伙', '注册', '合同', '用工', '融资', '退出', '通用'],
  risk: ['法律', '财税', '股权', '合同', '刑事', '用工', '知产'],
  loss: ['大', '中', '小', '非金钱'],
  consequence: ['赔钱', '公司没了', '失信', '刑责', '失去控制权'],
  evidence: ['A', 'B', 'C'],
}
const REQUIRED = ['title', ...Object.keys(ENUM), 'source', 'checked']
const SECTIONS = ['【案例】', '【死因】', '【自检】', '【重来一次】', '【来源】']

/** 解析文件开头的 --- ... --- 块，只认扁平的 scalar */
function parse(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!m) return null
  const fm = {}
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const i = line.indexOf(':')
    if (i < 0) continue
    let v = line.slice(i + 1).trim()
    // 去掉可能的引号
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    fm[line.slice(0, i).trim()] = v
  }
  return { fm, body: raw.slice(m[0].length) }
}

const problems = []
let checked = 0

const files = readdirSync(DIR)
  .filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'index.md')
  .sort()

for (const file of files) {
  const where = `docs/entries/${file}`
  const raw = readFileSync(join(DIR, file), 'utf8')
  const parsed = parse(raw)
  if (!parsed) {
    problems.push(`${where}：开头没有 frontmatter（--- 块）`)
    continue
  }
  const { fm, body } = parsed
  checked++

  for (const k of REQUIRED) {
    if (!fm[k]) problems.push(`${where}：缺字段 \`${k}\``)
  }
  for (const [k, allowed] of Object.entries(ENUM)) {
    if (fm[k] && !allowed.includes(fm[k])) {
      problems.push(`${where}：\`${k}\` 的值「${fm[k]}」不在允许范围（${allowed.join(' / ')}）`)
    }
  }
  if (fm.checked && !/^\d{4}-\d{2}-\d{2}$/.test(fm.checked)) {
    problems.push(`${where}：\`checked\` 要写成 YYYY-MM-DD，现在是「${fm.checked}」`)
  }

  // title 和一级标题逐字一致
  const h1 = /^#\s+(.+?)\s*$/m.exec(body)
  if (!h1) {
    problems.push(`${where}：正文里没有一级标题（# …）`)
  } else if (fm.title && h1[1] !== fm.title) {
    problems.push(
      `${where}：frontmatter 的 title 和一级标题对不上\n` +
        `        frontmatter: ${fm.title}\n` +
        `        一级标题  : ${h1[1]}`,
    )
  }

  // 五段齐全且顺序正确
  let cursor = -1
  for (const s of SECTIONS) {
    const at = body.indexOf(`## ${s}`)
    if (at < 0) {
      problems.push(`${where}：缺一段 \`## ${s}\``)
      break
    }
    if (at < cursor) {
      problems.push(`${where}：\`## ${s}\` 的顺序不对，五段要按【案例】【死因】【自检】【重来一次】【来源】排`)
      break
    }
    cursor = at
  }
}

if (problems.length) {
  console.error(`✗ 条目格式检查没通过，${problems.length} 处问题：\n`)
  for (const p of problems) console.error('  · ' + p)
  console.error('')
  process.exit(1)
}

console.log(`✓ 条目格式检查通过，共 ${checked} 条。`)
