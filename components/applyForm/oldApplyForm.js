import React, { useState, useEffect, useCallback } from 'react'
import {
  CButton,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTable,
} from '@coreui/react'
import styles from '@/styles/application.module.scss'
import useCompareInfo from '@/hooks/useCompareInfo'

export default function OldApplyForm({
  visibleOld,
  handleCloseModalOld,
  updateForm,
  compareData,
}) {
  const { getCompareApply, loading, error } = useCompareInfo()
  const columns = [
    {
      key: 'id',
      label: 'ApplyNo.',
      _props: { scope: 'col' },
    },
    {
      key: 'Sourcer',
      _props: { scope: 'col' },
    },
    {
      key: 'ApplyDate',
      label: 'Apply Date',
      _props: { scope: 'col' },
    },
  ]

  const [items, setItems] = useState([
    {
      id: '2024120005',
      Sourcer: '廖俊清',
      ApplyDate: '2024-12-01',
    },
    { id: '2024120007', Sourcer: '廖俊清', ApplyDate: '2024-12-10' },
    { id: '2024120009', Sourcer: '廖俊清', ApplyDate: '2024-12-15' },
  ])

  const [visibleUnit, setVisibleUnit] = useState(visibleOld)

  const handleSubmitOldForm = async (applyNo) => {
    const dataDB = await getCompareApply(applyNo)
    if (error) return <p>Error: {error.message}</p>
    if (!loading) {
      updateForm({
        compare_data: dataDB.data.compare_data,
        compare_apply: dataDB.data.compare_apply,
      })
      handleCloseModalOld()
    }
  }

  useEffect(() => {
    setVisibleUnit(visibleOld)
  }, [visibleOld])

  useEffect(() => {
    setItems(compareData)
  }, [compareData])
  return (
    <>
      <CModal
        alignment="center"
        visible={!!visibleUnit}
        aria-labelledby={`modelOld`}
        backdrop="static"
        onClose={() => handleCloseModalOld()}
      >
        <CModalHeader className="text-center center-flex" closeButton={false}>
          {/* <CModalTitle id={`modelOld`} className="primary h3 ">
            <div className="d-flex">
              <span>Sourcer：</span>
              <CFormInput />
            </div>
          </CModalTitle> */}
        </CModalHeader>
        <CModalBody className="center-flex flex-column">
          <span className="primary h3">ApplyForm List</span>
          <CTable
            className={`h5 text-center ${styles.formApplication} mb-5`}
            columns={columns}
            items={items.map((item, i) => {
              return {
                id: (
                  <>
                    <CButton
                      color="link"
                      onClick={() => {
                        handleSubmitOldForm(item.apply_no)
                      }}
                    >
                      {item.apply_no}
                    </CButton>
                  </>
                ),
                Sourcer: <>{item.buyer}</>,
                ApplyDate: <>{item.apply_date}</>,
              }
            })}
            bordered
            borderColor="dark"
            tableHeadProps={{ color: 'primary' }}
            color="light"
          />
        </CModalBody>
        <CModalFooter>
          <CButton
            onClick={handleCloseModalOld}
            className="px-4"
            color="secondary"
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}
