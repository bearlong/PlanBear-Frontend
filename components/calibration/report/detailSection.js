import { CTableDataCell, CTableRow } from '@coreui/react'

export default function DetailSection({ title, children, colSpan = 6 }) {
  return (
    <CTableRow>
      <CTableDataCell colSpan={colSpan} className="p-0">
        <div className="p-3 bg-light p">
          <div className="fw-semibold mb-3">{title}</div>
          {children}
        </div>
      </CTableDataCell>
    </CTableRow>
  )
}
