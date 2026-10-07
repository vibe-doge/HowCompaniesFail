<script setup lang="ts">
import { computed, ref } from 'vue'
import { data as entries } from '../../../entries/entries.data'

const DIMS = [
  { key: 'halo', label: '光环' },
  { key: 'industry', label: '行业' },
  { key: 'ending', label: '结局' },
] as const

type DimKey = (typeof DIMS)[number]['key']

const q = ref('')
const active = ref<Record<string, string[]>>({})

/** 每个维度实际出现过的取值，排序稳定 */
const options = computed(() =>
  Object.fromEntries(
    DIMS.map(({ key }) => [
      key,
      [...new Set(entries.map(e => e[key as DimKey]).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'zh'),
      ),
    ]),
  ) as Record<DimKey, string[]>,
)

function isOn(key: string, v: string) {
  return (active.value[key] ?? []).includes(v)
}

function toggle(key: string, v: string) {
  const cur = active.value[key] ?? []
  active.value[key] = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]
}

function reset() {
  active.value = {}
  q.value = ''
}

const filtered = computed(() => {
  const kw = q.value.trim()
  return entries.filter(e => {
    // 同组内多选是「或」，跨组是「且」
    for (const [k, vs] of Object.entries(active.value)) {
      if (vs.length && !vs.includes(e[k as DimKey])) return false
    }
    if (kw && !(e.title.includes(kw) || e.company.includes(kw))) return false
    return true
  })
})

const hasFilter = computed(() => q.value.trim() !== '' || Object.values(active.value).some(v => v.length))
</script>

<template>
  <div class="fs">
    <div class="fs-bar">
      <input v-model="q" class="fs-q" type="search" placeholder="搜标题或公司名" aria-label="搜索" />
      <span class="fs-cnt">显示 {{ filtered.length }} / {{ entries.length }} 条</span>
      <button v-if="hasFilter" class="fs-reset" type="button" @click="reset">清空</button>
    </div>

    <div v-for="d in DIMS" :key="d.key" class="fs-row">
      <span class="fs-label">{{ d.label }}</span>
      <span class="fs-chips">
        <button
          v-for="v in options[d.key]"
          :key="v"
          class="fs-chip"
          type="button"
          :aria-pressed="isOn(d.key, v)"
          :class="{ on: isOn(d.key, v) }"
          @click="toggle(d.key, v)"
        >
          {{ v }}
        </button>
      </span>
    </div>

    <p class="fs-hint">同一组里多选是「或」，不同组之间是「且」。点标题进那一条。</p>

    <ul v-if="filtered.length" class="fs-list">
      <li v-for="e in filtered" :key="e.url" class="fs-card">
        <a class="fs-title" :href="e.url">{{ e.title }}</a>
        <div class="fs-meta">
          <span class="fs-tag">{{ e.halo }}</span>
          <span class="fs-tag">{{ e.industry }}</span>
          <span class="fs-tag">{{ e.ending }}</span>
          <span class="fs-tag" :class="'src-' + (e.source_type === '法院文书' ? 'court' : 'media')">
            {{ e.source_type }}
          </span>
        </div>
        <p class="fs-co">{{ e.company }}</p>
      </li>
    </ul>

    <p v-else class="fs-empty">没有匹配的条目。去掉一个条件，或者换个更短的关键词。</p>
  </div>
</template>

<style scoped>
.fs {
  margin: 1.5rem 0;
}
.fs-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.fs-q {
  flex: 1 1 220px;
  min-width: 0;
  padding: 7px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.fs-cnt,
.fs-hint {
  font-size: 13px;
  color: var(--vp-c-text-3);
}
.fs-reset {
  font-size: 13px;
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
.fs-row {
  display: flex;
  gap: 10px;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.fs-label {
  flex: 0 0 62px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.fs-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.fs-chip {
  padding: 2px 10px;
  font-size: 13px;
  line-height: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
}
.fs-chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.fs-chip.on {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}
.fs-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0;
  display: grid;
  gap: 10px;
}
.fs-card {
  padding: 14px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}
.fs-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.fs-title:hover {
  color: var(--vp-c-brand-1);
}
.fs-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.fs-tag {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}
/* 两档来源：法院文书 = 绿，公开报道 = 灰 */
.src-court {
  background: rgba(24, 121, 78, 0.14);
  color: #18794e;
}
.src-media {
  background: rgba(140, 140, 140, 0.16);
  color: var(--vp-c-text-2);
}
.fs-co {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.fs-empty {
  margin-top: 2rem;
  color: var(--vp-c-text-3);
}
</style>
