"use client"

import { formatDateTimeValue } from "@/lib/utils"

export type ExcelColumn<T extends Record<string, unknown>> = {
  header: string
  key: keyof T
  width?: number
}

export type ExcelSheet<T extends Record<string, unknown>> = {
  name: string
  title: string
  subtitle?: string
  columns: ExcelColumn<T>[]
  rows: T[]
}

type WorkbookInput = {
  fileName: string
  subject?: string
  sheets: ExcelSheet<Record<string, unknown>>[]
}

const HEADER_FILL = "1D4ED8"
const TITLE_FILL = "0F172A"
const BORDER = "D7DFEA"
const ALT_FILL = "F8FAFC"

const normalizeSheetName = (value: string) =>
  value.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31) || "Export"

const normalizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 120) || "export"

const normalizeCellValue = (value: unknown): string | number | boolean => {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "number" || typeof value === "boolean") return value
  if (value instanceof Date) return formatDateTimeValue(value, "-")
  return String(value)
}

export async function exportStyledWorkbook({ fileName, subject, sheets }: WorkbookInput) {
  if (!sheets.length) return

  const ExcelJS = await import("exceljs")
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "MDM"
  workbook.company = "MDM"
  workbook.subject = subject || "Export"
  workbook.created = new Date()
  workbook.modified = new Date()

  for (const sheetDef of sheets) {
    const hasSubtitle = Boolean(sheetDef.subtitle)
    const worksheet = workbook.addWorksheet(normalizeSheetName(sheetDef.name), {
      views: [{ state: "frozen", ySplit: hasSubtitle ? 3 : 2 }],
    })

    const columnCount = Math.max(sheetDef.columns.length, 1)
    const titleRow = worksheet.getRow(1)
    worksheet.mergeCells(1, 1, 1, columnCount)
    titleRow.getCell(1).value = sheetDef.title
    titleRow.height = 24
    titleRow.getCell(1).font = { bold: true, size: 15, color: { argb: "FFFFFFFF" } }
    titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_FILL } }
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" }

    if (hasSubtitle) {
      const subtitleRow = worksheet.getRow(2)
      worksheet.mergeCells(2, 1, 2, columnCount)
      subtitleRow.getCell(1).value = sheetDef.subtitle
      subtitleRow.height = 20
      subtitleRow.getCell(1).font = { italic: true, size: 10, color: { argb: "475569" } }
      subtitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "EFF6FF" } }
      subtitleRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" }
    }

    worksheet.columns = sheetDef.columns.map((column) => ({
      key: String(column.key),
      width: column.width || Math.max(column.header.length + 4, 16),
    }))

    const headerRowNumber = hasSubtitle ? 3 : 2
    const headerRow = worksheet.getRow(headerRowNumber)
    headerRow.height = 22
    sheetDef.columns.forEach((column, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = column.header
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } }
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
      cell.border = {
        top: { style: "thin", color: { argb: BORDER } },
        left: { style: "thin", color: { argb: BORDER } },
        bottom: { style: "thin", color: { argb: BORDER } },
        right: { style: "thin", color: { argb: BORDER } },
      }
    })

    sheetDef.rows.forEach((rowData, rowIndex) => {
      const row = worksheet.addRow(
        Object.fromEntries(
          sheetDef.columns.map((column) => [String(column.key), normalizeCellValue(rowData[column.key])]),
        ),
      )
      row.height = 20
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true }
        cell.border = {
          top: { style: "thin", color: { argb: BORDER } },
          left: { style: "thin", color: { argb: BORDER } },
          bottom: { style: "thin", color: { argb: BORDER } },
          right: { style: "thin", color: { argb: BORDER } },
        }
        if (rowIndex % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT_FILL } }
        }
      })
    })

    worksheet.autoFilter = {
      from: { row: headerRowNumber, column: 1 },
      to: { row: headerRowNumber, column: columnCount },
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${normalizeFileName(fileName)}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}
