import { useMemo, useState, useEffect } from 'react'
import Head from 'next/head'
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
import Swal from 'sweetalert2'
import toast from 'react-hot-toast'
import styles from '@/styles/instrument-names.module.scss'
import ClientOnly from '@/components/common/clientOnly'
import { instrumentSystemService } from '@/services/Calibration/instrumentSystem.service'
import { calibrationListService } from '@/services/Calibration/calibrationList.service'
import Pagination from '@/components/common/pagination'

const initialFormState = {
  instru_name: '',
  system: '',
}

export default function InstrumentNameTable({
  variant = 'select',
  onSelect = () => {},
}) {
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [pages, setPages] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [mode, setMode] = useState('create') // create | edit
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState({ name: '', system: '' })
  const [calibrationLists, setCalibrationLists] = useState([])

  const [instrumentSystems, setInstrumentSystems] = useState([])

  const fetchCalibrationLists = async (query = '', system = '', page = 1) => {
    try {
      const result = await calibrationListService.getCalibrationLists(
        query,
        system,
        page
      )
      if (result.status !== 'success') {
        throw new Error('Failed to fetch instrument systems')
      }
      const listData = result.data
      setTotalPages(listData.totalPages || 1)
      setCalibrationLists(listData.data || [])
    } catch (error) {
      console.error('Error fetching instrument systems:', error)
    }
  }

  const systemOptions = useMemo(() => {
    return [
      { label: 'Select a system', value: '' },
      ...instrumentSystems.map((system) => ({
        label: `${system.system_name}${
          system.description ? ` (e.g., ${system.description})` : ''
        }`,
        value: system.system_name,
      })),
    ]
  }, [instrumentSystems])

  const filterOptions = useMemo(
    () => [{ label: 'All systems', value: '' }, ...systemOptions.slice(1)],
    [systemOptions]
  )

  const systemLabelMap = useMemo(() => {
    const map = {}
    systemOptions.forEach((opt) => {
      map[opt.value] = opt.value
    })
    return map
  }, [systemOptions])

  const pushToast = ({ status, message }) => {
    const notify = () => {
      if (status === 'success') {
        toast.success(message, {
          style: {
            border: '1px solid #4BB543',
            padding: '16px',
            fontSize: '16px',
          },
        })
      } else if (status === 'danger') {
        toast.error(message, {
          style: {
            border: '1px solid #FF3333',
            padding: '16px',
            fontSize: '16px',
          },
        })
      }
    }
    notify()
  }

  const validate = () => {
    const validationErrors = {}
    if (!form.instru_name.trim()) {
      validationErrors.instru_name = 'Instrument name is required.'
    }
    if (!form.system.trim()) {
      validationErrors.system = 'Instrument system is required.'
    }
    return validationErrors
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

  const handleSearch = (currentSystem = '') => {
    setPages(1)
    fetchCalibrationLists(search.name, currentSystem, 1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch(search.system)
  }

  const handleSearchChange = (field) => (event) => {
    setSearch((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleOpenCreate = () => {
    setMode('create')
    setForm(initialFormState)
    setErrors({})
    setEditingId(null)
    setShowModal(true)
  }

  const handleEdit = (item) => {
    setMode('edit')
    setForm({
      instru_name: item.instru_name,
      system: item.system,
    })
    setErrors({})
    setEditingId(item.id)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setErrors({})
    setMode('create')
    setForm(initialFormState)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      pushToast({
        status: 'danger',
        message: 'Please resolve the required fields before saving.',
      })
      return
    }

    if (mode === 'create') {
      const formData = {
        instru_name: form.instru_name.trim(),
        system: form.system,
      }

      const result = await calibrationListService.addCalibrationList(formData)

      if (result.status !== 'success') {
        if (result.status === 'duplicate') {
          pushToast({
            status: 'danger',
            message: 'An instrument with this name already exists.',
          })
          return
        }
        pushToast({
          status: 'danger',
          message: 'An error occurred while saving the instrument.',
        })
        return
      }
      const newItem = {
        id: result.data.id,
        ...formData,
      }
      setCalibrationLists((prev) => [...prev, newItem])

      pushToast({
        status: 'success',
        message: 'New instrument has been added.',
      })
    } else {
      const formData = {
        instru_name: form.instru_name.trim(),
        system: form.system,
      }
      const result = await calibrationListService.updateCalibrationList(
        editingId,
        formData
      )
      if (result.status !== 'success') {
        if (result.status === 'duplicate') {
          pushToast({
            status: 'danger',
            message: 'An instrument with this name already exists.',
          })
          return
        }
        pushToast({
          status: 'danger',
          message: 'An error occurred while updating the instrument.',
        })
        return
      }

      setCalibrationLists((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                instru_name: form.instru_name.trim(),
                system: form.system,
              }
            : item
        )
      )
      pushToast({
        status: 'success',
        message: 'Instrument details have been updated.',
      })
    }

    setShowModal(false)
    setEditingId(null)
    setMode('create')
    setForm(initialFormState)
    setErrors({})
  }

  const handleConfirmDeleteRow = async (deleteTarget) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      customClass: {
        popup: 'p',
      },
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(deleteTarget)
        Swal.fire({
          title: 'Deleted!',
          text: 'Your file has been deleted.',
          icon: 'success',
        })
      }
    })
  }

  const handleDelete = async (deleteTarget) => {
    if (!deleteTarget) return
    const result = await calibrationListService.deleteCalibrationList(
      deleteTarget.id
    )
    if (result.status !== 'success') {
      pushToast({
        status: 'danger',
        message: 'An error occurred while deleting the instrument.',
      })
      setDeleteTarget(null)
      return
    }

    setCalibrationLists((prev) =>
      prev.filter((item) => item.id !== deleteTarget.id)
    )
    setDeleteTarget(null)
    pushToast({
      status: 'success',
      message: 'Instrument entry has been removed.',
    })
  }

  const handleChangePage = async (newPage) => {
    setPages(newPage)
    const result = await calibrationOrgService.getInstrumentSystems(
      search.query !== '' ? search.query : '',
      search.system !== '' ? search.system : '',
      newPage
    )
    if (result.status !== 'success') {
      throw new Error('Failed to fetch calibration orgs')
    }
    const listData = result.data
    setTotalPages(listData.totalPages || 1)
    setCalibrationLists(listData.data || [])
  }

  useEffect(() => {
    const fetchInstrumentSystems = async () => {
      try {
        const result = await instrumentSystemService.getInstrumentSystems()
        if (result.status !== 'success') {
          throw new Error('Failed to fetch instrument systems')
        }
        const systemsData = result.data

        setInstrumentSystems(systemsData)
      } catch (error) {
        console.error('Error fetching instrument systems:', error)
      }
    }

    fetchInstrumentSystems()
    fetchCalibrationLists()
  }, [])
  return (
    <>
      <CForm className="w-100" onSubmit={(e) => e.preventDefault()}>
        <div className={styles.searchRow}>
          <div className={styles.searchGroup}>
            <div className={styles.inputWrap}>
              <CFormLabel htmlFor="searchName" className="h4">
                Instrument Name
              </CFormLabel>
              <div className={styles.searchInput}>
                <CFormInput
                  id="searchName"
                  placeholder="Search by name"
                  value={search.name}
                  onChange={handleSearchChange('name')}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  className="p"
                />
                <CButton
                  color="info"
                  variant="ghost"
                  size="lg"
                  className={`${styles.searchBtn}  d-flex align-items-center gap-2`}
                  type="button"
                  onClick={() => handleSearch(search.system)}
                >
                  Search
                </CButton>
              </div>
            </div>
            <div className={styles.inputWrap}>
              <CFormLabel htmlFor="searchSystem" className="h4 d-flex">
                Instrument System
                {/* <CButton
                          size="lg"
                          variant="ghost"
                          color="secondary"
                          className="ms-4 py-1 d-flex align-items-center "
                          onClick={() => setShowSystemList(true)}
                        >
                          <FaRegPenToSquare className="me-1" /> EDIT
                        </CButton> */}
              </CFormLabel>
              <CFormSelect
                id="searchSystem"
                value={search.system}
                onChange={(e) => {
                  handleSearchChange('system')(e)
                  handleSearch(e.target.value)
                }}
                options={filterOptions}
                className="p"
              />
            </div>
          </div>
          {variant === 'manage' && (
            <CButton
              color="primary"
              size="lg"
              onClick={handleOpenCreate}
              className="btn-ph-primary"
            >
              + Add Instrument
            </CButton>
          )}
        </div>
      </CForm>

      <div className={styles.listArea}>
        {calibrationLists.length === 0 ? (
          <div className={styles.emptyState}>
            <p className="mb-1 fw-semibold">No instruments found</p>
            <p className="mb-0 text-muted">
              Adjust your filters or add a new instrument to get started.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <CTable hover responsive align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell
                    scope="col"
                    className="h5 fw-bold ps-3  py-3"
                  >
                    Instrument Name
                  </CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="h5 fw-bold  py-3">
                    Instrument System
                  </CTableHeaderCell>
                  {variant === 'manage' && (
                    <CTableHeaderCell
                      scope="col"
                      className="text-center h5 fw-bold py-3"
                    >
                      Actions
                    </CTableHeaderCell>
                  )}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {calibrationLists.map((item) => (
                  <CTableRow
                    key={item.id}
                    className={`${styles.tableRow} ${
                      variant === 'select' ? styles.selectableRow : ''
                    }`}
                    onClick={
                      variant === 'select' ? () => onSelect(item) : undefined
                    }
                  >
                    <CTableDataCell className="ps-3">
                      <div className={'d-flex align-items-center gap-3'}>
                        <div>
                          <div className={'p fw-light'}>{item.instru_name}</div>
                        </div>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className={styles.systemPill}>
                        {systemLabelMap[item.system] || item.system}
                      </span>
                    </CTableDataCell>
                    {variant === 'manage' && (
                      <CTableDataCell className="text-center">
                        <div className={styles.cardActions}>
                          <CButton
                            color="secondary"
                            variant="ghost"
                            size="lg"
                            onClick={() => handleEdit(item)}
                            className="btn-ph-outline-primary"
                          >
                            Edit
                          </CButton>
                          <CButton
                            color="danger"
                            variant="outline"
                            size="lg"
                            onClick={() => handleConfirmDeleteRow(item)}
                          >
                            Delete
                          </CButton>
                        </div>
                      </CTableDataCell>
                    )}
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
            <Pagination
              page={pages}
              totalPages={totalPages}
              onPageChange={(newPage) => handleChangePage(newPage)}
            />
          </div>
        )}
      </div>
      <ClientOnly>
        <CModal
          visible={showModal}
          onClose={handleCloseModal}
          alignment="center"
        >
          <CModalHeader>
            <h5 className="m-0 h4 fw-bold">
              {mode === 'create' ? 'Add Instrument' : 'Edit Instrument'}
            </h5>
          </CModalHeader>
          <CForm onSubmit={handleSubmit}>
            <CModalBody>
              <CRow className="g-3 h5">
                <CCol xs={12}>
                  <CFormLabel htmlFor="instru_name">Instrument Name</CFormLabel>
                  <CFormInput
                    id="instru_name"
                    placeholder="Enter instrument name"
                    value={form.instru_name}
                    onChange={handleChange('instru_name')}
                    invalid={Boolean(errors.instru_name)}
                    autoComplete="off"
                    size="lg"
                  />
                  <CFormFeedback invalid>{errors.instru_name}</CFormFeedback>
                </CCol>
                <CCol xs={12}>
                  <CFormLabel htmlFor="instrumentSystem">
                    Instrument System
                  </CFormLabel>
                  <CFormSelect
                    id="instrumentSystem"
                    value={form.system}
                    onChange={handleChange('system')}
                    invalid={Boolean(errors.system)}
                    options={filterOptions}
                    size="lg"
                  />
                  <CFormFeedback invalid>
                    {errors.instrumentSystem}
                  </CFormFeedback>
                </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter className="d-flex justify-content-between">
              <CButton
                color="secondary"
                variant="ghost"
                type="button"
                onClick={handleCloseModal}
                size="lg"
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
