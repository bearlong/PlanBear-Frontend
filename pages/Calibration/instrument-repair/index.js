import React, { useMemo, useState, useContext, useEffect } from 'react'
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
  CFormLabel,
  CFormTextarea,
  CInputGroup,
  CRow,
} from '@coreui/react'
import { FiMinus, FiPlus, FiSearch, FiSend, FiX } from 'react-icons/fi'
import styles from '@/styles/calibration.module.scss'
import { AuthContext } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'
import DeptTree from '@/components/common/deptTree'
import SelectModal from '@/components/calibration/selectModal'
import InstrumentTable from '@/components/calibration/instrumentTable'
import { instrumentRepairService } from '@/services/Calibration/instrumentRepair.service'

const createEmptyInstrument = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  property_no: '',
  instru_name: '',
  model: '',
  vendor: '',
  owner: '',
  dept: '',
  fault_condition_description: '',
})

const formatToday = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = `${today.getMonth() + 1}`.padStart(2, '0')
  const day = `${today.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

const initialHeaderState = {
  applicant: { name: 'Demo User' },
  requester: 'Demo User',
  created_at: formatToday(),
  requester_dept: 'Calibration Department',
}

const initialFormState = {
  header: initialHeaderState,
  instruments: [createEmptyInstrument()],
}

const FormField = ({ label, required, children }) => (
  <div>
    <CFormLabel className="text-muted mb-1 h6">
      {label}
      {required ? <span className="text-danger ms-1">*</span> : null}
    </CFormLabel>
    {children}
  </div>
)

export default function InstrumentRepairCreatePage() {
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const [formData, setFormData] = useState(initialFormState)
  const [selected, setSelected] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(null)
  const [showModalInstrumentId, setShowModalInstrumentId] = useState(null)

  const toast = useToast()

  const instrumentCountLabel = useMemo(() => {
    return `${formData.instruments.length} item${
      formData.instruments.length > 1 ? 's' : ''
    }`
  }, [formData.instruments.length])

  const handleRequesterChange = (value) => {
    if (value.type !== 'user') {
      toast.error('Please select a user as requester.')
      return
    }

    const name = [value.ename, value.fullname].filter(Boolean).join(' ')

    setSelected((prev) => ({
      ...prev,
      requester: name,
    }))

    setFormData((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        requester: value.username, // Store both name and id for future use
        requester_dept: value.dept, // Store department for potential future use
      },
    }))
    setShowModal(null)
  }

  const handleInstrumentChange = (rowId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      instruments: prev.instruments.map((item) =>
        item.id === rowId ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleSelectInstrument = (event, selectedItem) => {
    event.stopPropagation()
    if (
      formData.instruments.some(
        (item) => item.property_no === selectedItem.property_no
      )
    ) {
      toast.error('This instrument has already been added.')
      return
    }

    const newIItem = {
      id: selectedItem.id,
      property_no: selectedItem.property_no,
      instru_name: selectedItem.instrument.instru_name,
      vendor: selectedItem.vendor,
      model: selectedItem.model,
      owner: selectedItem.owner_username || selectedItem.owner,
      dept: selectedItem.dept,
      calibration_id: selectedItem.id,
    }

    setFormData((prev) => ({
      ...prev,
      instruments: prev.instruments.map((item) =>
        item.id === showModalInstrumentId
          ? {
              ...newIItem,
              fault_condition_description: '', // Preserve user input
            }
          : item
      ),
    }))
    setShowModal(null)
  }

  const handleAddRow = () => {
    if (formData.instruments.length >= 10) {
      toast.error('You can only add up to 10 instruments.')
      return
    }
    setFormData((prev) => ({
      ...prev,
      instruments: [...prev.instruments, createEmptyInstrument()],
    }))
  }

  const handleRemoveRow = (rowId) => {
    setFormData((prev) => {
      if (prev.instruments.length === 1) {
        return {
          ...prev,
          instruments: [createEmptyInstrument()],
        }
      }

      return {
        ...prev,
        instruments: prev.instruments.filter((item) => item.id !== rowId),
      }
    })
  }

  const handleSelectProperty = (rowId) => {
    // TODO: Open property/instrument selection modal.
    console.log('Open property selector for row:', rowId)
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.header.requester.trim()) {
      nextErrors.requester = 'Requester is required.'
    }

    const instrumentErrors = formData.instruments.map((item) => ({
      property_no: item.property_no.trim() ? '' : 'Property No is required.',
      instru_name: item.instru_name.trim()
        ? ''
        : 'Instrument Name is required.',
      fault_condition_description: item.fault_condition_description.trim()
        ? ''
        : 'Fault condition description is required.',
    }))

    if (instrumentErrors.some((item) => Object.values(item).some(Boolean))) {
      nextErrors.instruments = instrumentErrors
    }

    return nextErrors
  }

  const handleSubmit = async () => {
    const nextErrors = validateForm()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      await instrumentRepairService.submitRepairApplication(formData)
      router.push('/Calibration/instrument-repair/query')
    } catch (error) {
      console.error('Failed to submit repair application:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/Calibration/instrument-repair/query')
  }

  useEffect(() => {
    if (user) {
      setSelected({ applicant: user.name, requester: user.name })
      setFormData((prev) => ({
        ...prev,
        header: {
          ...prev.header,
          applicant: user.username,
          factory: user.factory,
          requester: user.username, // Set requester to current user by default
          requester_dept: user.dept_name, // Store department for potential future use
        },
      }))
    }
  }, [user, router.isReady])

  return (
    <>
      <Head>
        <title>Gauge Instrument Repair Application</title>
      </Head>

      <CContainer fluid className={styles.pageShell}>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardHeader className={styles.cardHeader}>
              <div className="d-flex flex-column gap-2">
                <div>
                  <p className={styles.eyebrow}>Calibration</p>
                  <h2 className={styles.title}>Repair Requests Application</h2>
                  <p className={styles.subTitle}>
                    Create a repair request for instruments that require
                    service.
                  </p>
                </div>
              </div>
            </CCardHeader>

            <CCardBody className={styles.cardBody}>
              <CCard className="border-0 shadow-sm mb-4">
                <CCardHeader className="bg-white border-bottom-0 pt-4 px-4">
                  <div>
                    <p className="text-muted mb-0">Application Information</p>
                  </div>
                </CCardHeader>
                <CCardBody className="pt-2 px-4 pb-4">
                  <CRow className="g-3">
                    <CCol md={6} xl={3}>
                      <FormField label="Applicant">
                        <CFormInput
                          value={selected?.applicant || ''}
                          className="p"
                          readOnly
                        />
                      </FormField>
                    </CCol>
                    <CCol md={6} xl={3}>
                      <FormField label="Requester" required>
                        <div className="d-flex gap-3">
                          <CFormInput
                            value={selected?.requester || ''}
                            className="p"
                            invalid={Boolean(errors.requester)}
                            readOnly
                            placeholder="Enter requester"
                          />
                          <CButton
                            color="primary"
                            size="lg"
                            variant="outline"
                            className="btn-ph-outline-primary align-self-start"
                            onClick={() => {
                              setShowModal('user')
                            }}
                          >
                            Select
                          </CButton>
                        </div>
                        {errors.requester ? (
                          <div className="text-danger small mt-1">
                            {errors.requester}
                          </div>
                        ) : null}
                      </FormField>
                    </CCol>
                    <CCol md={6} xl={3}>
                      <FormField label="Apply Date">
                        <CFormInput
                          value={formData.header.created_at}
                          className="p"
                          type="date"
                          readOnly
                        />
                      </FormField>
                    </CCol>
                    <CCol md={6} xl={3}>
                      <FormField label="Demand Unit">
                        <CFormInput
                          value={formData.header.requester_dept || ''}
                          className="p"
                          readOnly
                        />
                      </FormField>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <CCard className="border-0 shadow-sm">
                <CCardHeader className="bg-white border-bottom-0 pt-4 px-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                      <p className="text-muted mb-0">
                        Add one or more instruments and describe the failure
                        condition.
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small p">
                        {instrumentCountLabel}
                      </span>
                      <CButton
                        color="primary"
                        className="btn-ph-primary d-flex align-items-center gap-2 p"
                        onClick={handleAddRow}
                      >
                        <FiPlus />
                        Add Row
                      </CButton>
                    </div>
                  </div>
                </CCardHeader>
                <CCardBody className="pt-2 px-4 pb-4">
                  <div className="d-flex flex-column gap-3">
                    {formData.instruments.map((instrument, index) => {
                      const rowErrors = errors.instruments?.[index] || {}

                      return (
                        <div
                          key={instrument.property_no || instrument.id}
                          className="border rounded-4 p-3 p-lg-4 bg-white"
                        >
                          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <div>
                              <h6 className="mb-1">Instrument #{index + 1}</h6>
                              <p className="text-muted small mb-0">
                                Maintain at least one row and fill in required
                                fields before submit.
                              </p>
                            </div>
                            <CButton
                              color="danger"
                              variant="outline"
                              className="d-flex align-items-center gap-2"
                              onClick={() => handleRemoveRow(instrument.id)}
                            >
                              <FiMinus />
                              Remove
                            </CButton>
                          </div>

                          <CRow className="g-3">
                            <CCol xl={2} md={6}>
                              <FormField label="Property No" required>
                                <CInputGroup>
                                  <CFormInput
                                    value={instrument.property_no}
                                    className="p"
                                    invalid={Boolean(rowErrors.property_no)}
                                    placeholder="Enter property no"
                                    aria-describedby="button-addon2"
                                    readOnly
                                  />

                                  <CButton
                                    color="primary"
                                    variant="outline"
                                    className="btn-ph-outline-primary"
                                    onClick={() => {
                                      setShowModal('instrument')
                                      setShowModalInstrumentId(instrument.id)
                                    }}
                                    size="lg"
                                    aria-describedby="button-addon2"
                                  >
                                    Select
                                  </CButton>
                                </CInputGroup>
                                {rowErrors.property_no ? (
                                  <div className="text-danger small mt-1">
                                    {rowErrors.property_no}
                                  </div>
                                ) : null}
                              </FormField>
                            </CCol>
                            <CCol xl={4}>
                              <FormField label="Instrument Name" required>
                                <CFormInput
                                  value={instrument.instru_name}
                                  className="p"
                                  invalid={Boolean(rowErrors.instru_name)}
                                  readOnly
                                />
                                {rowErrors.instru_name ? (
                                  <div className="text-danger small mt-1">
                                    {rowErrors.instru_name}
                                  </div>
                                ) : null}
                              </FormField>
                            </CCol>
                            <CCol md={6} xl={2}>
                              <FormField label="Model">
                                <CFormInput
                                  value={instrument.model}
                                  className="p"
                                  placeholder="Enter model"
                                  readOnly
                                />
                              </FormField>
                            </CCol>
                            <CCol xl={4} md={12}>
                              <FormField
                                label="Fault Condition Description"
                                required
                              >
                                <CFormTextarea
                                  rows={2}
                                  value={instrument.fault_condition_description}
                                  className="p"
                                  invalid={Boolean(
                                    rowErrors.fault_condition_description
                                  )}
                                  onChange={(event) =>
                                    handleInstrumentChange(
                                      instrument.id,
                                      'fault_condition_description',
                                      event.target.value
                                    )
                                  }
                                  placeholder="Describe the fault condition or repair request"
                                />
                                {rowErrors.fault_condition_description ? (
                                  <div className="text-danger small mt-1">
                                    {rowErrors.fault_condition_description}
                                  </div>
                                ) : null}
                              </FormField>
                            </CCol>
                          </CRow>
                        </div>
                      )
                    })}
                  </div>
                </CCardBody>
              </CCard>

              <div className="d-flex flex-wrap justify-content-end gap-2 mt-4">
                <CButton
                  color="secondary"
                  variant="outline"
                  className="d-flex align-items-center gap-2"
                  onClick={handleCancel}
                  size="lg"
                >
                  <FiX />
                  Cancel
                </CButton>
                <CButton
                  color="primary"
                  className="btn-ph-primary d-flex align-items-center gap-2"
                  onClick={handleSubmit}
                  disabled={submitting}
                  size="lg"
                >
                  <FiSend />
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
      <SelectModal
        open={showModal !== null}
        onClose={() => setShowModal(null)}
        title="Select Instrument Name"
        footer={
          <>
            <CButton
              color="secondary"
              variant="ghost"
              size="lg"
              type="button"
              onClick={() => setShowModal(null)}
            >
              Cancel
            </CButton>
          </>
        }
      >
        {showModal === 'user' && (
          <DeptTree onSelectedNodeChange={handleRequesterChange} />
        )}

        {showModal === 'instrument' && (
          <InstrumentTable
            variant="select"
            onSelect={(event, instrument) =>
              handleSelectInstrument(event, instrument)
            }
          />
        )}
      </SelectModal>
    </>
  )
}
