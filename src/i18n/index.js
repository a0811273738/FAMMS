// 極簡 i18n — 中文原文即 key，查無翻譯回傳原文（漸進遷移安全）
// 切換語言採 localStorage + reload，不需 React context
import en from './en'
import id from './id'

const dicts = { en, id }
export const LANG_KEY = 'pos-lang'

const storage = typeof localStorage !== 'undefined' ? localStorage : null

export function getLang() {
  return storage?.getItem(LANG_KEY) || 'zh'
}

export const LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Bahasa Indonesia' },
]

const dict = dicts[getLang()] || null

export function t(zh, params) {
  let s = (dict && dict[zh]) || zh
  if (params) for (const k in params) s = s.replaceAll(`{${k}}`, params[k])
  return s
}

export function setLang(code) {
  storage?.setItem(LANG_KEY, code)
  location.reload()
}

export function getLocale() {
  return { zh: 'zh-TW', en: 'en-US', id: 'id-ID' }[getLang()]
}

// 貨幣：印尼 Rp 千分位用「.」無小數；台灣 NT$ 用「,」
export const CURRENCY_KEY = 'pos-currency'

export function getCurrency() {
  return storage?.getItem(CURRENCY_KEY) || (getLang() === 'zh' ? 'NT$' : 'Rp')
}

export function setCurrency(cur) {
  storage?.setItem(CURRENCY_KEY, cur)
}

export function fmtMoney(n) {
  const cur = getCurrency()
  const locale = cur === 'Rp' ? 'id-ID' : 'zh-TW'
  const v = Math.round(Number(n) || 0)
  const sign = v < 0 ? '−' : ''
  return `${sign}${cur} ${Math.abs(v).toLocaleString(locale)}`
}
