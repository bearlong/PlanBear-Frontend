import React, { useState, useEffect } from 'react'
import {
  CContainer,
  CRow,
  CCol,
  CFormTextarea,
  CFormSelect,
  CFormInput,
} from '@coreui/react'
import Select from 'react-select'
import styles from '@/styles/application.module.scss'

export default function ApplyFormTitle({
  applyForm,
  isEdit = false,
  sapSourcer,
  setItemApply,
}) {
  const [form, setForm] = useState({})
  const [sourcerOption, setSourcerOption] = useState([])
  const options = [
    { label: '', value: '' }, // 空白選項（可不要）
    ...sourcerOption.map((item) => ({
      label: `${item.name} (${item.username})`,
      value: item.code, // ⬅️ 主鍵（字串/數字都可）
      data: item, // ⬅️ 原物件放在這裡
    })),
  ]

  const selectedOption = form.sap_sourcer
    ? options.find((o) => o.value === form.sap_sourcer.code) ?? null
    : null
  const handleChangeMemo = (e, value) => {
    if (value === 'sap_sourcer') {
      console.log(form.sap_sourcer, e)
      setForm({ ...form, [value]: e })
      setItemApply({ ...form, [value]: e })
    } else {
      setForm({ ...form, [value]: e.target.value })
      setItemApply({ ...form, [value]: e.target.value })
    }
  }
  useEffect(() => {
    if (applyForm) {
      setForm(applyForm)
    }
  }, [applyForm])
  useEffect(() => {
    if (sapSourcer) {
      setSourcerOption(sapSourcer)
    }
  }, [sapSourcer])
  return (
    <>
      <CContainer className="h3 bg-white p-4 shadow rounded">
        <CRow className="mb-4">
          <CCol xs={12} lg={4}>
            <div className="d-flex justify-content-start mb-3 fw-bold text-dark">
              Application No.
            </div>
            <div className=" d-flex justify-content-start">
              <CFormInput
                className="p"
                value={form?.apply_no || ''}
                size="lg"
                disabled
              />
            </div>
          </CCol>
          <CCol>
            <div className="d-flex justify-content-start text-dark fw-bold mb-3">
              Source
            </div>
            <div className="d-flex justify-content-start fw-bold">
              <CFormInput
                className="p"
                value={form.buyer?.name || ''}
                size="lg"
                disabled
              />
            </div>
          </CCol>

          <CCol className={` `}>
            <div className="d-flex justify-content-start text-dark fw-bold mb-3">
              SAP Sourcer
            </div>
            <Select
              instanceId="sap-sourcer-select"
              inputId="sap-sourcer-select-input"
              className="p"
              options={options}
              isDisabled={!isEdit}
              isClearable
              placeholder=""
              onChange={(e) => {
                // opt 可能為 null（清除）
                const picked = e?.data ?? null
                handleChangeMemo(picked, 'sap_sourcer')
              }}
              value={selectedOption}
            />
          </CCol>
        </CRow>
        <CRow>
          <CCol>
            <div className="d-flex justify-content-start text-dark fw-bold mb-3">
              MEMO
            </div>
            <CFormTextarea
              className={`w-100 px-2 p`}
              name=""
              id=""
              rows={3}
              style={{
                resize: 'none',
                overflow: 'auto',
                fontSize: '1.6rem',
              }}
              value={form.memo ?? ''}
              onChange={(e) => {
                handleChangeMemo(e, 'memo')
              }}
              placeholder="Enter memo..."
              disabled={!isEdit}
            ></CFormTextarea>
          </CCol>
        </CRow>
      </CContainer>
    </>
  )
}
