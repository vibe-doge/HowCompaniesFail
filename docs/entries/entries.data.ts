import { createContentLoader } from 'vitepress'

export interface Entry {
  url: string
  title: string
  company: string
  halo: string
  industry: string
  ending: string
  source_type: string
  checked: string
}

declare const data: Entry[]
export { data }

/** frontmatter 里的日期会被 YAML 解析成 Date，统一成 YYYY-MM-DD */
function asDay(v: unknown): string {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

export default createContentLoader('entries/*.md', {
  excerpt: false,
  transform(raw): Entry[] {
    return raw
      // 只收真正的条目。要排掉两类：
      //   index.md —— 本节的筛选页，不是条目
      //   _模板.md —— srcExclude 只挡页面生成，挡不住这个 loader
      .filter(
        ({ url, frontmatter }) =>
          frontmatter.title &&
          frontmatter.halo &&
          !url.split('/').pop()!.startsWith('_'),
      )
      .map(({ url, frontmatter }) => ({
        url,
        title: String(frontmatter.title),
        company: String(frontmatter.company ?? ''),
        halo: String(frontmatter.halo ?? ''),
        industry: String(frontmatter.industry ?? ''),
        ending: String(frontmatter.ending ?? ''),
        source_type: String(frontmatter.source_type ?? ''),
        checked: asDay(frontmatter.checked),
      }))
      .sort((a, b) => a.url.localeCompare(b.url, 'zh'))
  },
})
