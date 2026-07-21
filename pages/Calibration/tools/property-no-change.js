import { useEffect, useMemo, useState, useContext } from 'react'
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
  CFormTextarea,
  CNav,
  CNavItem,
  CNavLink,
  CRow,
  CTabContent,
  CTabPane,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import {
  FiArrowLeft,
  FiClock,
  FiEdit3,
  FiFileText,
  FiPlus,
} from 'react-icons/fi'
import Swal from 'sweetalert2'
import InstrumentTable from '@/components/calibration/instrumentTable'
import SelectModal from '@/components/calibration/selectModal'
import sharedStyles from '@/styles/calibration.module.scss'
import styles from '@/styles/calibration-tools.module.scss'
import { useToast } from '@/hooks/useToast'
import { toolService } from '@/services/Calibration/toolService'
import { AuthContext } from '@/context/AuthContext'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const formatDateTime = (value) => {
  console.log(value)
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const instrumentSummaryFields = (instrument) => [
  { label: 'Property No.', value: instrument?.property_no },
  { label: 'Instrument', value: instrument?.instrument?.instru_name },
  { label: 'Model', value: instrument?.model },
  { label: 'Vendor', value: instrument?.vendor },
  { label: 'Owner', value: instrument?.owner },
  { label: 'Dept', value: instrument?.dept },
]

export default function PropertyNoChangePage() {
  usePermissionGuard('Calibration')
  const router = useRouter()
  const toast = useToast()
  const { user } = useContext(AuthContext)
  const [showModal, setShowModal] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState(null)
  const [new_property_no, setnew_property_no] = useState('')
  const [remark, setremark] = useState('')
  const [activeTab, setActiveTab] = useState('device')
  const [deviceHistory, setDeviceHistory] = useState([])
  const [userHistory, setUserHistory] = useState([])

  const combinedUserHistory = useMemo(() => {
    return [...userHistory].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
  }, [userHistory])

  const handleSelectInstrument = async (event, instrument) => {
    event.preventDefault()
    setSelectedInstrument(instrument)
    setShowModal(false)
    setnew_property_no('')
    setremark('')
    const result = await toolService.getPropertyNoChangeHistory(
      'device',
      instrument.id
    )
    if (result.status === 'error') {
      toast.error(result.message || 'Failed to fetch device history.')
      return
    }
    const data = result.data || []
    setDeviceHistory(data)
  }

  const handleSubmit = async () => {
    if (!selectedInstrument) {
      toast.error('Please select an instrument first.')
      return
    }

    if (!new_property_no.trim()) {
      toast.error('Please enter the new property number.')
      return
    }

    if (!remark.trim()) {
      toast.error('remark is required.')
      return
    }

    const confirm = await handleConfirm()
    if (!confirm) return

    const result = await toolService.propertyNoUpdate(
      selectedInstrument.id,
      new_property_no.trim(),
      remark.trim()
    )

    if (result.status === 'error') {
      toast.error(result.message || 'Failed to update property number.')
      return
    }

    const data = result.data || {}

    const newRecord = {
      id: data.id,
      instrumentId: selectedInstrument.id,
      propertyNoSnapshot: data.new_property_no || new_property_no.trim(),
      old_property_no: selectedInstrument.property_no,
      new_property_no: data.new_property_no || new_property_no.trim(),
      remark: data.remark || remark.trim(),
      update_by_name: user?.name || '',
      created_at: data.created_at || new Date().toISOString(),
    }

    setDeviceHistory((prev) => [newRecord, ...prev])
    setUserHistory((prev) => [newRecord, ...prev])
    setSelectedInstrument((prev) => ({
      ...prev,
      property_no: data.new_property_no || new_property_no.trim(),
    }))
    setnew_property_no('')
    setremark('')
    toast.success('Frontend preview updated. No backend data was changed.')
  }

  const handleConfirm = async () => {
    const result = await Swal.fire({
      title: 'Confirm property number change?',
      html: `
        <div style="text-align:left;font-size:16px;">
          <div><strong>Current Property No.</strong>: ${
            selectedInstrument.property_no
          }</div>
          <div><strong>New Property No.</strong>: ${new_property_no.trim()}</div>
          <div style="margin-top:8px;"><strong>remark</strong>: ${remark.trim()}</div>
        </div>
      `,
      icon: 'warning',
      confirmButtonText: 'Confirm',
      showCancelButton: true,
      customClass: {
        popup: 'h3',
        title: 'h3 text-danger',
        htmlContainer: 'p text-body-secondary text-center',
      },
    })

    if (!result.isConfirmed) return

    return true
  }

  useEffect(() => {
    if (!selectedInstrument) {
      setDeviceHistory([])
      setnew_property_no('')
      setremark('')
    }
  }, [selectedInstrument])

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const result = await toolService.getPropertyNoChangeHistory(
          'user',
          user.username
        )

        if (result.status === 'error') {
          toast.error(result.message || 'Failed to fetch user history.')
          return
        }

        const data = result.data || []

        const formattedData = data.map((item) => ({
          ...item,
          propertyNoSnapshot: item.calibration?.property_no,
        }))
        setUserHistory(formattedData)
      }
      fetchData()
    }
  }, [user])

  return (
    <>
      <Head>
        <title>Property Number Change</title>
      </Head>
      <CContainer fluid className={sharedStyles.pageShell}>
        <div className={sharedStyles.cardShell}>
          <CCard className={sharedStyles.card}>
            <CCardHeader className={sharedStyles.cardHeader}>
              <div>
                <p className={sharedStyles.eyebrow}>Calibration</p>
                <h2 className={sharedStyles.title}>Property Number Change</h2>
                <p className={sharedStyles.subTitle}>
                  Select an instrument, review current information, and preview
                  property number changes.
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
                          <FiEdit3 size={22} />
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
                    <CCol xs={12}>
                      <CCard className={styles.sectionCard}>
                        <CCardHeader className={styles.sectionHeader}>
                          <div className="h4 m-0">Change Property Number</div>
                        </CCardHeader>
                        <CCardBody className="p-4">
                          <div className={styles.propertyInfoGrid}>
                            {instrumentSummaryFields(selectedInstrument).map(
                              (item) => (
                                <div
                                  key={item.label}
                                  className={styles.propertyInfoCell}
                                >
                                  <div className={`p ${styles.costInfoLabel}`}>
                                    {item.label}
                                  </div>
                                  <div className={`h5 ${styles.costInfoValue}`}>
                                    {item.value || '-'}
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          <div className="mt-4">
                            <div className={styles.propertyFormBlock}>
                              <div>
                                <div className="p mb-2">New Property No.</div>
                                <CFormInput
                                  size="lg"
                                  value={new_property_no}
                                  onChange={(event) =>
                                    setnew_property_no(event.target.value)
                                  }
                                  className="p"
                                  placeholder="Enter new property number"
                                />
                              </div>
                              <div>
                                <div className="p mb-2">
                                  remark
                                  <span className="text-danger ms-1">*</span>
                                </div>
                                <CFormTextarea
                                  rows={4}
                                  value={remark}
                                  className="p"
                                  onChange={(event) =>
                                    setremark(event.target.value)
                                  }
                                  placeholder="Describe why this property number needs to be changed"
                                />
                              </div>
                              <div className="d-flex justify-content-end">
                                <CButton
                                  className="btn-ph-primary"
                                  size="lg"
                                  onClick={handleSubmit}
                                >
                                  Submit Change
                                </CButton>
                              </div>
                            </div>
                          </div>
                        </CCardBody>
                      </CCard>
                    </CCol>

                    <CCol xs={12}>
                      <CCard className={styles.sectionCard}>
                        <CCardHeader className={styles.sectionHeader}>
                          <div className="h4 m-0">Change History</div>
                        </CCardHeader>
                        <CCardBody className="p-4">
                          <CNav variant="tabs" className="mb-3 p">
                            <CNavItem>
                              <CNavLink
                                active={activeTab === 'device'}
                                onClick={() => setActiveTab('device')}
                              >
                                Device History
                              </CNavLink>
                            </CNavItem>
                            <CNavItem>
                              <CNavLink
                                active={activeTab === 'mine'}
                                onClick={() => setActiveTab('mine')}
                              >
                                My Changes
                              </CNavLink>
                            </CNavItem>
                          </CNav>

                          <CTabContent>
                            <CTabPane visible={activeTab === 'device'}>
                              <div className={styles.historyMetaBox}>
                                <FiClock size={16} />
                                <span className="p">
                                  Past property number changes for the selected
                                  instrument.
                                </span>
                              </div>
                              <div className={styles.historyTableWrap}>
                                <CTable
                                  hover
                                  responsive
                                  align="middle"
                                  className="mb-0"
                                >
                                  <CTableHead
                                    className={`${styles.tableHead} p`}
                                  >
                                    <CTableRow>
                                      <CTableHeaderCell>
                                        Old No.
                                      </CTableHeaderCell>
                                      <CTableHeaderCell>
                                        New No.
                                      </CTableHeaderCell>
                                      <CTableHeaderCell>
                                        remark
                                      </CTableHeaderCell>
                                      <CTableHeaderCell>
                                        Changed By
                                      </CTableHeaderCell>
                                      <CTableHeaderCell>
                                        Changed At
                                      </CTableHeaderCell>
                                    </CTableRow>
                                  </CTableHead>
                                  <CTableBody>
                                    {deviceHistory.length === 0 ? (
                                      <CTableRow>
                                        <CTableDataCell
                                          colSpan={5}
                                          className="text-center py-4 text-muted p"
                                        >
                                          No property number history for this
                                          instrument.
                                        </CTableDataCell>
                                      </CTableRow>
                                    ) : (
                                      deviceHistory.map((record) => (
                                        <CTableRow
                                          key={record.id}
                                          className="h5 text-body-secondary fw-bold"
                                        >
                                          <CTableDataCell>
                                            {record.old_property_no}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {record.new_property_no}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {record.remark}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {record.update_by_name}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {formatDateTime(record.created_at)}
                                          </CTableDataCell>
                                        </CTableRow>
                                      ))
                                    )}
                                  </CTableBody>
                                </CTable>
                              </div>
                            </CTabPane>

                            <CTabPane visible={activeTab === 'mine'}>
                              <div className={styles.historyMetaBox}>
                                <FiFileText size={16} />
                                <span className="p">
                                  Personal operation tracking for the current
                                  user.
                                </span>
                              </div>
                              <div className={styles.historyTableWrap}>
                                <CTable
                                  hover
                                  responsive
                                  align="middle"
                                  className="mb-0"
                                >
                                  <CTableHead
                                    className={`${styles.tableHead} p`}
                                  >
                                    <CTableRow>
                                      <CTableHeaderCell>
                                        Current Instrument No.
                                      </CTableHeaderCell>
                                      <CTableHeaderCell>
                                        Old No.
                                      </CTableHeaderCell>
                                      <CTableHeaderCell>
                                        New No.
                                      </CTableHeaderCell>
                                      <CTableHeaderCell>
                                        remark
                                      </CTableHeaderCell>
                                      <CTableHeaderCell>
                                        Changed At
                                      </CTableHeaderCell>
                                    </CTableRow>
                                  </CTableHead>
                                  <CTableBody>
                                    {combinedUserHistory.length === 0 ? (
                                      <CTableRow>
                                        <CTableDataCell
                                          colSpan={5}
                                          className="text-center py-4 text-muted"
                                        >
                                          No personal operation records yet.
                                        </CTableDataCell>
                                      </CTableRow>
                                    ) : (
                                      combinedUserHistory.map((record) => (
                                        <CTableRow
                                          key={record.id}
                                          className="h5 text-body-secondary fw-bold"
                                        >
                                          <CTableDataCell>
                                            {record.propertyNoSnapshot}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {record.old_property_no}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {record.new_property_no}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {record.remark}
                                          </CTableDataCell>
                                          <CTableDataCell>
                                            {formatDateTime(record.created_at)}
                                          </CTableDataCell>
                                        </CTableRow>
                                      ))
                                    )}
                                  </CTableBody>
                                </CTable>
                              </div>
                            </CTabPane>
                          </CTabContent>
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
