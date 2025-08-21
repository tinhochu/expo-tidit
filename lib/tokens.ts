export function fillTokens(text: string, data: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => (data[k] ?? '').toString())
}
