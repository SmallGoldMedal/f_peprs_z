// src/composables/useAutoSave.js
import { watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

export function useAutoSave(data, key = null, options = { debounce: 500 }) {
const route = useRoute()
const storageKey = key || `auto_save_${route.path}`

// 恢复数据
const restore = () => {
const saved = sessionStorage.getItem(storageKey)
if (saved) {
try {
const parsed = JSON.parse(saved)
Object.assign(data, parsed)
} catch (e) {}
}
}

// 保存数据（防抖）
let timer = null
const save = () => {
if (timer) clearTimeout(timer)
timer = setTimeout(() => {
const toSave = {}
for (const key in data) {
if (Object.prototype.hasOwnProperty.call(data, key)) {
toSave[key] = data[key]
}
}
sessionStorage.setItem(storageKey, JSON.stringify(toSave))
}, options.debounce)
}

// 监听数据变化
watch(data, () => save(), { deep: true })

// 组件挂载时恢复
onMounted(() => restore())

// 组件卸载前可保留数据（不清除，等待下次登录恢复）
// 若希望登出后清除，可以在 logout 时统一清除，但这里保留
return { restore, save }
}