import { api } from '@/utils/api'
import {
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import useUserPermissions from '@/hooks/useUserPermissions'

const formatDate = (value) => {
  if (!value) return '-'
  return value.toString().slice(0, 10)
}

export default function LogHistory({
  history,
  selectable = false,
  selectedLogId = null,
  onSelect = () => {},
  onDelete = () => {},
}) {
  const { hasModuleAccess, handlePermissionGuard } = useUserPermissions()

  return (
    <div className="border rounded-4 shadow-sm bg-white p">
      <CTable hover responsive align="middle" className="mb-0">
        <CTableHead>
          <CTableRow>
            {selectable && (
              <CTableHeaderCell className="py-3 ps-3">Action</CTableHeaderCell>
            )}
            <CTableHeaderCell className="py-3 ps-3">
              Due Date(下次校正日)
            </CTableHeaderCell>
            <CTableHeaderCell className="py-3">
              Calibration Date(校正日期)
            </CTableHeaderCell>
            <CTableHeaderCell className="py-3 pe-3">
              Report File(報告文件)
            </CTableHeaderCell>
            <CTableHeaderCell className="py-3 pe-3">
              Remark(備註)
            </CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {history.length === 0 ? (
            <CTableRow>
              <CTableDataCell
                colSpan={selectable ? 5 : 4}
                className="text-center py-4"
              >
                <span className="text-muted">No history records yet.</span>
              </CTableDataCell>
            </CTableRow>
          ) : (
            history.map((record) => (
              <CTableRow
                key={record.id}
                color={selectedLogId === record.id ? 'info' : undefined}
              >
                {selectable && (
                  <CTableDataCell className="ps-3 d-flex gap-2">
                    <CButton
                      size="lg"
                      color={
                        selectedLogId === record.id ? 'primary' : 'secondary'
                      }
                      variant={
                        selectedLogId === record.id ? undefined : 'outline'
                      }
                      onClick={() => onSelect(record)}
                    >
                      {selectedLogId === record.id ? 'Editing' : 'Edit'}
                    </CButton>

                    {hasModuleAccess('Calibration_boss') && (
                      <CButton
                        size="lg"
                        color="danger"
                        variant="outline"
                        onClick={() => onDelete(record)}
                      >
                        Del
                      </CButton>
                    )}
                  </CTableDataCell>
                )}

                <CTableDataCell className="ps-3">
                  {formatDate(record.due_date)}
                </CTableDataCell>
                <CTableDataCell>
                  {record.change_date ? formatDate(record.change_date) : '-'}
                  <span className="text-danger"> ({record.status})</span>
                </CTableDataCell>
                <CTableDataCell className="pe-3">
                  {record.calibration_log_file?.length > 0 ? (
                    record.calibration_log_file.map((file, index) => (
                      <div key={file.id || index}>
                        <button
                          type="button"
                          className="btn btn-link p"
                          onClick={() => {
                            const filename = file.file_url

                            const url =
                              process.env.NEXT_PUBLIC_USE_MOCK === 'true'
                                ? `/demo-files/calibration/${encodeURIComponent(
                                    filename
                                  )}`
                                : api(
                                    `/data/files?filename=${encodeURIComponent(
                                      `calibration/${filename}`
                                    )}`
                                  )

                            window.open(url, '_blank', 'noopener,noreferrer')
                          }}
                        >
                          {file.file_url.length > 20
                            ? `${file.file_url.slice(0, 20)}...`
                            : file.file_url || `Report ${index + 1}`}
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted">No report file</span>
                  )}
                </CTableDataCell>
                <CTableDataCell className="pe-3">
                  {record.remark || '-'}
                </CTableDataCell>
              </CTableRow>
            ))
          )}
        </CTableBody>
      </CTable>
    </div>
  )
}
