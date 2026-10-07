import { defineConfig } from 'vitepress'

export default defineConfig({
  // 仓库名 HowCompaniesFail，是项目站点，GitHub 把它挂在 /HowCompaniesFail/ 子路径下，
  // 所以 base 必须是 '/HowCompaniesFail/'。
  // 2026-10-07 走过一段弯路：为了拿到根路径短地址，仓库临时改名成
  // vibe-doge.github.io、base 设成 '/'。当天用户又改回来了——仓库名见名知意
  // 比地址短一截重要，另一本 HowToLiveBetter 也是这个形状
  // （eternity4719.github.io/HowToLiveBetter/）。
  // 只有绑了自定义域名才能同时要名字和根路径，那时 base 再改回 '/'。
  // base 不对的话站点能打开但 CSS/JS 全 404。
  base: '/HowCompaniesFail/',

  lang: 'zh-CN',
  // title 决定两处：导航栏左侧的名字，和浏览器标签页的「页面名 | 站名」
  title: '公司败局案例集',
  description: '公司败局案例集。每期解剖一家真实倒闭的公司，讲可查证的事实，写能用的避坑清单。',
  lastUpdated: true,
  cleanUrls: true,
  // 下划线开头的文件（模板）不进站点
  srcExclude: ['**/_*.md'],

  head: [['meta', { name: 'theme-color', content: '#b8272c' }]],

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '错题集', link: '/entries/' },
      { text: '收录标准', link: '/about' },
    ],

    sidebar: [
      {
        text: '错题集',
        items: [
          { text: '按维度查', link: '/entries/' },
          { text: '收录标准与立场', link: '/about' },
        ],
      },
    ],

    // 中文分词：默认分词器把整串汉字当一个词，中文搜索基本没法用
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize: (text: string) =>
              [...new Intl.Segmenter('zh', { granularity: 'word' }).segment(text)]
                .filter(s => s.isWordLike)
                .map(s => s.segment),
          },
          searchOptions: {
            boost: { title: 4, text: 1 },
            fuzzy: 0.2,
            prefix: true,
          },
        },
        translations: {
          button: { buttonText: '搜索错题', buttonAriaLabel: '搜索错题' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除',
            noResultsText: '没找到相关的错题',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一条', next: '下一条' },
    lastUpdated: { text: '最后核实' },
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    externalLinkIcon: true,

    footer: {
      message: '讲可查证的事实，写能用的避坑清单。',
      copyright: '不写成功学，只写失败学。',
    },
  },
})
