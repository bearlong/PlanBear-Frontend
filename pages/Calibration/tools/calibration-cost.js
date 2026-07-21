import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormInput,
  CRow,
} from '@coreui/react'
import {
  FiArrowLeft,
  FiDollarSign,
  FiEdit3,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi'
import InstrumentTable from '@/components/calibration/instrumentTable'
import SelectModal from '@/components/calibration/selectModal'
import sharedStyles from '@/styles/calibration.module.scss'
import styles from '@/styles/calibration-tools.module.scss'
import { useToast } from '@/hooks/useToast'
import { toolService } from '@/services/Calibration/toolService'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const hasValue = (value) =>
  value !== null && value !== undefined && value !== ''

const formatDate = (value) => {
  if (!value) return '-'
  return value.toString().slice(0, 10)
}

const infoFields = (instrument) => [
  { label: 'Property No.', value: instrument?.property_no },
  { label: 'Model', value: instrument?.model },
  { label: 'Vendor', value: instrument?.vendor },
  { label: 'Owner', value: instrument?.owner },
  { label: 'Dept', value: instrument?.dept },
  { label: 'First Price', value: instrument?.first_price },
  { label: 'Date', value: formatDate(instrument?.date) },
  { label: 'Calibr Class', value: instrument?.calibr_class },
]

export default function CalibrationCostPage() {
  usePermissionGuard('Calibration')
  const router = useRouter()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState(null)
  const [costInput, setCostInput] = useState('')
  const [mode, setMode] = useState('view')

  const hasCost = useMemo(
    () => hasValue(selectedInstrument?.calibration_cost),
    [selectedInstrument]
  )

  useEffect(() => {
    if (!selectedInstrument) {
      setCostInput('')
      setMode('view')
      return
    }

    setCostInput(
      hasValue(selectedInstrument.calibration_cost)
        ? String(selectedInstrument.calibration_cost)
        : ''
    )
    setMode(hasValue(selectedInstrument.calibration_cost) ? 'view' : 'add')
  }, [selectedInstrument])

  const handleSelectInstrument = (event, instrument) => {
    event.preventDefault()
    setSelectedInstrument(instrument)
    setShowModal(false)
  }

  const handleSave = async () => {
    if (!selectedInstrument) {
      toast.error('Please select an instrument first.')
      return
    }

    if (costInput.trim() === '') {
      toast.error('Please enter calibration cost.')
      return
    }

    if (Number.isNaN(Number(costInput)) || Number(costInput) < 0) {
      toast.error('Calibration cost must be a valid number.')
      return
    }

    const result = await toolService.calibrationCostUpdate(
      selectedInstrument.id,
      costInput
    )
    console.log(result)
    if (result.status === 'error') {
      toast.error(`Failed to update calibration cost: ${result.message}`)
      return
    }

    setSelectedInstrument((prev) => ({
      ...prev,
      calibration_cost: costInput,
    }))
    setMode('view')
    toast.success('Frontend preview updated. No backend data was changed.')
  }

  const handleDelete = async () => {
    if (!selectedInstrument || !hasCost) {
      toast.error('No calibration cost to delete.')
      return
    }

    const result = await toolService.calibrationCostDelete(
      selectedInstrument.id
    )
    if (result.status === 'error') {
      toast.error(`Failed to update calibration cost: ${result.message}`)
      return
    }

    setSelectedInstrument((prev) => ({
      ...prev,
      calibration_cost: null,
    }))
    setCostInput('')
    setMode('add')
    toast.success('Frontend preview cleared. No backend data was changed.')
  }

  return (
    <>
      <Head>
        <title>Calibration Cost</title>
      </Head>
      <CContainer fluid className={sharedStyles.pageShell}>
        <div className={sharedStyles.cardShell}>
          <CCard className={sharedStyles.card}>
            <CCardHeader className={sharedStyles.cardHeader}>
              <div>
                <p className={sharedStyles.eyebrow}>Calibration</p>
                <h2 className={sharedStyles.title}>Edit Calibration Cost</h2>
                <p className={sharedStyles.subTitle}>
                  Select an instrument first, then review its data and maintain
                  calibration cost.
                </p>
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
                      <div className={styles.heroBlock}>
                        <div className={styles.heroIcon}>
                          <FiDollarSign size={22} />
                        </div>
                        <div>
                          <h3 className="h4 mb-2">Select an instrument</h3>
                          <div className="text-body-secondary p">
                            {selectedInstrument
                              ? `${selectedInstrument.property_no} / ${
                                  selectedInstrument.instrument?.instru_name ||
                                  '-'
                                }`
                              : 'No instrument selected yet.'}
                          </div>
                        </div>
                      </div>

                      <CButton
                        className="btn-ph-primary d-inline-flex align-items-center gap-2 mt-4"
                        size="lg"
                        onClick={() => setShowModal(true)}
                      >
                        <FiPlus size={16} />
                        Select Instrument
                      </CButton>
                    </CCardBody>
                  </CCard>
                </CCol>

                {selectedInstrument && (
                  <>
                    <CCol xs={12} lg={7}>
                      <CCard className={styles.sectionCard}>
                        <CCardHeader className={styles.sectionHeader}>
                          <div className="h4 m-0">Instrument Information</div>
                        </CCardHeader>
                        <CCardBody className="p-4">
                          <div className={styles.costInfoGrid}>
                            {infoFields(selectedInstrument).map((item) => (
                              <div
                                key={item.label}
                                className={styles.costInfoCell}
                              >
                                <div
                                  className={`text-body-secondary p mb-1 ${styles.costInfoLabel}`}
                                >
                                  {item.label}
                                </div>
                                <div className={`${styles.costInfoValue} p`}>
                                  {hasValue(item.value) ? item.value : '-'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CCardBody>
                      </CCard>
                    </CCol>

                    <CCol xs={12} lg={5}>
                      <CCard className={styles.sectionCard}>
                        <CCardHeader className={styles.sectionHeader}>
                          <div className="h4 m-0">
                            {hasCost ? 'Edit / Delete Cost' : 'Add New Cost'}
                          </div>
                        </CCardHeader>
                        <CCardBody className="p-4">
                          <div className={styles.costPanel}>
                            {mode === 'add' || mode === 'edit' ? (
                              <div className="d-flex flex-column gap-3">
                                <div>
                                  <div className="p mb-2">Calibration Cost</div>
                                  <CFormInput
                                    size="lg"
                                    value={costInput}
                                    onChange={(event) =>
                                      setCostInput(event.target.value)
                                    }
                                    placeholder="Enter calibration cost"
                                  />
                                </div>
                                <div className="d-flex justify-content-end gap-2">
                                  <CButton
                                    color="secondary"
                                    variant="outline"
                                    size="lg"
                                    onClick={() => {
                                      setCostInput(
                                        hasCost
                                          ? String(
                                              selectedInstrument.calibration_cost
                                            )
                                          : ''
                                      )
                                      setMode('view')
                                    }}
                                  >
                                    Cancel
                                  </CButton>
                                  <CButton
                                    className="btn-ph-primary"
                                    size="lg"
                                    onClick={handleSave}
                                  >
                                    {hasCost ? 'Update' : 'Add New'}
                                  </CButton>
                                </div>
                              </div>
                            ) : (
                              <div className="d-flex flex-column gap-3">
                                <div className={styles.currentCostCard}>
                                  <div className="text-body-secondary p">
                                    Current Cost
                                  </div>
                                  <div className={styles.costValueDisplay}>
                                    {hasCost
                                      ? selectedInstrument.calibration_cost
                                      : 'No data'}
                                  </div>
                                </div>
                                <div className="d-flex justify-content-end gap-2 flex-wrap">
                                  <CButton
                                    color="primary"
                                    variant="outline"
                                    size="lg"
                                    className="d-inline-flex align-items-center gap-2"
                                    onClick={() =>
                                      setMode(hasCost ? 'edit' : 'add')
                                    }
                                  >
                                    {hasCost ? (
                                      <FiEdit3 size={16} />
                                    ) : (
                                      <FiPlus size={16} />
                                    )}
                                    {hasCost ? 'Edit Cost' : 'Add New Cost'}
                                  </CButton>
                                  {hasCost && (
                                    <CButton
                                      color="danger"
                                      variant="outline"
                                      size="lg"
                                      className="d-inline-flex align-items-center gap-2"
                                      onClick={handleDelete}
                                    >
                                      <FiTrash2 size={16} />
                                      Delete
                                    </CButton>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CCardBody>
                      </CCard>
                    </CCol>
                  </>
                )}
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
        />
      </SelectModal>
    </>
  )
}
