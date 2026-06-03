import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { HistoricalRecord } from '../types'
import type { DatasetAggregates } from '../types/dataset'

export function exportHistoricalPdf(
  records: HistoricalRecord[],
  title: string,
  headers: string[]
) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    head: [headers],
    body: records.slice(0, 100).map((r) => [
      r.date,
      r.time,
      String(r.predictedCount),
      String(r.actualCount),
      `${r.accuracy}%`,
      r.riskLevel,
      String(r.waitingTime),
    ]),
    startY: 24,
  })
  doc.save('er-historical-report.pdf')
}

export function exportHistoricalExcel(records: HistoricalRecord[], sheetName: string) {
  const ws = XLSX.utils.json_to_sheet(
    records.map((r) => ({
      Date: r.date,
      Time: r.time,
      Predicted: r.predictedCount,
      Actual: r.actualCount,
      Accuracy: r.accuracy,
      Risk: r.riskLevel,
      WaitMin: r.waitingTime,
    }))
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, 'er-historical-report.xlsx')
}

export function exportWeeklyReport(
  aggregates: DatasetAggregates,
  hospital: string,
  labels: { title: string; kpi: string; admissions: string }
) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text(labels.title, 14, 20)
  doc.setFontSize(11)
  doc.text(`${labels.kpi}: ${hospital}`, 14, 30)
  aggregates.kpiCards.forEach((k, i) => {
    doc.text(`${k.id}: ${k.value}${k.unit ?? ''} (${k.change}%)`, 14, 40 + i * 8)
  })
  autoTable(doc, {
    head: [[labels.admissions, 'Count']],
    body: aggregates.monthlyAdmissions.map((m) => [m.month, String(m.admissions)]),
    startY: 90,
  })
  doc.save('er-weekly-report.pdf')
}
