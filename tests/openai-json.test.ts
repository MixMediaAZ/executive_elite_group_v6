import { extractJsonObject } from '@/lib/ai/openai-json'

describe('extractJsonObject', () => {
  test('parses raw JSON', () => {
    const obj = extractJsonObject<{ a: number }>('{\"a\":1}')
    expect(obj).toEqual({ a: 1 })
  })

  test('parses fenced JSON', () => {
    const obj = extractJsonObject<{ ok: boolean }>('```json\n{\"ok\":true}\n```')
    expect(obj).toEqual({ ok: true })
  })

  test('parses JSON embedded in prose', () => {
    const raw = 'Here you go:\\n{\"x\":\"y\"}\\nThanks!'
    const obj = extractJsonObject<{ x: string }>(raw)
    expect(obj).toEqual({ x: 'y' })
  })

  test('throws when no JSON present', () => {
    expect(() => extractJsonObject('no json here')).toThrow('AI response was not valid JSON')
  })
})

