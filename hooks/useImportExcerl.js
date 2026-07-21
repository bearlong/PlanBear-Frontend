import React, { useState } from 'react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const useImportExcerl = () => {
  const parseExcelFile = async (file, processRowCallback) => {
    // return new Promise((resolve, reject) => {
    //   const reader = new FileReader()
    //   reader.onload = (e) => {
    //     try {
    //       const arrayBuffer = new Uint8Array(e.target.result)
    //       const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    //       const sheetName = workbook.SheetNames[0]
    //       const worksheet = workbook.Sheets[sheetName]
    //       const rows = XLSX.utils.sheet_to_json(worksheet, {
    //         header: 1,
    //         defval: '',
    //       })
    //       // 通用部分
    //       const result = rows.slice(1).map((row, rowIndex) => {
    //         return processRowCallback(row, rowIndex)
    //       })
    //       resolve(result)
    //     } catch (error) {
    //       reject(error)
    //     }
    //   }
    //   reader.onerror = (error) => {
    //     reject(error)
    //   }
    //   reader.readAsArrayBuffer(file)
    // })
  }

  const downloadForExcel = async (
    data,
    fileName = 'list.xlsx',
    config = {}
  ) => {
    const {
      sheetName = '試算表',
      headerStyle = {},
      bodyStyle = {},
      autoWidth = true,
      minWidth = 10,
      maxWidth = 40,
      columns = {},
      conditionalStyles = [],
      freezeHeader = true,
      autoFilter = true,
    } = config
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    data.forEach((row) => {
      worksheet.addRow(row)
    })

    if (freezeHeader) {
      worksheet.views = [{ state: 'frozen', ySplit: 1 }]
    }

    if (autoFilter && worksheet.rowCount > 0 && worksheet.columnCount > 0) {
      const headerRow = worksheet.getRow(1)

      if (headerRow?.cellCount > 0) {
        worksheet.autoFilter = {
          from: 'A1',
          to: headerRow.getCell(headerRow.cellCount).address,
        }
      }
    }

    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell) => {
      Object.assign(cell, {
        style: {
          ...cell.style,
          ...headerStyle,
        },
      })
    })

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return

      row.eachCell((cell, colNumber) => {
        cell.style = {
          ...cell.style,
          ...bodyStyle,
        }

        for (const rule of conditionalStyles) {
          if (
            rule.column === colNumber &&
            rule.match?.(cell.value, row, cell)
          ) {
            cell.style = {
              ...cell.style,
              ...rule.style,
            }
          }
        }
      })
    })

    worksheet.columns.forEach((column, index) => {
      const columnConfig = columns[index + 1]

      if (columnConfig?.width) {
        column.width = columnConfig.width
        return
      }

      if (!autoWidth) return

      let longest = minWidth

      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value == null ? '' : String(cell.value)
        longest = Math.max(longest, value.length + 2)
      })

      column.width = Math.min(longest, maxWidth)
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, fileName)
  }

  return { parseExcelFile, downloadForExcel }
}

export default useImportExcerl
