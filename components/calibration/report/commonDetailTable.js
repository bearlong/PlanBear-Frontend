import {
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

export default function CommonDetailTable({ columns, data, emptyText }) {
  return (
    <CTable small responsive align="middle" className="mb-0 bg-white">
      <CTableHead>
        <CTableRow className="text-center">
          {columns.map((col) => (
            <CTableHeaderCell key={col.key}>{col.label}</CTableHeaderCell>
          ))}
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {data.length === 0 ? (
          <CTableRow>
            <CTableDataCell
              colSpan={columns.length}
              className="text-center text-muted py-4"
            >
              {emptyText}
            </CTableDataCell>
          </CTableRow>
        ) : (
          data.map((row) => (
            <CTableRow key={row.id} className="text-center">
              {columns.map((col) => (
                <CTableDataCell key={col.key}>
                  {col.render ? col.render(row) : row[col.key] || '-'}
                </CTableDataCell>
              ))}
            </CTableRow>
          ))
        )}
      </CTableBody>
    </CTable>
  )
}
