import DefaultTheme from 'vitepress/theme'
import FacetSearch from './components/FacetSearch.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component('FacetSearch', FacetSearch)
  },
}
