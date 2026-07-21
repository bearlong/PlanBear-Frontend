import { useEffect, useState, useContext } from 'react'
import Head from 'next/head'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import ClientOnly from '@/components/common/clientOnly'
import { FiPlus, FiSearch } from 'react-icons/fi'
import { useToast } from '@/hooks/useToast'
import Swal from 'sweetalert2'
import styles from '@/styles/instrument-factory.module.scss'
import { calibrationOrgService } from '@/services/Calibration/calibrationOrg.service'
import Pagination from '@/components/common/pagination'
import { AuthContext } from '@/context/AuthContext'
import useUserPermissions from '@/hooks/useUserPermissions'

const useBreakpoints = () => {
  const [width, setWidth] = useState(null)

  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth)
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const isMobile = width !== null && width < 768
  const isTablet = width !== null && width >= 768 && width < 1024
  const isMedium = width !== null && width >= 1024 && width < 1440

  return { isMobile, isTablet, isMedium }
}

export default function InstrumentFactoryTable({
  variant = 'select',
  onSelect = () => {},
  limit = 20,
}) {
  const [calibrationOrgs, setCalibrationOrgs] = useState([])
  const [pages, setPages] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('create') // create | edit
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const { user } = useContext(AuthContext)
  const { hasModuleAccess, handlePermissionGuard } = useUserPermissions()

  const initialFormState = {
    name: '',
    address: '',
    tel: '',
    fax: '',
    contact: '',
    email: '',
    factory: user?.factory || '',
    mobile: '',
  }
  const [form, setForm] = useState(initialFormState)

  const { isMobile, isTablet, isMedium } = useBreakpoints()
  const toast = useToast()
  const fetchCalibrationOrgs = async (query = '', page = 1, limit = 20) => {
    try {
      const result = await calibrationOrgService.getCalibrationOrgs(
        query,
        page,
        limit
      )
      if (result.status !== 'success') {
        throw new Error('Failed to fetch calibration orgs')
      }
      const listData = result.data
      setTotalPages(listData.totalPages || 1)
      setCalibrationOrgs(listData.data || [])
    } catch (error) {
      console.error('Error fetching calibration orgs:', error)
    }
  }

  const handleSearch = () => {
    setPages(1)
    fetchCalibrationOrgs(searchQuery, 1, limit)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const resetForm = () => {
    setForm(initialFormState)
    setErrors({})
    setEditingId(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setMode('create')
    setShowModal(true)
  }

  const handleEdit = (factory) => {
    setMode('edit')
    setForm({
      name: factory.name || '',
      address: factory.address || '',
      tel: factory.tel || '',
      fax: factory.fax || '',
      contact: factory.contact || '',
      email: factory.email || '',
      factory: factory.factory || user.factory || '',
      mobile: factory.mobile || '',
    })
    setErrors({})
    setEditingId(factory.id)
    setShowModal(true)
  }

  const handleDelete = (factory) => {
    Swal.fire({
      title: 'Delete factory?',
      text: `This will remove "${factory.name}" from the list.`,
      icon: 'warning',
      showCancelButton: true,
      customClass: { popup: 'p' },
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it',
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success('Factory deleted successfully')
        calibrationOrgService.deleteCalibrationOrg(factory.id)
        setCalibrationOrgs((prev) =>
          prev.filter((item) => item.id !== factory.id)
        )
      }
    })
  }

  const validate = () => {
    const validationErrors = {}
    if (!form.name.trim()) validationErrors.name = 'Name is required.'
    if (!form.factory.trim()) validationErrors.factory = 'Factory is required.'
    return validationErrors
  }

  const emptyStringToNull = (obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k,
        typeof v === 'string' && v.trim() === '' ? null : v,
      ])
    )

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return
    const submitData = emptyStringToNull(form)
    if (mode === 'create') {
      const result = await calibrationOrgService.addCalibrationOrg(submitData)
      if (result.status !== 'success') {
        const message = result.message || 'Failed to add factory'
        toast.error(message)
      }
      const newId = result.data?.id
      toast.success('Factory added successfully')
      const newFactory = {
        ...form,
        id: newId,
      }

      setCalibrationOrgs((prev) => {
        const next = [newFactory, ...prev]

        return next.sort((a, b) =>
          (a.name ?? '').localeCompare(b.name ?? '', 'zh-Hant', {
            sensitivity: 'base',
          })
        )
      })
    } else {
      const result = await calibrationOrgService.updateCalibrationOrg(
        editingId,
        submitData
      )
      if (result.status !== 'success') {
        const message = result.message || 'Failed to update factory'
        toast.error(message)
        return
      }
      toast.success('Factory updated successfully')

      setCalibrationOrgs((prev) => {
        const updated = prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...form,
              }
            : item
        )

        return updated.sort((a, b) =>
          (a.name ?? '').localeCompare(b.name ?? '', 'zh-Hant', {
            sensitivity: 'base',
          })
        )
      })
    }

    setShowModal(false)
    resetForm()
  }

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleChangePage = async (newPage, newLimit) => {
    setPages(newPage)
    const result = await calibrationOrgService.getCalibrationOrgs(
      searchQuery !== '' ? searchQuery : '',
      newPage,
      newLimit
    )
    if (result.status !== 'success') {
      throw new Error('Failed to fetch calibration orgs')
    }
    const listData = result.data
    console.log(listData)
    setTotalPages(listData.totalPages || 1)
    setCalibrationOrgs(listData.data || [])
  }

  useEffect(() => {
    fetchCalibrationOrgs(searchQuery, pages, limit)
    console.log(hasModuleAccess('Calibration'))
  }, [])

  const desktopTable = (
    <div className={styles.tableWrap}>
      <CTable className={`${styles.table} table`}>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Name</CTableHeaderCell>
            {!isMedium && <CTableHeaderCell>Address</CTableHeaderCell>}
            <CTableHeaderCell>TEL</CTableHeaderCell>
            <CTableHeaderCell>Contact</CTableHeaderCell>
            {!isMedium && <CTableHeaderCell>E-mail</CTableHeaderCell>}
            <CTableHeaderCell>Factory</CTableHeaderCell>
            {!isMedium && <CTableHeaderCell>Fax</CTableHeaderCell>}
            <CTableHeaderCell>Mobile</CTableHeaderCell>
            {variant === 'manage' && (
              <CTableHeaderCell className="text-center">
                Actions
              </CTableHeaderCell>
            )}
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {calibrationOrgs.map((factory) => (
            <CTableRow
              key={factory.id}
              className={`${styles.tableRow} ${
                variant === 'select' ? styles.selectableRow : ''
              }`}
              onClick={
                variant === 'select' ? () => onSelect(factory) : undefined
              }
            >
              <CTableDataCell className={styles.nameCell}>
                <p title={factory.name || '—'}>{factory.name || '—'}</p>
              </CTableDataCell>
              {!isMedium && (
                <CTableDataCell>
                  <p
                    className={`${styles.metaValue} `}
                    title={factory.address || '—'}
                  >
                    {factory.address || '—'}
                  </p>
                </CTableDataCell>
              )}
              <CTableDataCell>
                <p className={`${styles.metaValue}`} title={factory.tel || '—'}>
                  {factory.tel || '—'}
                </p>
              </CTableDataCell>
              <CTableDataCell>
                <p
                  className={`${styles.metaValue} `}
                  title={factory.contact || '—'}
                >
                  {factory.contact || '—'}
                </p>
              </CTableDataCell>
              {!isMedium && (
                <CTableDataCell>
                  <p
                    className={`${styles.metaValue} ${styles.clamp2}`}
                    title={factory.email || '—'}
                  >
                    {factory.email || '—'}
                  </p>
                </CTableDataCell>
              )}
              <CTableDataCell>
                <p
                  className={`${styles.metaValue}`}
                  title={factory.factory || '—'}
                >
                  {factory.factory || '—'}
                </p>
              </CTableDataCell>
              {!isMedium && (
                <CTableDataCell>
                  <p
                    className={`${styles.metaValue} `}
                    title={factory.fax || '—'}
                  >
                    {factory.fax || '—'}
                  </p>
                </CTableDataCell>
              )}
              <CTableDataCell>
                <p
                  className={`${styles.metaValue} `}
                  title={factory.mobile || '—'}
                >
                  {factory.mobile || '—'}
                </p>
              </CTableDataCell>
              <CTableDataCell>
                {variant === 'manage' && (
                  <div className={styles.cardActions}>
                    <CButton
                      color="secondary"
                      variant="ghost"
                      size="lg"
                      className="btn-ph-outline-primary"
                      onClick={() => handleEdit(factory)}
                    >
                      Edit
                    </CButton>
                    <CButton
                      color="danger"
                      variant="outline"
                      size="lg"
                      onClick={() => handleDelete(factory)}
                    >
                      Delete
                    </CButton>
                  </div>
                )}
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </div>
  )

  const mobileCards = (
    <div className={styles.cardsList}>
      {calibrationOrgs.map((factory) => (
        <CCard
          key={factory.id}
          className={`${styles.card}  ${
            variant === 'select' ? styles.selectableRow : ''
          }`}
        >
          <CCardBody
            className={` ${variant === 'select' ? styles.selectableRow : ''}`}
          >
            <div className={styles.cardHeaderRow}>
              <div>
                <p className={styles.cardLabel}>Name</p>
                <h4
                  className={`${styles.cardTitle} `}
                  title={factory.name || '—'}
                >
                  {factory.name || '—'}
                </h4>
                <div className={styles.cardMetaRow}>
                  <span className={styles.cardMetaLabel}>TEL</span>
                  <span
                    className={styles.cardMetaValue}
                    title={factory.tel || '—'}
                  >
                    {factory.tel || '—'}
                  </span>
                </div>
                <div className={styles.cardMetaRow}>
                  <span className={styles.cardMetaLabel}>Contact</span>
                  <span
                    className={styles.cardMetaValue}
                    title={factory.contact || '—'}
                  >
                    {factory.contact || '—'}
                  </span>
                </div>
              </div>
              {variant === 'manage' && (
                <div className={styles.cardActions}>
                  <CButton
                    color="secondary"
                    variant="ghost"
                    size="lg"
                    className="btn-ph-outline-primary"
                    onClick={() => handleEdit(factory)}
                  >
                    Edit
                  </CButton>
                  <CButton
                    color="danger"
                    variant="outline"
                    size="lg"
                    onClick={() => handleDelete(factory)}
                  >
                    Delete
                  </CButton>
                </div>
              )}
            </div>
            <div className={styles.cardMore}>
              <div className={styles.cardMoreItem}>
                <span className={styles.cardMetaLabel}>Factory</span>
                <span
                  className={styles.cardMetaValue}
                  title={factory.factory || '—'}
                >
                  {factory.factory || '—'}
                </span>
              </div>
              <div className={styles.cardMoreItem}>
                <span className={styles.cardMetaLabel}>Mobile</span>
                <span
                  className={styles.cardMetaValue}
                  title={factory.mobile || '—'}
                >
                  {factory.mobile || '—'}
                </span>
              </div>
              <div className={styles.cardMoreItem}>
                <span className={styles.cardMetaLabel}>E-mail</span>
                <span
                  className={`${styles.cardMetaValue} `}
                  title={factory.email || '—'}
                >
                  {factory.email || '—'}
                </span>
              </div>
              <div className={styles.cardMoreItem}>
                <span className={styles.cardMetaLabel}>Address</span>
                <span
                  className={`${styles.cardMetaValue}`}
                  title={factory.address || '—'}
                >
                  {factory.address || '—'}
                </span>
              </div>
              <div className={styles.cardMoreItem}>
                <span className={styles.cardMetaLabel}>Fax</span>
                <span
                  className={styles.cardMetaValue}
                  title={factory.fax || '—'}
                >
                  {factory.fax || '—'}
                </span>
              </div>
            </div>
          </CCardBody>
        </CCard>
      ))}
    </div>
  )

  return (
    <>
      <div className={styles.controlsRow}>
        <div className={styles.searchInput}>
          <FiSearch className={styles.searchIcon} />
          <CFormInput
            size="lg"
            placeholder="Enter name to search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            className={styles.searchField}
            onKeyDown={handleKeyDown}
          />
          <CButton
            color="info"
            variant="ghost"
            size="lg"
            className={`${styles.searchBtn}  d-flex align-items-center gap-2`}
            type="button"
            onClick={handleSearch}
          >
            Search
          </CButton>
        </div>
        {variant === 'manage' && hasModuleAccess('Calibration') && (
          <CButton
            color="primary"
            size="lg"
            className="btn-ph-primary d-flex align-items-center gap-2"
            onClick={handleOpenCreate}
          >
            <FiPlus />
            Add Factory
          </CButton>
        )}
      </div>

      <div className={`mb-3 ${styles.listArea}`}>
        {calibrationOrgs.length === 0 ? (
          <div className={styles.emptyState}>
            <p className="mb-1 fw-semibold">No factories found</p>
            <p className="mb-0 text-muted">
              Try adjusting your search or create a new entry.
            </p>
          </div>
        ) : isMobile ? (
          mobileCards
        ) : isTablet ? (
          mobileCards
        ) : (
          desktopTable
        )}
      </div>
      <Pagination
        page={pages}
        totalPages={totalPages}
        onPageChange={(newPage) => handleChangePage(newPage, limit)}
      />
      <ClientOnly>
        <CModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          size="lg"
        >
          <CModalHeader>
            <h5 className="m-0 h4 fw-bold">
              {mode === 'create' ? 'Add Factory' : 'Edit Factory'}
            </h5>
          </CModalHeader>
          <CForm onSubmit={handleSubmit}>
            <CModalBody>
              <CRow className="g-3 h5">
                <CCol md={6}>
                  <CFormLabel htmlFor="factoryName">Name</CFormLabel>
                  <CFormInput
                    id="factoryName"
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="Factory name"
                    invalid={Boolean(errors.name)}
                    autoComplete="off"
                    size="lg"
                  />
                  <CFormFeedback invalid>{errors.name}</CFormFeedback>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="factorySite">Factory</CFormLabel>
                  <CFormInput
                    id="factorySite"
                    value={form.factory}
                    onChange={handleChange('factory')}
                    placeholder="Site / plant name"
                    autoComplete="off"
                    size="lg"
                    disabled
                  />
                </CCol>
                <CCol md={12}>
                  <CFormLabel htmlFor="factoryAddress">Address</CFormLabel>
                  <CFormInput
                    id="factoryAddress"
                    value={form.address}
                    onChange={handleChange('address')}
                    placeholder="Address"
                    autoComplete="off"
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="factoryTel">TEL</CFormLabel>
                  <CFormInput
                    id="factoryTel"
                    value={form.tel}
                    onChange={handleChange('tel')}
                    placeholder="Office phone"
                    autoComplete="off"
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="factoryMobile">Mobile Phone</CFormLabel>
                  <CFormInput
                    id="factoryMobile"
                    value={form.mobile}
                    onChange={handleChange('mobile')}
                    placeholder="Mobile phone"
                    autoComplete="off"
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="factoryFax">Fax</CFormLabel>
                  <CFormInput
                    id="factoryFax"
                    value={form.fax}
                    onChange={handleChange('fax')}
                    placeholder="Fax"
                    autoComplete="off"
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="factoryContact">Contact</CFormLabel>
                  <CFormInput
                    id="factoryContact"
                    value={form.contact}
                    onChange={handleChange('contact')}
                    placeholder="Contact person"
                    invalid={Boolean(errors.contact)}
                    autoComplete="off"
                    size="lg"
                  />
                  <CFormFeedback invalid>{errors.contact}</CFormFeedback>
                </CCol>
                <CCol md={12}>
                  <CFormLabel htmlFor="factoryEmail">E-mail</CFormLabel>
                  <CFormInput
                    id="factoryEmail"
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder="Email address"
                    invalid={Boolean(errors.email)}
                    autoComplete="off"
                    size="lg"
                  />
                  <CFormFeedback invalid>{errors.email}</CFormFeedback>
                </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter className="d-flex justify-content-between">
              <CButton
                color="secondary"
                variant="ghost"
                size="lg"
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </CButton>
              <CButton
                color="primary"
                type="submit"
                size="lg"
                className="btn-ph-primary"
              >
                {mode === 'create' ? 'Save' : 'Update'}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>
      </ClientOnly>
    </>
  )
}
