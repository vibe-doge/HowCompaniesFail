#!/usr/bin/env node
// 校验 docs/entries/ 下每一条错题的 frontmatter 与正文骨架是否合规。
// 零依赖：frontmatter 全是扁平的 `key: value`，自己解析就够了，不引 YAML 库。
//
// 查七件事：
//   1. 必须有的字段一个不少
//   2. 枚举字段的取值在允许范围内
//   3. checked 是合法的 YYYY-MM-DD
//   4. industry 是自由填的，只查非空
//   5. frontmatter 的 title 和正文的一级标题逐字一致
//   6. 固定七节都在，顺序没乱
//   7. 免责声明逐字等于固定模板，且不含具体媒体名称
// 外加两条：
//   8. 正文里不许出现「第 N 张」——那是小红书发布包里的话，不是文章的话。
//      这个仓库只存文章，封面文案、标签、互动在 skill 那边维护。
//   9. 正文里不许出现问号——腔调向澎湃新闻的思想 / 时政版靠，全篇陈述句。
//      向读者发问的话一句都不留（2026-10-07 用户定）。

import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'docs', 'entries')

const ENUM = {
  halo: ['大厂高管', '名校系', '明星名人', '资本宠儿', '其他'],
  ending: ['破产清算', '破产重整', '失联跑路', '被限高', '公司解散'],
  source_type: ['法院文书', '公开报道'],
}
const REQUIRED = ['title', 'company', 'halo', 'industry', 'ending', 'source_type', 'checked']

// 从「公司败局 · 小红书图文生产Skill」第五条抄下来的，一个字都不许动
const DISCLAIMER =
  '案例信息综合自公开报道及法院公开文书，仅作商业案例分析，不构成任何创业或投资建议。' +
  '本账号已尽力核实信息，但不排除报道更新或细节偏差，读者请自行查证。'

// 免责声明里绝对不能出现的媒体名称
const BANNED_MEDIA = [
  '界面新闻', '每日经济新闻', '红星资本局', '澎湃', '新京报', '财新', '第一财经',
  '36氪', '虎嗅', '钛媒体', '中国新闻周刊', '南方周末', '北京商报', '证券时报',
]

// 站点上一条错题 = 一篇文章，不是小红书的施工单。
const SECTIONS = [
  '这门生意是怎么赚钱的',
  '事情是怎么发生的',
  '为什么会走到这一步',
  '这套判断能用在哪儿',
  '避坑清单',
  '免责声明',
  '来源',
]

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

/** 取某个 `## 标题` 到下一个 `## ` 之间的正文 */
function section(body, name) {
  const start = body.indexOf(`## ${name}`)
  if (start < 0) return null
  const rest = body.slice(start + name.length + 3)
  const next = rest.search(/^##\s/m)
  return (next < 0 ? rest : rest.slice(0, next)).trim()
}

/** 比字符串时把换行和连续空格都压掉，只比内容 */
const flat = (s) => s.replace(/\s+/g, '')

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
  if (fm.title && [...fm.title].length > 20) {
    problems.push(`${where}：\`title\` 超过 20 字（现在 ${[...fm.title].length} 字）`)
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

  // 十段齐全且顺序正确
  let cursor = -1
  for (const s of SECTIONS) {
    const at = body.indexOf(`## ${s}`)
    if (at < 0) {
      problems.push(`${where}：缺一段 \`## ${s}\``)
      break
    }
    if (at < cursor) {
      problems.push(`${where}：\`## ${s}\` 的顺序不对，七节要按「这门生意是怎么赚钱的 → 事情是怎么发生的 → 为什么会走到这一步 → 这套判断能用在哪儿 → 避坑清单 → 免责声明 → 来源」排`)
      break
    }
    cursor = at
  }

  // 免责声明必须逐字等于模板
  const disc = section(body, '免责声明')
  if (disc !== null && flat(disc) !== flat(DISCLAIMER)) {
    problems.push(
      `${where}：\`## 免责声明\` 不是固定模板，一个字都不许改\n` +
        `        应为: ${DISCLAIMER}\n` +
        `        实为: ${disc.replace(/\s+/g, ' ').slice(0, 120)}`,
    )
  }
  if (disc) {
    for (const m of BANNED_MEDIA) {
      if (disc.includes(m)) {
        problems.push(`${where}：免责声明里出现了媒体名称「${m}」，统一写「综合公开报道及法院公开文书」`)
      }
    }
  }

  // 避坑清单要 5 条
  const list = section(body, '避坑清单')
  if (list) {
    const n = list.split(/\r?\n/).filter(l => /^\s*\d+[.、]\s*\S/.test(l)).length
    if (n !== 5) problems.push(`${where}：避坑清单要正好 5 条，现在是 ${n} 条`)
  }

  // 「第 N 张」是发布包里的话，文章里一律不许出现
  const zb = /第\s*\d+\s*张/.exec(body)
  if (zb) {
    problems.push(
      `${where}：正文里出现了「${zb[0]}」。这个仓库只存文章，不是五张图的施工单；` +
        `封面文案、标签、互动在 skill 那边维护`,
    )
  }

  // 正文里不许有问号。腔调是澎湃思想/时政那一路：全篇陈述句，
  // 疑问由作者替读者提出来再回答掉，不抛回去（2026-10-07 用户定）。
  // 免责声明是一句陈述，不受影响；标题里也不该有。
  const q = body.indexOf('？')
  if (q >= 0) {
    const line = body.slice(0, q).split(/\r?\n/).length
    problems.push(
      `${where}：正文第 ${line} 行有问号「？」。全篇写陈述句，` +
        `向读者发问的话一句都不留（"这套判断能用在哪儿"的收尾要写成判断句，不是反问）`,
    )
  }

  // 加粗的闭合 ** 后面必须跟空格或标点。
  // CommonMark 的 flanking 规则下，「……是期货。**接着」这种写法不成对，
  // 页面上会把 ** 原样显示出来（2026-10-07 上线后截图才看出来）。
  for (const m of body.matchAll(/\*\*([^*\n]+?)\*\*/g)) {
    const after = body[m.index + m[0].length]
    if (after && !/[\s，。：；、！？（）【】「」『』《》…—·,.!?:;)\]}]/.test(after)) {
      const line = body.slice(0, m.index).split(/\r?\n/).length
      problems.push(
        `${where}：正文第 ${line} 行的加粗「**${m[1].slice(0, 16)}…**」后面紧跟着「${after}」，` +
          `这样渲染不出加粗，页面上会原样显示两个星号。闭合的 ** 后面补一个空格`,
      )
    }
  }
}

if (problems.length) {
  console.error(`✗ 条目格式检查没通过，${problems.length} 处问题：\n`)
  for (const p of problems) console.error('  · ' + p)
  console.error('')
  process.exit(1)
}

console.log(`✓ 条目格式检查通过，共 ${checked} 条。`)
