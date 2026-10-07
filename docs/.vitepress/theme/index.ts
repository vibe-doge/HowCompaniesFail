import DefaultTheme from 'vitepress/theme'
import './custom.css'

// 站点不用自定义组件。原来那个按光环 / 行业 / 结局三维筛选的 FacetSearch
// 2026-10-07 删了——用户要的是「文章全在左边，直接，一目了然」，
// 两条案例的时候筛选器更是没用。文章多了要分类的话，在 config.mts 的
// caseItems() 里分组，别再加前端控件。
export default {
  extends: DefaultTheme,
}