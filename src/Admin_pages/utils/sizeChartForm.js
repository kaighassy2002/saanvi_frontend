export const SIZE_CHART_TYPES = [
  { value: 'ring', label: 'Ring', hint: 'Finger sizes with US / Indian mm' },
  { value: 'bangle', label: 'Bangle', hint: 'Diameter and wrist circumference' },
  { value: 'bracelet', label: 'Bracelet', hint: 'Length and fit guide' },
  { value: 'general', label: 'General', hint: 'Simple size & measurement pairs' },
]

export const SIZE_CHART_TEMPLATES = {
  ring: {
    name: 'Ring size guide',
    type: 'ring',
    columns: ['Size', 'US', 'IN (mm)'],
    gridRows: [
      ['6', '4', '14.9'],
      ['7', '5', '15.7'],
      ['8', '6', '16.5'],
      ['9', '7', '17.3'],
      ['10', '8', '18.1'],
    ],
  },
  bangle: {
    name: 'Bangle size guide',
    type: 'bangle',
    columns: ['Size', 'Diameter (in)', 'Circumference (in)'],
    gridRows: [
      ['2.2', '2.2', '6.9'],
      ['2.4', '2.4', '7.5'],
      ['2.6', '2.6', '8.1'],
      ['2.8', '2.8', '8.7'],
    ],
  },
  bracelet: {
    name: 'Bracelet size guide',
    type: 'bracelet',
    columns: ['Size', 'Length (in)', 'Wrist fit'],
    gridRows: [
      ['S', '6.5', 'Up to 5.5"'],
      ['M', '7.0', '5.5" – 6.5"'],
      ['L', '7.5', '6.5" – 7.5"'],
    ],
  },
  general: {
    name: 'Size guide',
    type: 'general',
    columns: ['Size', 'Measurement'],
    gridRows: [
      ['S', ''],
      ['M', ''],
      ['L', ''],
    ],
  },
}

export function emptySizeChartForm() {
  const t = SIZE_CHART_TEMPLATES.general
  return {
    name: '',
    type: 'general',
    columns: [...t.columns],
    gridRows: t.gridRows.map((row) => [...row]),
  }
}

export function templateToForm(templateKey) {
  const t = SIZE_CHART_TEMPLATES[templateKey] || SIZE_CHART_TEMPLATES.general
  return {
    name: t.name,
    type: t.type,
    columns: [...t.columns],
    gridRows: t.gridRows.map((row) => [...row]),
  }
}

export function rowsToGrid(rows) {
  if (!Array.isArray(rows) || !rows.length) {
    const empty = emptySizeChartForm()
    return { columns: empty.columns, gridRows: empty.gridRows }
  }

  const first = rows[0]
  if (first?.label != null || first?.value != null) {
    return {
      columns: ['Size', 'Measurement'],
      gridRows: rows.map((r) => [String(r.label || ''), String(r.value || '')]),
    }
  }

  const columns = Object.keys(first)
  return {
    columns,
    gridRows: rows.map((r) => columns.map((col) => String(r[col] ?? ''))),
  }
}

export function gridToRows(columns, gridRows) {
  const headers = columns.map((c) => c.trim()).filter(Boolean)
  if (!headers.length) return []

  return gridRows
    .map((row) => {
      const obj = {}
      headers.forEach((header, i) => {
        obj[header] = String(row[i] ?? '').trim()
      })
      return obj
    })
    .filter((row) => Object.values(row).some((v) => v))
}

export function chartToForm(chart) {
  const { columns, gridRows } = rowsToGrid(chart?.rows)
  return {
    name: chart?.name || '',
    type: chart?.type || 'general',
    columns,
    gridRows: gridRows.length ? gridRows : [['']],
  }
}

export function getChartColumns(rows) {
  if (!Array.isArray(rows) || !rows.length) return []
  const first = rows[0]
  if (first?.label != null || first?.value != null) return ['Size', 'Measurement']
  return Object.keys(first)
}

export function getChartPreviewRows(rows, limit = 4) {
  if (!Array.isArray(rows) || !rows.length) return []
  const columns = getChartColumns(rows)
  return rows.slice(0, limit).map((row) => {
    if (row?.label != null || row?.value != null) {
      return { cells: [row.label, row.value] }
    }
    return { cells: columns.map((col) => row[col] ?? '') }
  })
}
