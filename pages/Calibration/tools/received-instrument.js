import React, { useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormInput,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { FiArrowLeft, FiCheckCircle, FiPlus, FiTrash2 } from 'react-icons/fi'
import InstrumentTable from '@/components/calibration/instrumentTable'
import SelectModal from '@/components/calibration/selectModal'
import sharedStyles from '@/styles/calibration.module.scss'
import styles from '@/styles/calibration-tools.module.scss'
import { useToast } from '@/hooks/useToast'
import { toolService } from '@/services/Calibration/toolService'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const formatToday = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = `${today.getMonth() + 1}`.padStart(2, '0')
  const day = `${today.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

const createQueueItemFromInstrument = (instrument) => ({
  id: instrument.id,
  propertyNo: instrument.property_no || '',
  instrumentName: instrument.instrument?.instru_name || '',
  model: instrument.model || '',
  applicant: instrument.owner || '',
  dept: instrument.dept || '',
  vendor: instrument.vendor || '',
  calibr_class: instrument.calibr_class || '',
  calibr_cycle: instrument.calibr_cycle || '',
  status: instrument.status || '',
})

export default function ReceivedInstrumentPage() {
  usePermissionGuard('Calibration')
  const router = useRouter()
  const [queueItems, setQueueItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const toast = useToast()

  const pendingCount = useMemo(() => {
    return queueItems.length
  }, [queueItems])

  // Reuse the existing instrument selector so this page stays aligned with
  // the rest of the calibration workflow.
  const handleSelectInstrument = (event, selectedInstrument) => {
    event.preventDefault()

    const instruments = Array.isArray(selectedInstrument)
      ? selectedInstrument
      : [selectedInstrument]

    setQueueItems((prev) => {
      const existingIds = new Set(prev.map((item) => item.id))

      const newItems = instruments
        .filter((item) => !existingIds.has(item.id))
        .map((item) => createQueueItemFromInstrument(item))

      return [...prev, ...newItems]
    })

    setShowModal(false)
  }

  const handleRemoveItem = (id) => {
    setQueueItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSubmit = async () => {
    if (queueItems.length === 0) {
      toast.error('Please add at least one instrument before submitting.')
      return
    }

    if (queueItems.some((item) => item.status === 'Calibration')) {
      toast.error(
        'Some instruments are still in Calibration status. Please remove them before submitting.'
      )
      return
    }

    const ids = queueItems.map((item) => item.id)
    const result = await toolService.receivedInstrument(ids)
    if (result.status === 'success') {
      toast.success('Instruments updated successfully!')
      router.push('/Calibration/tools')
    } else {
      toast.error('Failed to update instruments. Please try again.')
    }
  }

  return (
    <>
      <Head>
        <title>Has Received Instrument</title>
      </Head>
      <CContainer fluid className={sharedStyles.pageShell}>
        <div className={sharedStyles.cardShell}>
          <CCard className={sharedStyles.card}>
            <CCardHeader className={sharedStyles.cardHeader}>
              <div className="d-flex flex-column gap-2">
                <div>
                  <p className={sharedStyles.eyebrow}>Calibration</p>
                  <h2 className={sharedStyles.title}>
                    Has Received Instrument
                  </h2>
                  <p className={sharedStyles.subTitle}>
                    Select instruments, add them to the list, and update their
                    receive status.
                  </p>
                </div>
              </div>
            </CCardHeader>
            <CCardBody className={sharedStyles.cardBody}>
              <CButton
                color="secondary"
                variant="outline"
                className="d-inline-flex align-items-center mb-4"
                size="lg"
                onClick={() => router.push('/Calibration/tools')}
              >
                <FiArrowLeft size={16} />
                Back to Select Tools
              </CButton>
              <CRow className="g-4">
                <CCol xs={12}>
                  <CCard className={styles.sectionCard}>
                    <CCardBody className="p-4">
                      <CRow className="g-3 align-items-center mb-3">
                        <CCol lg={8}>
                          <div className={styles.heroBlock}>
                            <div className={styles.heroIcon}>
                              <FiCheckCircle size={22} />
                            </div>
                            <div>
                              <h3 className="h4 mb-2">
                                Use the select button to choose instruments and
                                add them into the list below.
                              </h3>
                            </div>
                          </div>
                        </CCol>
                        <CCol lg={4}>
                          <div className={styles.summaryBox}>
                            <div className="text-body-secondary p">
                              Choose instruments
                            </div>
                            <div className={styles.summaryValue}>
                              {pendingCount}
                            </div>
                          </div>
                        </CCol>
                      </CRow>
                      <span className="text-danger p mb-2 d-block">
                        請選擇儀器，然後按下右下方按 Submit
                      </span>
                      <CButton
                        className="btn-ph-primary d-inline-flex align-items-center gap-2 mb-3"
                        size="lg"
                        onClick={() => setShowModal(true)}
                      >
                        <FiPlus size={16} />
                        Select
                      </CButton>

                      <CTable
                        hover
                        responsive
                        align="middle"
                        className={`mb-0 ${styles.destinationTable}`}
                      >
                        <CTableHead className={styles.tableHead}>
                          <CTableRow>
                            <CTableHeaderCell
                              className={`text-center h5  ${styles.numberColumn}`}
                            >
                              No.
                            </CTableHeaderCell>
                            <CTableHeaderCell className={`text-center h5`}>
                              Property No.
                            </CTableHeaderCell>
                            <CTableHeaderCell className={`text-center h5`}>
                              Instrument
                            </CTableHeaderCell>
                            <CTableHeaderCell className="text-center h5">
                              Owner
                            </CTableHeaderCell>
                            <CTableHeaderCell className="text-center h5">
                              Status
                            </CTableHeaderCell>
                            <CTableHeaderCell className="text-center h5">
                              Calibr Cycle
                            </CTableHeaderCell>
                            <CTableHeaderCell className="text-center h5">
                              Calibr Class
                            </CTableHeaderCell>
                            <CTableHeaderCell className="text-center h5">
                              Action
                            </CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {queueItems.length > 0 ? (
                            queueItems.map((item, index) => (
                              <CTableRow
                                key={item.id}
                                className={styles.tableRow}
                              >
                                <CTableDataCell className="text-center text-body-secondary fw-semibold p">
                                  {index + 1}
                                </CTableDataCell>
                                <CTableDataCell>
                                  <div className={'p text-center'}>
                                    {item.propertyNo}
                                  </div>
                                </CTableDataCell>
                                <CTableDataCell>
                                  <div className={'p text-center'}>
                                    {item.instrumentName}
                                  </div>
                                  <div className="p text-center text-body-secondary mt-1">
                                    {item.model} / {item.vendor}
                                  </div>
                                </CTableDataCell>
                                <CTableDataCell className="text-body-secondary p text-center">
                                  {item.applicant || '-'}
                                </CTableDataCell>

                                <CTableDataCell className="text-center p">
                                  <CBadge
                                    color={
                                      item.status === 'Usable'
                                        ? 'success'
                                        : 'secondary'
                                    }
                                  >
                                    {item.status}
                                  </CBadge>
                                </CTableDataCell>
                                <CTableDataCell className="text-body-secondary p text-center">
                                  {item.calibr_cycle || '-'}
                                </CTableDataCell>
                                <CTableDataCell className="text-body-secondary p text-center">
                                  {item.calibr_class || '-'}
                                </CTableDataCell>
                                <CTableDataCell className="text-end">
                                  <div className="d-inline-flex gap-2 flex-wrap justify-content-end">
                                    <CButton
                                      color="danger"
                                      variant="outline"
                                      className="d-inline-flex align-items-center gap-2"
                                      onClick={() => handleRemoveItem(item.id)}
                                    >
                                      <FiTrash2 size={16} />
                                      REMOVE
                                    </CButton>
                                  </div>
                                </CTableDataCell>
                              </CTableRow>
                            ))
                          ) : (
                            <CTableRow>
                              <CTableDataCell
                                colSpan={7}
                                className="text-center py-5 text-body-secondary p"
                              >
                                No instrument selected yet. Click Select to add
                                an item.
                              </CTableDataCell>
                            </CTableRow>
                          )}
                        </CTableBody>
                      </CTable>
                      <div className="d-flex justify-content-end">
                        <CButton
                          className="btn-ph-primary d-inline-flex align-items-center gap-2 mt-3 p"
                          onClick={handleSubmit}
                          size="lg"
                        >
                          Submit
                        </CButton>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </div>
      </CContainer>

      <SelectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Select Instrument"
        footer={
          <CButton
            color="secondary"
            variant="ghost"
            size="lg"
            type="button"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </CButton>
        }
      >
        <InstrumentTable
          variant="select"
          onSelect={(event, instrument) =>
            handleSelectInstrument(event, instrument)
          }
          multiselect={true}
        />
      </SelectModal>
    </>
  )
}
