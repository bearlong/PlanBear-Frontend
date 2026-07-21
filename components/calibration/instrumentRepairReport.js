import React, { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { FaXmark } from 'react-icons/fa6'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormTextarea,
  CRow,
} from '@coreui/react'
import { FiTrash2, FiUpload } from 'react-icons/fi'
import useFileManagement from '@/hooks/useFileManagement'
import { api } from '@/utils/api'
import styles from '@/styles/calibration.module.scss'

export default function InstrumentRepairReport({
  data: { repairStatusForms, errors, isFinished },
  actions: {
    onClearReports,
    onUploadReports,
    onDeleteReports,
    onRepairStatusChange,
  },
}) {
  const { handlePreview } = useFileManagement()

  function truncateFileName(name, length = 10) {
    if (!name) return ''
    return name.length > length ? `${name.slice(0, length)}...` : name
  }

  return (
    <>
      <CCard className="border-0 shadow-sm mt-4">
        <CCardHeader className="bg-white border-bottom-0 pt-4 px-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h5 className="mb-1 text-danger">
                Instrument Calibration Staff Editing Form
              </h5>
              <p className="text-muted mb-0 p">
                Edit repair progress, return date, and maintenance report for
                each instrument.
              </p>
            </div>
          </div>
        </CCardHeader>
        <CCardBody className="pt-2 px-4 pb-4">
          <div className="d-flex flex-column gap-3">
            {repairStatusForms.map((item, index) => (
              <div
                key={item.id}
                className="border rounded-4 p-3 p-lg-4 bg-white shadow-sm"
              >
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <div>
                    <h6 className="mb-1">Repair Tracking #{index + 1}</h6>
                    <p className="text-muted mb-0 small">
                      {item.property_no} / {item.instru_name}
                    </p>
                  </div>
                </div>

                <CRow className="g-3">
                  <CCol xl={2} md={6}>
                    <div className="border rounded-4 h-100 p-3 bg-light">
                      <div className="text-muted small fw-bold mb-2 p">
                        Repair No.
                      </div>
                      <CFormInput
                        invalid={Boolean(errors[item.id]?.repair_order_number)}
                        value={item.repair_order_number}
                        disabled={isFinished}
                        onChange={(event) =>
                          onRepairStatusChange(
                            item.id,
                            'repair_order_number',
                            event.target.value
                          )
                        }
                        className="p"
                        placeholder="Enter repair no"
                      />
                      {errors[item.id]?.repair_order_number ? (
                        <div className="text-danger small mt-1">
                          {errors[item.id].repair_order_number}
                        </div>
                      ) : null}
                    </div>
                  </CCol>
                  <CCol xl={2} md={6}>
                    <div className="border rounded-4 h-100 p-3 bg-light">
                      <div className="text-muted small fw-bold mb-2 p">
                        Repair Date
                      </div>
                      <CFormInput
                        type="date"
                        value={item.repair_date}
                        invalid={Boolean(errors[item.id]?.repair_date)}
                        disabled={isFinished}
                        className="p"
                        onChange={(event) =>
                          onRepairStatusChange(
                            item.id,
                            'repair_date',
                            event.target.value
                          )
                        }
                      />
                      {errors[item.id]?.repair_date ? (
                        <div className="text-danger small mt-1">
                          {errors[item.id].repair_date}
                        </div>
                      ) : null}
                    </div>
                  </CCol>
                  <CCol xl={2} md={6}>
                    <div className="border rounded-4 h-100 p-3 bg-light">
                      <div className="text-muted small fw-bold mb-2 p">
                        Revised Date
                      </div>
                      <CFormInput
                        type="date"
                        value={item.revised_date}
                        invalid={Boolean(errors[item.id]?.revised_date)}
                        disabled={isFinished}
                        onChange={(event) =>
                          onRepairStatusChange(
                            item.id,
                            'revised_date',
                            event.target.value
                          )
                        }
                        className="p"
                      />
                      {errors[item.id]?.revised_date ? (
                        <div className="text-danger small mt-1">
                          {errors[item.id].revised_date}
                        </div>
                      ) : null}
                    </div>
                  </CCol>
                  <CCol xl={4} md={12}>
                    <div className="border rounded-4 h-100 p-3 bg-warning bg-opacity-10 border-warning">
                      <div className="text-dark small fw-bold mb-2 p">
                        Repair Status Description
                      </div>
                      <CFormTextarea
                        rows={4}
                        value={item.memo}
                        invalid={Boolean(errors[item.id]?.memo)}
                        disabled={isFinished}
                        onChange={(event) =>
                          onRepairStatusChange(
                            item.id,
                            'memo',
                            event.target.value
                          )
                        }
                        className="p"
                        placeholder="Describe repair progress or maintenance status"
                      />
                      {errors[item.id]?.memo ? (
                        <div className="text-danger small mt-1">
                          {errors[item.id].memo}
                        </div>
                      ) : null}
                    </div>
                  </CCol>
                  <CCol xl={2} md={12}>
                    <div className="border rounded-4 h-100 p-3 bg-light">
                      <div className="text-muted small fw-bold mb-2 p">
                        Maintenance Report
                      </div>
                      <label className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 mb-2">
                        <FiUpload />
                        Upload file
                        <input
                          type="file"
                          hidden
                          disabled={isFinished}
                          onChange={(event) => {
                            onUploadReports(item, event)
                            event.target.value = null
                          }}
                        />
                      </label>
                      <CButton
                        color="danger"
                        variant="outline"
                        className="d-flex align-items-center justify-content-center gap-2 w-100"
                        onClick={() => onClearReports(item)}
                        disabled={isFinished || item.AttachFile.length === 0}
                      >
                        <FiTrash2 />
                        Delete file
                      </CButton>
                      <div className="small text-muted mt-2 text-break">
                        {item.AttachFile.length === 0 ? (
                          <span className="text-muted p">
                            No reports uploaded yet.
                          </span>
                        ) : (
                          item.AttachFile.map((report, index) => (
                            <div
                              className="d-flex align-items-center"
                              key={index}
                            >
                              <button
                                className="center-flex border border-2 border-dark p-2 rounded h5 fw-bold m-0"
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (report.preview) {
                                    handlePreview(report.preview)
                                  } else {
                                    const filename = encodeURIComponent(
                                      report.file.name
                                    )
                                    const url = api(
                                      `/data/files?filename=calibration/${filename}`
                                    )
                                    window.open(url, '_blank')
                                  }
                                }}
                              >
                                <div className={styles.imgbox}>
                                  <Image
                                    src={report.icon} // 動態圖示
                                    alt="file-icon"
                                    width={20}
                                    height={20}
                                  />
                                </div>
                                {truncateFileName(
                                  report.file_url ?? report.file?.name
                                )}
                                <FaXmark
                                  size={16}
                                  className="text-danger"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (isFinished) return
                                    onDeleteReports(item, report)
                                  }}
                                  cursor={'pointer'}
                                ></FaXmark>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CCol>
                </CRow>
              </div>
            ))}
          </div>
        </CCardBody>
      </CCard>
    </>
  )
}
