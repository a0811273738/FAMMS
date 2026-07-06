import { describe, it, expect } from 'vitest'
import { t, fmtMoney } from './index'
import en from './en'
import id from './id'

describe('i18n', () => {
  it('t() 查無翻譯時回傳中文原文（node 環境預設 zh）', () => {
    expect(t('密碼錯誤')).toBe('密碼錯誤')
    expect(t('不存在的字串')).toBe('不存在的字串')
  })

  it('t() 參數插值', () => {
    expect(t('預設密碼：老闆 {a} · 員工 {b}', { a: '1234', b: '0000' }))
      .toBe('預設密碼：老闆 1234 · 員工 0000')
  })

  it('en/id 字典 key 一致（避免只翻一邊）', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(id).sort())
  })

  it('fmtMoney 預設 NT$（zh），千分位逗號', () => {
    expect(fmtMoney(15000)).toBe('NT$ 15,000')
    expect(fmtMoney(-500)).toBe('−NT$ 500')
    expect(fmtMoney(0)).toBe('NT$ 0')
  })
})
