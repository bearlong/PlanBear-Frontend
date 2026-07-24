import { useEffect, useState, useContext } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CFormTextarea,
} from '@coreui/react'
import { useToast } from '@/hooks/useToast'
import styles from '@/styles/calibration.module.scss'
import DeptTree from '@/components/common/deptTree'
import { AuthContext } from '@/context/AuthContext'
import InstrumentNameTable from '@/components/calibration/instrumentNameTable'
import InstrumentFactoryTable from '@/components/calibration/instrumentFactoryTable'
import SelectModal from '@/components/calibration/selectModal'
import { calibrationService } from '@/services/Calibration/calibration.service'
import useUserPermissions from '@/hooks/useUserPermissions'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const calibrClassOptions = [
  { label: 'Select calibration class', value: '' },
  { label: 'Internal Calibration', value: 'Internal Calibration' },
  { label: 'NRC', value: 'NRC' },
  { label: 'External Calibration', value: 'External Calibration' },
  { label: 'On-Site', value: 'On-Site' },
]
const initialFormState = {
  property_no: '',
  instrument: {
    id: '',
    instru_name: '',
    system: '',
  },
  description: '',
  instrument_price: '',
  doc_no: '',
  sub_instru_id: '',
  is_common: 0,
  date: '',
  calibr_org: {
    id: '',
    name: '',
  },
  factory: '',
  vendor: '',
  model: '',
  instru_sn: '',
  calibr_cycle: '',
  calibr_class: '',
  owner: {
    username: '',
    fullname: '',
    dept: '',
  },
  status: 'Usable',
  change_date: '',
}

