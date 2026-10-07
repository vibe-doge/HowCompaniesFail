import { createContentLoader } from 'vitepress'

export interface Entry {
  url: string
  title: string
  stage: string
  risk: string
  loss: string
  consequence: string
  evidence: string
  source: string
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
      // 只收真正的错题。要排掉两类：
      //   index.md —— 本节的筛选页，不是错题
      //   _模板.md —— srcExclude 只挡页面生成，挡不住这个 loader
      .filter(
        ({ url, frontmatter }) =>
          frontmatter.title &&
          frontmatter.stage &&
          frontmatter.evidence &&
          !url.split('/').pop()!.startsWith('_'),
      )
      .map(({ url, frontmatter }) => ({
        url,
        title: String(frontmatter.title),
        stage: String(frontmatter.stage ?? ''),
        risk: String(frontmatter.risk ?? ''),
        loss: String(frontmatter.loss ?? ''),
        consequence: String(frontmatter.consequence ?? ''),
        evidence: String(frontmatter.evidence ?? ''),
        source: String(frontmatter.source ?? ''),
        checked: asDay(frontmatter.checked),
      }))
      .sort((a, b) => a.url.localeCompare(b.url, 'zh'))
  },
})
