/** Minimal RFC-style CSV row parser (quoted fields supported). */
export function parseCsvRow(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  fields.push(cur.trim())
  return fields
}

export function parseCsv(text: string): string[][] {
  return text.trim().split(/\r?\n/).map(parseCsvRow)
}
