import React, { useMemo, useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import {
  CBadge,
  CButton,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CFormCheck,
} from '@coreui/react'
import { FiFilter, FiPlus, FiSearch } from 'react-icons/fi'
import Pagination from '@/components/common/pagination'
import Swal from 'sweetalert2'
import useImportExcerl from '@/hooks/useImportExcerl'
import styles from '@/styles/calibration.module.scss'
import { calibrationService } from '@/services/Calibration/calibration.service'
import InstrumentNameTable from '@/components/calibration/instrumentNameTable'
import SelectModal from '@/components/calibration/selectModal'
import { useToast } from '@/hooks/useToast'
import useUserPermissions from '@/hooks/useUserPermissions'
import ClientOnly from '../common/clientOnly'
import { AuthContext } from '@/context/AuthContext'

const initialFilters = {
  pages: 1,
  searchQuery: '',
  statusFilter: '',
  factoryFilter: '',
  calibrationClassFilter: '',
  instrumentFilter: { id: null, instru_name: '' },
  dueDateFrom: '',
  dueDateTo: '',
  changeDateFrom: '',
  changeDateTo: '',
  overseeFilter: '',
  standardFilter: '',
  commonInstrumentFilter: '',
  medicalEquipmentFilter: '',
  onlyOverdue: false,
  reportApproval: false,
}

const serializeFilters = (filters) => {
  return {
    page: filters.pages || 1,
    keyword: filters.searchQuery || '',
    status: filters.statusFilter || '',
    factory: filters.factoryFilter || '',
    calibrationClass: filters.calibrationClassFilter || '',
    instrumentId: filters.instrumentFilter?.id || '',
    instrumentName: filters.instrumentFilter?.instru_name || '',
    dueDateFrom: filters.dueDateFrom || '',
    dueDateTo: filters.dueDateTo || '',
    changeDateFrom: filters.changeDateFrom || '',
    changeDateTo: filters.changeDateTo || '',
    oversee: filters.overseeFilter || '',
    standard: filters.standardFilter || '',
    common: filters.commonInstrumentFilter || '',
    medical: filters.medicalEquipmentFilter || '',
    overdue: filters.onlyOverdue ? '1' : '',
    reportApproval: filters.reportApproval ? '1' : '',
  }
}

const removeEmptyValues = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) => value !== '' && value !== null && value !== undefined
    )
  )
}

const deserializeFilters = (query) => {
  return {
    pages: Number(query.page || 1),
    searchQuery: query.keyword || '',
    statusFilter: query.status || '',
    factoryFilter: query.factory || '',
    calibrationClassFilter: query.calibrationClass || '',

    instrumentFilter: {
      id: query.instrumentId || null,
      instru_name: query.instrumentName || '',
    },

    dueDateFrom: query.dueDateFrom || '',
    dueDateTo: query.dueDateTo || '',

    changeDateFrom: query.changeDateFrom || '',
    changeDateTo: query.changeDateTo || '',

    overseeFilter: query.oversee || '',
    standardFilter: query.standard || '',
    commonInstrumentFilter: query.common || '',
    medicalEquipmentFilter: query.medical || '',

    onlyOverdue: query.overdue === '1',
    reportApproval: query.reportApproval === '1',
  }
}

const STATUS_OPTIONS = [
  { label: '', value: '' },
  { label: 'Usable', value: 'Usable' },
  { label: 'Calibration', value: 'Calibration' },
  { label: 'RePair', value: 'RePair' },
  { label: 'Suspend', value: 'Suspend' },
  { label: 'Scrap', value: 'Scrap' },
  { label: 'Sale', value: 'Sale' },
  { label: 'Hold', value: 'Hold' },
]

const UPDATE_STATUS_OPTIONS = [
  { label: '', value: '' },
  { label: 'Calibration', value: 'Calibration' },
]

const BOOLEAN_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Yes', value: '1' },
  { label: 'No', value: '0' },
]