export default function InstrumentAddPage() {
  usePermissionGuard('Calibration')
  const { user } = useContext(AuthContext)

  const router = useRouter()
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [showModal, setShowModal] = useState(null)

  const toast = useToast()
  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const isEmpty = (v) =>
    v === null || v === undefined || String(v).trim() === ''

  const validate = () => {
    const e = {}

    if (isEmpty(form.property_no)) e.property_no = 'Property No. is required.'

    if (isEmpty(form.instrument?.id))
      e.instru_name = 'Instrument name is required.'

    if (isEmpty(form.instrument?.system))
      e.system = 'Instrument system is required.'

    if (isEmpty(form.vendor)) e.vendor = 'Vendor is required.'
    if (isEmpty(form.model)) e.model = 'Model is required.'
    if (isEmpty(form.instru_sn)) e.instru_sn = 'Instrument S/N is required.'
    if (!form.calibr_cycle) e.calibr_cycle = 'Cycle is required.'

    if (isEmpty(form.calibr_class))
      e.calibr_class = 'Calibration class is required.'

    if (
      form.calibr_class === 'External Calibration' &&
      isEmpty(form.calibr_org?.id)
    )
      e.calibr_org = 'Calibration organization is required.'

    if (isEmpty(form.owner?.username)) e.owner = 'Owner is required.'
    if (isEmpty(form.date)) e.date = 'Date is required.'
    const price = Number(form.instrument_price)
    if (!Number.isFinite(price)) {
      e.instrument_price = 'Instrument Price must be a number.'
    } else if (price < 0) {
      e.instrument_price = 'Instrument Price cannot be negative.'
    }
    if (isEmpty(form.change_date))
      e.change_date = 'Next Calibration Date is required.'

    return e
  }

  const handleInstrumentSelect = (item) => {
    setForm((prev) => ({
      ...prev,
      instrument: item,
    }))
    setShowModal(null)
  }

  const handleFactorySelect = (item) => {
    setForm((prev) => ({
      ...prev,
      calibr_org: { id: item.id, name: item.name },
    }))

    setShowModal(null)
  }

  const handleSelectOwner = (item) => {
    if (!item || item?.type?.trim() !== 'user') return
    console.log(item)
    const nextOwner = {
      username: item.username,
      fullname: item.fullname,
      dept: item.dept,
    }
    setForm((prev) => ({
      ...prev,
      owner: nextOwner,
    }))
    setShowModal(null)
  }

  const handleCaliberationClassChange = (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, calibr_class: value }))
    if (value !== 'External Calibration') {
      setForm((prev) => ({
        ...prev,
        calibr_org: { id: '', name: '' },
      }))
    }
  }

  const handleDateSlelect = (date) => {
    setForm((prev) => ({ ...prev, date: date, change_date: date }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the errors in the form.')
      return
    }
    try {
      const status = 'Usable'

      const emptyToNull = (v) =>
        v === undefined || v === null || String(v).trim() === '' ? null : v

      const payload = {
        property_no: form.property_no.trim(),
        instru_id: Number(form.instrument.id),
        description: emptyToNull(form.description.trim()),
        factory: form.factory.trim(),
        vendor: form.vendor.trim(),
        model: form.model.trim(),
        instru_sn: form.instru_sn.trim(),
        calibr_cycle: Number(form.calibr_cycle),
        calibr_class: form.calibr_class.trim(),
        owner: form.owner.fullname.trim(),
        owner_username: form.owner.username.trim(),
        dept: form.owner.dept.trim(),
        first_price: Number(form.instrument_price),
        date: form.date.trim(),
        external_calibr_id: Number(form.calibr_org.id) || null,
        status: status,
        doc_no: emptyToNull(form.doc_no.trim()),
        change_date: form.change_date.trim(),
        sub_instru_id: emptyToNull(form.sub_instru_id.trim()),
        is_common: form.is_common,
      }
      const result = await calibrationService.addCalibration(payload)
      if (result.status === 'error') {
        toast.error(result.message || 'Failed to add instrument.')
        return
      }
      toast.success('Instrument added successfully.')

      router.push(`/Calibration/instruments/${result.data.id}`)
    } catch (error) {
      console.error('Error adding instrument:', error)
      toast.error('An unexpected error occurred.')
    }
  }

  useEffect(() => {
    if (user?.factory) {
      setForm((prev) => ({ ...prev, factory: user.factory }))
    }
  }, [user])

  return (
    <>
      <Head>
        <title>Add Instrument</title>
      </Head>
      <CContainer fluid className={styles.pageShell}>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardHeader className={styles.cardHeader}>
              <div>
                <p className={styles.eyebrow}>Calibration</p>
                <h2 className={styles.title}>Create Instrument Data</h2>
              </div>
            </CCardHeader>
            <CCardBody className={styles.cardBody}>
              <CForm onSubmit={handleSubmit}>
                <CRow className="g-3 p">
                  <CCol md={6}>
                    <CFormLabel htmlFor="property_no">
                      Property No. (財產編號) *
                    </CFormLabel>
                    <CFormInput
                      id="property_no"
                      value={form.property_no}
                      onChange={handleChange('property_no')}
                      invalid={Boolean(errors.property_no)}
                      size="lg"
                      autoComplete="off"
                    />
                    <CFormFeedback invalid>{errors.property_no}</CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="factory">
                      Factory (廠區別) *
                    </CFormLabel>
                    <CFormInput
                      id="factory"
                      value={form.factory}
                      onChange={handleChange('factory')}
                      invalid={Boolean(errors.factory)}
                      size="lg"
                      autoComplete="off"
                      readOnly
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="instru_name">
                      Instrument Name (儀器名稱) *
                    </CFormLabel>
                    <div className="d-flex justify-content-between align-items-center gap-3">
                      <div className="flex-grow-1">
                        <CFormInput
                          id="instru_name"
                          value={form.instrument.instru_name}
                          invalid={Boolean(errors.instru_name)}
                          size="lg"
                          autoComplete="off"
                          readOnly
                        />
                        <CFormFeedback invalid>
                          {errors.instru_name}
                        </CFormFeedback>
                      </div>
                      <CButton
                        color="primary"
                        size="lg"
                        variant="outline"
                        className="btn-ph-outline-primary align-self-start"
                        onClick={() => setShowModal('instrumentName')}
                      >
                        Select
                      </CButton>
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="instru_system">
                      Instrument System (儀器量別) *
                    </CFormLabel>
                    <CFormInput
                      id="instru_system"
                      value={form.instrument.system}
                      invalid={Boolean(errors.system)}
                      size="lg"
                      autoComplete="off"
                      readOnly
                    />
                    <CFormFeedback invalid>{errors.system}</CFormFeedback>
                  </CCol>
                  <CCol md={12}>
                    <CFormLabel htmlFor="description">
                      Description (儀器說明)
                    </CFormLabel>
                    <CFormTextarea
                      id="description"
                      value={form.description}
                      onChange={handleChange('description')}
                      rows={3}
                      size="lg"
                      autoComplete="off"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="vendor">Vendor (廠牌) *</CFormLabel>
                    <CFormInput
                      id="vendor"
                      value={form.vendor}
                      onChange={handleChange('vendor')}
                      invalid={Boolean(errors.vendor)}
                      size="lg"
                      autoComplete="off"
                    />
                    <CFormFeedback invalid>{errors.vendor}</CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="model">Model (型號) *</CFormLabel>
                    <CFormInput
                      id="model"
                      value={form.model}
                      invalid={Boolean(errors.model)}
                      onChange={handleChange('model')}
                      size="lg"
                      autoComplete="off"
                    />
                    <CFormFeedback invalid>{errors.model}</CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="instru_sn">
                      Instrument S/N (儀器序號) *
                    </CFormLabel>
                    <CFormInput
                      id="instru_sn"
                      value={form.instru_sn}
                      invalid={Boolean(errors.instru_sn)}
                      onChange={handleChange('instru_sn')}
                      size="lg"
                      autoComplete="off"
                    />
                    <CFormFeedback invalid>{errors.instru_sn}</CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="calibr_cycle">
                      Calibration Cycle (校驗週期) *
                    </CFormLabel>
                    <CFormSelect
                      id="calibr_cycle"
                      type="number"
                      value={form.calibr_cycle}
                      onChange={handleChange('calibr_cycle')}
                      options={[
                        { label: 'Select cycle', value: '' },
                        { label: '0', value: 0 },
                        { label: '1 months', value: 1 },
                        { label: '2 months', value: 2 },
                        { label: '3 months', value: 3 },
                        { label: '6 months', value: 6 },
                        { label: '12 months', value: 12 },
                        { label: '24 months', value: 24 },
                        { label: '36 months', value: 36 },
                      ]}
                      invalid={Boolean(errors.calibr_cycle)}
                      size="lg"
                      autoComplete="off"
                    />
                    <CFormFeedback invalid>{errors.calibr_cycle}</CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="calibr_class">
                      Calibration Class (校驗類別) *
                    </CFormLabel>
                    <CFormSelect
                      id="calibr_class"
                      value={form.calibr_class}
                      onChange={handleCaliberationClassChange}
                      options={calibrClassOptions}
                      size="lg"
                      invalid={Boolean(errors.calibr_class)}
                    />
                    <CFormFeedback invalid>{errors.calibr_class}</CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="calibr_org">
                      Calibration Organization (外校單位)
                    </CFormLabel>
                    <div className="d-flex justify-content-center align-items-center gap-3">
                      <div className="flex-grow-1">
                        <CFormInput
                          id="calibr_org"
                          value={form.calibr_org.name}
                          onChange={handleChange('calibr_org')}
                          size="lg"
                          invalid={Boolean(errors.calibr_org)}
                          readOnly
                        />
                        <CFormFeedback invalid>
                          {errors.calibr_org}
                        </CFormFeedback>
                      </div>
                      <CButton
                        color="primary"
                        size="lg"
                        variant="outline"
                        className="btn-ph-outline-primary align-self-start"
                        onClick={() => {
                          setShowModal('instruFactory')
                        }}
                        disabled={form.calibr_class !== 'External Calibration'}
                      >
                        Select
                      </CButton>
                    </div>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="owner">Owner (保管人) *</CFormLabel>
                    <div className="d-flex justify-content-center align-items-center gap-3">
                      <div className="flex-grow-1">
                        <CFormInput
                          id="owner"
                          value={form.owner.fullname}
                          invalid={Boolean(errors.owner)}
                          size="lg"
                          autoComplete="off"
                          readOnly
                        />
                        <CFormFeedback invalid>{errors.owner}</CFormFeedback>
                      </div>
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
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="dept">
                      Department (儀器保管部門) *
                    </CFormLabel>
                    <CFormInput
                      id="dept"
                      value={form.owner.dept}
                      invalid={Boolean(errors.owner)}
                      size="lg"
                      autoComplete="off"
                      readOnly
                    />
                    <CFormFeedback invalid>{errors.owner}</CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="date">Date (入廠日期) *</CFormLabel>
                    <CFormInput
                      id="date"
                      value={form.date}
                      invalid={Boolean(errors.date)}
                      type="date"
                      onChange={(item) => handleDateSlelect(item.target.value)}
                      size="lg"
                    />
                    <CFormFeedback invalid>{errors.date}</CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="change_date">
                      Next Calibration Date (下一校驗日期) *
                    </CFormLabel>
                    <CFormInput
                      id="change_date"
                      type="date"
                      value={form.change_date}
                      invalid={Boolean(errors.change_date)}
                      onChange={handleChange('change_date')}
                      min={form.date || ''}
                      size="lg"
                    />
                    <CFormFeedback invalid>{errors.change_date}</CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="instrument_price">
                      Instrument Price (儀器價格)
                    </CFormLabel>
                    <CFormInput
                      id="instrument_price"
                      value={form.instrument_price}
                      onChange={handleChange('instrument_price')}
                      size="lg"
                      autoComplete="off"
                      invalid={Boolean(errors.instrument_price)}
                    />
                    <CFormFeedback invalid>
                      {errors.instrument_price}
                    </CFormFeedback>
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="doc_no">
                      Document No (操作手冊編號)
                    </CFormLabel>
                    <CFormInput
                      id="doc_no"
                      value={form.doc_no}
                      onChange={handleChange('doc_no')}
                      size="lg"
                      autoComplete="off"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="sub_instru_id">
                      Sub-Porperty No (子財產編號)
                    </CFormLabel>
                    <CFormInput
                      id="sub_instru_id"
                      value={form.sub_instru_id}
                      onChange={handleChange('sub_instru_id')}
                      size="lg"
                      autoComplete="off"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel htmlFor="is_common">
                      Is Common Instrument? (是否為共用儀器)
                    </CFormLabel>
                    <CFormSelect
                      id="is_common"
                      value={form.is_common}
                      onChange={handleChange('is_common')}
                      size="lg"
                      autoComplete="off"
                      options={[
                        { label: 'N', value: 0 },
                        { label: 'Y', value: 1 },
                      ]}
                    />
                  </CCol>
                </CRow>
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="lg"
                    type="button"
                    onClick={() => router.push('/Calibration/instruments')}
                  >
                    Cancel
                  </CButton>
                  <CButton
                    color="primary"
                    size="lg"
                    type="submit"
                    className="btn-ph-primary"
                  >
                    Submit
                  </CButton>
                </div>
              </CForm>
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
        {showModal === 'instrumentName' && (
          <InstrumentNameTable
            variant="select"
            onSelect={handleInstrumentSelect}
          />
        )}
        {showModal === 'instruFactory' && (
          <InstrumentFactoryTable
            variant="select"
            onSelect={handleFactorySelect}
            limit={5}
          />
        )}

        {showModal === 'user' && (
          <DeptTree onSelectedNodeChange={handleSelectOwner} />
        )}
      </SelectModal>
    </>
  )
}