const CLASS_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'NCR', value: 'NCR' },
  { label: 'Internal Calibration', value: 'Internal Calibration' },
  { label: 'External Calibration', value: 'External Calibration' },
  { label: 'On-Site', value: 'On-Site' },
]

export default function InstrumentTable({
  variant = 'select',
  onSelect = () => {},
  multiselect = false,
}) {
  const router = useRouter()
  const toast = useToast()
  const { downloadForExcel } = useImportExcerl()
  const { user } = useContext(AuthContext)
  const [instruments, setInstruments] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [filters, setFilters] = useState(initialFilters)
  const [checkBulk, setCheckBulk] = useState(false)
  const [showModal, setShowModal] = useState(null)
  const [showBatchStatusModal, setShowBatchStatusModal] = useState(false)
  const [batchStatus, setBatchStatus] = useState('')
  const [batchRemark, setBatchRemark] = useState('')
  const [loading, setLoading] = useState(false)
  const [pages, setPages] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [factoriesOptions, setFactoriesOptions] = useState([])
  const { hasModuleAccess, handlePermissionGuard } = useUserPermissions()

  const fetchInstruments = async (filters) => {
    setLoading(true)
    const result = await calibrationService.getCalibrationList(filters)
    if (result.status === 'error') {
      console.error('Failed to fetch instruments:', result.message)
    }

    console.log('Fetched instruments:', result.data)
    const dataViwe = (result?.data?.enriched || []).map((item) => ({
      ...item,
      delay_days:
        item.status === 'Usable' &&
        item.calibr_class != 'NCR' &&
        item.calibr_class !== 'On-Site' &&
        item.calibr_class !== 'Sub-Porperty'
          ? handleCheckDelay(item.due_date)
          : 0,
    }))

    const sortData = dataViwe.sort(
      (a, b) => new Date(a.due_date) - new Date(b.due_date)
    )
    setInstruments(sortData || [])
    setLoading(false)
    console.log(filters)
    setPages(filters.pages || 1)
    setTotalPages(result.data?.totalPages || 1)
  }

  const fetchOptions = async () => {
    try {
      const response = await calibrationService.getCalibrationStatisticOptions()

      if (response.status === 'success') {
        const options = [{ label: 'All', value: '' }]
        const factoryOptions = response.data
          .filter((item) => item.value.startsWith('factory|'))
          .map((item) => ({
            label: item.label,
            value: item.value.replace('factory|', ''),
          }))
        options.push(...factoryOptions)
        setFactoriesOptions(options)
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }

  const handleInstrumentSelect = (item) => {
    handleChange(
      {
        target: {
          value: item,
        },
      },
      'instrumentFilter'
    )
    setShowModal(null)
  }

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(instruments.map((item) => item.id))
      return
    }
    setSelectedIds([])
  }

  const handleSelectOne = (id, checked) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id]
      }
      return prev.filter((selectedId) => selectedId !== id)
    })
  }

  const handleCheckStatus = (ids, status) => {
    const selectedInstruments = instruments.filter((item) =>
      ids.includes(item.id)
    )

    const suspendedItems = selectedInstruments.filter(
      (item) => item.status !== 'Usable'
    )

    if (suspendedItems.length > 0) {
      const list = suspendedItems.map((item) => item.property_no).join(', ')

      toast.error(`Only usable instruments can be selected: ${list}`)
      return false
    }

    return true
  }
  const handleSendNotice = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one instrument to send notice.')
      return
    }
    const result = await Swal.fire({
      title:
        'Are you sure you want to send notice for the selected instruments?',
      text: `${selectedIds.length} instrument(s) will receive a notice.`,
      icon: 'warning',
      confirmButtonText: 'Okay',
      showCancelButton: true,
      customClass: {
        popup: 'h3',
        title: 'h3 text-danger',
      },
    })

    if (!result.isConfirmed) return
    const apiResult = await calibrationService.sendNotice({ ids: selectedIds })
    if (apiResult.status === 'success') {
      toast.success('Notice has been sent to the responsible person.')
      initialFilters.factoryFilter = user?.factory || ''
      fetchInstruments({ pages: 1 })
      setFilters(initialFilters)
    } else {
      toast.error('Failed to send notice. Please try again.')
    }
  }

  const handleCheckDelay = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today - due
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }

  function buildSearchParams(params) {
    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => {
        if (value === null) return false
        if (value === undefined) return false
        if (value === '') return false
        if (value === 0) return false // 你的 boolean 轉 1/0 → 0 表示不送
        return true
      })
    )
  }

  const createSearchParams = (sourceFilters) => ({
    pages: sourceFilters.pages,
    searchQuery: sourceFilters.searchQuery,
    status: sourceFilters.statusFilter,
    factory: sourceFilters.factoryFilter,
    calibClass: sourceFilters.calibrationClassFilter,
    instrumentId: sourceFilters.instrumentFilter.id,
    dueDateFrom: sourceFilters.dueDateFrom,
    dueDateTo: sourceFilters.dueDateTo,
    changeDateFrom: sourceFilters.changeDateFrom,
    changeDateTo: sourceFilters.changeDateTo,
    oversee: sourceFilters.overseeFilter,
    standard: sourceFilters.standardFilter,
    is_common: sourceFilters.commonInstrumentFilter,
    is_medical_equipment: sourceFilters.medicalEquipmentFilter,
    onlyOverdue: sourceFilters.onlyOverdue ? 1 : 0,
    reportApproval: sourceFilters.reportApproval ? 'PENDING' : null,
  })

  const handleChangeCheck = async (event, type) => {
    const newFilter = {
      ...filters,
      [type]: event.target.checked,
    }
    setFilters(newFilter)
  }

  const handleChange = async (event, type) => {
    const value = event.target.value
    const newFilter = {
      ...filters,
      [type]: value,
    }
    setFilters(newFilter)
    setSelectedIds([])
  }

  const handleSearch = () => {
    const queryParams = removeEmptyValues(
      serializeFilters({
        ...filters,
        pages: 1, // 搜尋時通常回第一頁
      })
    )

    setSelectedIds([])

    router.push(
      {
        pathname: router.pathname,
        query: queryParams,
      },
      undefined,
      { shallow: true }
    )
  }

  const handleResetSearch = async () => {
    initialFilters.factoryFilter = user?.factory || ''
    console.log('Resetting filters to:', initialFilters)
    setFilters(initialFilters)
    setCheckBulk(false)
    setSelectedIds([])
    setShowBatchStatusModal(false)
    setBatchStatus('')
    setBatchRemark('')
    const searchParams = {
      pages: 1,
    }
  }

  const handleSerchKeyDown = (event) => {
    if (event.key === 'Enter') {
      // Trigger search action
      handleSearch()
    }
  }

  const handleChangePage = async (newPage) => {
    // const filteredParams = buildSearchParams(
    //   createSearchParams(filters, newPage)
    // )
    const queryParams = removeEmptyValues(
      serializeFilters({
        ...filters,
        pages: newPage, // 搜尋時通常回第一頁
      })
    )

    setSelectedIds([])

    router.push(
      {
        pathname: router.pathname,
        query: queryParams,
      },
      undefined,
      { shallow: true }
    )
    // await fetchInstruments(filteredParams)
  }

  const handleStartBatchUpdate = () => {
    setSelectedIds([])
    setCheckBulk(true)
  }

  const handleCancelBatchUpdate = () => {
    setSelectedIds([])
    setCheckBulk(false)
    setShowBatchStatusModal(false)
    setBatchStatus('')
    setBatchRemark('')
  }

  const handleOpenBatchStatusModal = () => {
    setBatchStatus('')
    setBatchRemark('')
    setShowBatchStatusModal(true)
  }

  const handleSubmitBatchStatus = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one instrument to update.')
      return
    }
    if (!batchStatus) {
      toast.error('Please select a status.')
      return
    }

    if (!handleCheckStatus(selectedIds, batchStatus)) return

    const apiResult = await calibrationService.batchChangeStatus(
      selectedIds,
      batchStatus,
      batchRemark
    )

    if (apiResult.status === 'success') {
      toast.success('Status updated successfully.')
      fetchInstruments({ pages: 1 })
      initialFilters.factoryFilter = user?.factory || ''
      setFilters(initialFilters)
    } else {
      toast.error('Failed to update status. Please try again.')
    }

    setShowBatchStatusModal(false)
    setBatchStatus('')
    setBatchRemark('')
    setSelectedIds([])
    setCheckBulk(false)
  }

  const allSelected =
    instruments.length > 0 && selectedIds.length === instruments.length

  const handleDownloadExcel = () => {
    const title = [
      'No.',
      'Due Date(下次校正日)',
      'Delay Days(逾期未校正天數)',
      'Status',
      'Status Date',
      'Calibration Date',
      'ID',
      'Purchase price(購入金額 NTD)',
      'Category(儀器類別)',
      'Name',
      'Vendor',
      'Model',
      'Instru. S/N',
      'Factory',
      'Dept',
      'Owner',
      'Class',
      'Cycle',
      'Sub-Porperty No(子財產編號)',
      'Create date(建檔日期)',
      'Is Medical Equipment(是否為醫材設備)',
      'Calibration Cost(校驗費用)',
    ]

    // 定義欄位名稱的標題
    function formatDate(date) {
      return date ? date.slice(0, 10) : null
    }

    // 組織表格資料的內容
    const data = instruments.map((item, index) => {
      const latestCalibrationDate =
        formatDate(item.latest_calibration_log_change_date) ||
        formatDate(item.latest_calibration_log_created_at) ||
        '-'

      return [
        index + 1,
        item.due_date,
        item.delay_days,
        item.status,
        formatDate(item.change_date),
        latestCalibrationDate,
        item.property_no,
        item.first_price || '-',
        item.instrument?.system,
        item.instrument?.instru_name,
        item.vendor,
        item.model,
        item.instru_sn,
        item.factory,
        item.dept,
        `${item.owner}`,
        item.calibr_class,
        item.calibr_cycle,
        item.sub_instru_id || '-',
        formatDate(item.date),
        item.is_medical_equipment ? 'Y' : 'N',
        item.calibration_cost || '-',
      ]
    })

    // 將標題與資料合併，形成完整的資料表
    const finalData = [title, ...data]
    const today = new Date().toISOString().slice(0, 10) // 取得今天的日期，格式為 YYYY-MM-DD
    // 呼叫下載函式
    downloadForExcel(finalData, `Calibration_${today}.xlsx`, {
      headerStyle: {
        font: {
          bold: true,
          color: { argb: 'FFFFFFFF' },
        },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '336600' },
        },
        alignment: {
          vertical: 'middle',
          horizontal: 'center',
        },
      },
      bodyStyle: {
        alignment: {
          vertical: 'middle',
          horizontal: 'left',
        },
      },
    })
  }

  useEffect(() => {
    // fetchInstruments({ pages: 1 })
    fetchOptions()
  }, [])

  useEffect(() => {
    if (!filters.onlyOverdue) {
      setSelectedIds([])
    }
  }, [filters.onlyOverdue])

  useEffect(() => {
    if (!router.isReady) return
    if (!user) return

    setFilters((prev) => ({
      ...prev,
      factoryFilter: user?.factory || '',
    }))

    const queryKeys = Object.keys(router.query)

    const onlyHasPage = queryKeys.length === 0

    if (onlyHasPage) return
    const restoredFilters = deserializeFilters(router.query)
    setFilters(restoredFilters)
    const filteredParams = buildSearchParams(
      createSearchParams(restoredFilters)
    )

    fetchInstruments(filteredParams)
  }, [router.isReady, router.query, user])

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div className="d-flex flex-grow-1 align-items-end gap-2">
          <div className="flex-grow-1">
            <CInputGroup className="w-auto flex-grow-1" size="lg">
              <CInputGroupText>
                <FiSearch />
              </CInputGroupText>
              <CFormInput
                placeholder="Search by property no / vendor / model / owner / dept / description / instrument SN / sub-property no"
                value={filters.searchQuery}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchQuery: event.target.value,
                  }))
                }
                autoComplete="off"
                size="lg"
                onKeyDown={handleSerchKeyDown}
              />
            </CInputGroup>
          </div>
          <CButton
            id="Apply-Filters"
            color="primary"
            variant="outline"
            className="btn-ph-primary d-flex align-items-center gap-2"
            size="lg"
            onClick={() => {
              // Handle button click
              handleSearch()
            }}
          >
            Search
          </CButton>
          <CButton
            id="Reset-Filters"
            color="primary"
            variant="outline"
            className="btn-ph-outline-primary d-flex align-items-center gap-2"
            size="lg"
            onClick={() => {
              handleResetSearch()
            }}
          >
            Reset Filters
          </CButton>
          {variant === 'manage' && (
            <CButton
              color="success"
              size="lg"
              variant="outline"
              className="d-flex align-items-center gap-2"
              onClick={handleDownloadExcel}
            >
              Download Excel
            </CButton>
          )}
        </div>
        {variant === 'manage' && hasModuleAccess('Calibration') && (
          <CButton
            color="primary"
            size="lg"
            className="btn-ph-primary d-flex align-items-center gap-2"
            href="/Calibration/instruments/add"
          >
            <FiPlus />
            Add Instrument
          </CButton>
        )}
      </div>
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-6 col-xl-3">
          <CFormLabel className="text-muted mb-1 h6">Instrument</CFormLabel>
          <div className="d-flex">
            <CFormInput
              size="lg"
              value={filters.instrumentFilter.instru_name}
              onChange={(event) => {
                handleChange(event, 'instrumentFilter')
              }}
              readOnly
            ></CFormInput>
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
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <CFormLabel className="text-muted mb-1 h6">Due Date From</CFormLabel>
          <CFormInput
            type="date"
            size="lg"
            value={filters.dueDateFrom}
            onChange={(event) => {
              handleChange(event, 'dueDateFrom')
            }}
            placeholder="Due Date From"
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <CFormLabel className="text-muted mb-1 h6">Due Date To</CFormLabel>
          <CFormInput
            type="date"
            size="lg"
            value={filters.dueDateTo}
            onChange={(event) => {
              handleChange(event, 'dueDateTo')
            }}
            placeholder="Due Date To"
          />
        </div>
        {variant === 'manage' && (
          <>
            <div className="col-12 col-md-6 col-xl-3">
              <CFormLabel className="text-muted mb-1 h6">
                Change Date From
              </CFormLabel>
              <CFormInput
                type="date"
                size="lg"
                value={filters.changeDateFrom}
                onChange={(event) => {
                  handleChange(event, 'changeDateFrom')
                }}
                placeholder="Change Date From"
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <CFormLabel className="text-muted mb-1 h6">
                Change Date To
              </CFormLabel>
              <CFormInput
                type="date"
                size="lg"
                value={filters.changeDateTo}
                onChange={(event) => {
                  handleChange(event, 'changeDateTo')
                }}
                placeholder="Change Date To"
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <CFormLabel className="text-muted mb-1 h6">Status</CFormLabel>
              <CFormSelect
                size="lg"
                value={filters.statusFilter}
                options={STATUS_OPTIONS}
                onChange={(event) => {
                  handleChange(event, 'statusFilter')
                }}
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <CFormLabel className="text-muted mb-1 h6">Factory</CFormLabel>
              <CFormSelect
                size="lg"
                value={filters.factoryFilter}
                options={factoriesOptions}
                onChange={(event) => {
                  handleChange(event, 'factoryFilter')
                }}
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <CFormLabel className="text-muted mb-1 h6">
                Calibration Class
              </CFormLabel>
              <CFormSelect
                size="lg"
                value={filters.calibrationClassFilter}
                options={CLASS_FILTER_OPTIONS}
                onChange={(event) => {
                  handleChange(event, 'calibrationClassFilter')
                }}
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <CFormLabel className="text-muted mb-1 h6">
                Customhouse oversee(是否海關監管)
              </CFormLabel>
              <CFormSelect
                size="lg"
                value={filters.overseeFilter}
                options={BOOLEAN_FILTER_OPTIONS}
                onChange={(event) => {
                  handleChange(event, 'overseeFilter')
                }}
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <CFormLabel className="text-muted mb-1 h6">
                Standard type(是否為標準件)
              </CFormLabel>
              <CFormSelect
                size="lg"
                value={filters.standardFilter}
                options={BOOLEAN_FILTER_OPTIONS}
                onChange={(event) => {
                  handleChange(event, 'standardFilter')
                }}
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <CFormLabel className="text-muted mb-1 h6">
                Is Common Instrument(是否為共用儀器)
              </CFormLabel>
              <CFormSelect
                size="lg"
                value={filters.commonInstrumentFilter}
                options={BOOLEAN_FILTER_OPTIONS}
                onChange={(event) => {
                  handleChange(event, 'commonInstrumentFilter')
                }}
              />
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <CFormLabel className="text-muted mb-1 h6">
                Is Medical Equipment(是否為醫材設備)
              </CFormLabel>
              <CFormSelect
                size="lg"
                value={filters.medicalEquipmentFilter}
                options={BOOLEAN_FILTER_OPTIONS}
                onChange={(event) => {
                  handleChange(event, 'medicalEquipmentFilter')
                }}
              />
            </div>
            <div className="col-12 col-xl-3 d-flex align-items-end justify-content-start gap-3">
              <CFormCheck
                id="filter-overdue"
                label={<span className="h6">Overdue Calibration</span>}
                button={{ color: 'danger', variant: 'outline' }}
                checked={filters.onlyOverdue}
                onChange={(event) => {
                  handleChangeCheck(event, 'onlyOverdue')
                }}
              />
              {hasModuleAccess('Calibration_boss') && (
                <CFormCheck
                  id="filter-pending-report"
                  button={{ color: 'info', variant: 'outline' }}
                  label={<span className="h6">Pending Approval</span>}
                  checked={filters.reportApproval}
                  onChange={(event) => {
                    handleChangeCheck(event, 'reportApproval')
                  }}
                />
              )}
            </div>
            <div className="col-12 col-xl-3 d-flex align-items-end justify-content-start gap-3">
              {!checkBulk ? (
                <CButton
                  color="primary"
                  size="lg"
                  className="btn-ph-primary "
                  onClick={handleStartBatchUpdate}
                >
                  Batch Update Status
                </CButton>
              ) : (
                <div className="d-flex flex-wrap align-items-center gap-2 h6">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold h6">
                      {selectedIds.length} items selected
                    </span>
                  </div>
                  <CButton
                    color="secondary"
                    size="lg"
                    variant="outline"
                    className="align-self-start"
                    onClick={handleCancelBatchUpdate}
                  >
                    Cancel
                  </CButton>
                  <CButton
                    color="primary"
                    size="lg"
                    className="btn-ph-primary align-self-start"
                    type="button"
                    onClick={handleOpenBatchStatusModal}
                    disabled={selectedIds.length === 0}
                  >
                    Update Status
                  </CButton>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {filters.onlyOverdue && (
        <div className="d-flex justify-content-start gap-2 mb-3">
          <CButton
            color="secondary"
            size="lg"
            className="p"
            variant="outline"
            onClick={() => handleSendNotice()}
          >
            Send Notice
          </CButton>
        </div>
      )}
      <div className="border rounded-4 shadow-sm bg-white">
        <CTable hover responsive align="middle" className="mb-0">
          <CTableHead>
            <CTableRow className="h5 text-center fw-bold">
              <CTableHeaderCell scope="col" className="py-3 ps-3 ">
                {checkBulk ? (
                  <CFormCheck
                    checked={allSelected}
                    onChange={(event) => handleSelectAll(event.target.checked)}
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : (
                  'No.'
                )}
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" className="py-3">
                ID
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" className="py-3">
                Name
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" className="py-3">
                Category
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" className="py-3">
                Class
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" className="py-3">
                Cycle
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" className="py-3">
                Owner
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" className="py-3">
                Dept
              </CTableHeaderCell>
              <CTableHeaderCell scope="col" className="py-3">
                Due Date
              </CTableHeaderCell>
              {variant === 'manage' && (
                <>
                  <CTableHeaderCell scope="col" className="py-3">
                    Delay Days
                  </CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="py-3">
                    Report Status
                  </CTableHeaderCell>
                  <CTableHeaderCell scope="col" className="py-3 pe-3">
                    Status
                  </CTableHeaderCell>
                </>
              )}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {loading ? (
              <CTableRow>
                <CTableDataCell colSpan={14} className="text-center">
                  Loading...
                </CTableDataCell>
              </CTableRow>
            ) : (
              instruments.map((item, i) => {
                const isExpanded = expandedId === item.id
                return (
                  <React.Fragment key={item.id}>
                    <CTableRow
                      key={item.id}
                      className="p fw-light text-center"
                      onClick={() => toggleExpand(item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <CTableDataCell className="ps-3">
                        {checkBulk || multiselect === true ? (
                          <CFormCheck
                            checked={selectedIds.includes(item.id)}
                            onChange={(event) =>
                              handleSelectOne(item.id, event.target.checked)
                            }
                            onClick={(event) => event.stopPropagation()}
                          />
                        ) : (
                          i + 1
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color={
                            item.delay_days > 0 && variant === 'manage'
                              ? 'danger'
                              : 'link'
                          }
                          className="fw-bold"
                          size="lg"
                          onClick={(event) => onSelect(event, item)}
                        >
                          {item.property_no}
                        </CButton>
                      </CTableDataCell>
                      <CTableDataCell>
                        <span
                          className="d-inline-block text-truncate"
                          style={{ maxWidth: '200px' }}
                          title={item.instrument?.instru_name || '-'}
                        >
                          {item.instrument?.instru_name || '-'}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>{item.instrument?.system}</CTableDataCell>
                      <CTableDataCell>{item.calibr_class}</CTableDataCell>
                      <CTableDataCell>{`${
                        item.calibr_cycle ? item.calibr_cycle + ' months' : '-'
                      }`}</CTableDataCell>
                      <CTableDataCell>{item.owner}</CTableDataCell>
                      <CTableDataCell>{item.dept}</CTableDataCell>
                      <CTableDataCell>{item.due_date}</CTableDataCell>

                      {variant === 'manage' && (
                        <>
                          <CTableDataCell
                            className={
                              item.delay_days ? 'text-danger fw-bold' : ''
                            }
                          >
                            {item.delay_days}
                          </CTableDataCell>
                          <CTableDataCell>
                            <span
                              className={`${
                                item.report_approval === 'PENDING'
                                  ? 'text-info'
                                  : item.report_approval === 'REJECTED'
                                  ? 'text-danger'
                                  : 'text-muted'
                              } fw-semibold`}
                            >
                              {item.report_approval || '-'}
                            </span>
                          </CTableDataCell>
                          <CTableDataCell className="pe-3">
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
                        </>
                      )}
                    </CTableRow>
                    {isExpanded && (
                      <CTableRow color="light">
                        <CTableDataCell
                          colSpan={12}
                          className="text-start px-4 py-3 p"
                        >
                          <div className="row g-2">
                            <div className="col-12 col-md-6 col-xl-4">
                              <span className="text-muted small me-2">
                                Purchase price:
                              </span>
                              <span className="fw-semibold">
                                {item.first_price ?? '-'}
                              </span>
                            </div>
                            <div className="col-12 col-md-6 col-xl-4">
                              <span className="text-muted small me-2">
                                Instru. S/N:
                              </span>
                              <span className="fw-semibold">
                                {item.instru_sn || '-'}
                              </span>
                            </div>
                            <div className="col-12 col-md-6 col-xl-4">
                              <span className="text-muted small me-2">
                                Vendor:
                              </span>
                              <span className="fw-semibold">
                                {item.vendor || item.Vendor || '-'}
                              </span>
                            </div>
                            <div className="col-12 col-md-6 col-xl-4">
                              <span className="text-muted small me-2">
                                Model:
                              </span>
                              <span className="fw-semibold">
                                {item.model || item.Model || '-'}
                              </span>
                            </div>
                            <div className="col-12 col-md-6 col-xl-4">
                              <span className="text-muted small me-2">
                                Sub-Porperty No(子財產編號):
                              </span>
                              <span className="fw-semibold">
                                {item.sub_instru_id === null ||
                                item.sub_instru_id === 'undefined'
                                  ? '-'
                                  : item.sub_instru_id}
                              </span>
                            </div>
                            <div className="col-12 col-md-6 col-xl-4">
                              <span className="text-muted small me-2">
                                Is Medical Equipment(是否為醫材設備):
                              </span>
                              <span className="fw-semibold">
                                {item.is_medical_equipment ? 'Y' : 'N'}
                              </span>
                            </div>
                            <div className="col-12 col-md-6 col-xl-4">
                              <span className="text-muted small me-2">
                                Oversee(是否海關監管):
                              </span>
                              <span className="fw-semibold">
                                {item.oversee ? 'Y' : 'N'}
                              </span>
                            </div>
                            <div className="col-12 col-md-6 col-xl-4">
                              <span className="text-muted small me-2">
                                Calibration Cost(校驗費用):
                              </span>
                              <span className="fw-semibold">
                                {item.oversee ? 'Y' : 'N'}
                              </span>
                            </div>
                            <div className="col-12 col-md-6 col-xl-4">
                              <span className="text-muted small me-2">
                                Factory(廠區):
                              </span>
                              <span className="fw-semibold">
                                {item.factory || '-'}
                              </span>
                            </div>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </CTableBody>
        </CTable>
        {instruments.length === 0 && (
          <div className="p-4 text-center text-muted">
            No instruments found. Try a different search.
          </div>
        )}
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        {instruments.length > 0 && (
          <Pagination
            page={pages}
            totalPages={totalPages}
            onPageChange={(newPage) => handleChangePage(newPage)}
          />
        )}
        {multiselect && (
          <div className="h6">
            <CButton
              color="primary"
              size="lg"
              type="button"
              className="btn-ph-primary"
              onClick={(event) => {
                event.stopPropagation()
                const selectedInstruments = instruments.filter((item) =>
                  selectedIds.includes(item.id)
                )
                onSelect(event, selectedInstruments)
              }}
            >
              Submit
            </CButton>
          </div>
        )}
      </div>

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
      </SelectModal>
      <ClientOnly>
        <CModal
          visible={showBatchStatusModal}
          onClose={() => setShowBatchStatusModal(false)}
          alignment="center"
        >
          <CModalHeader>
            <CModalTitle>Update Status</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="mb-3 text-muted h6">
              {selectedIds.length} selected
            </div>
            <CFormLabel className="text-muted mb-1 h6">
              Status to update
            </CFormLabel>
            <CFormSelect
              size="lg"
              value={batchStatus}
              options={UPDATE_STATUS_OPTIONS}
              onChange={(event) => setBatchStatus(event.target.value)}
            />
            <CFormLabel className="text-muted mt-3 mb-1 h6">Remark</CFormLabel>
            <CFormTextarea
              rows={4}
              value={batchRemark}
              onChange={(event) => setBatchRemark(event.target.value)}
              placeholder="Enter remark"
            />
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              variant="ghost"
              size="lg"
              type="button"
              onClick={() => setShowBatchStatusModal(false)}
            >
              Cancel
            </CButton>
            <CButton
              color="primary"
              size="lg"
              className="btn-ph-primary"
              type="button"
              onClick={handleSubmitBatchStatus}
            >
              Submit
            </CButton>
          </CModalFooter>
        </CModal>
      </ClientOnly>
    </>
  )
}
