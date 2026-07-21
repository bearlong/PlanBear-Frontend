import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useToast } from '@/hooks/useToast'
import { FaArrowUpFromBracket, FaXmark } from 'react-icons/fa6'
import Image from 'next/image'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CRow,
  CFormCheck,
} from '@coreui/react'
import useFileManagement from '@/hooks/useFileManagement'
import { calibrationService } from '@/services/Calibration/calibration.service'
import { api } from '@/utils/api'
import ClientOnly from '@/components/common/clientOnly'
import InstrumentNameTable from '@/components/calibration/instrumentNameTable'
import InstrumentFactoryTable from '@/components/calibration/instrumentFactoryTable'
import SelectModal from '@/components/calibration/selectModal'
import styles from '@/styles/calibration.module.scss'
import DeptTree from '../common/deptTree'

const initData = {
  description: '',
  status: 'Usable',
  scrap_remark: '',
  instru_sn: '',
  vendor: '',
  model: '',
  calibr_class: '',
  ncr_description: '',
  calibr_cycle: 0,
  doc_no: '',
  sub_instru_id: '',
  oversee: false,
  standard: false,
  is_common: false,
  is_medical_equipment: false,
  instrument: '',
  calibration_org: '',
}

export default function InformationEdit({
  instrumentData,
  history,
  showEditModal,
  setShowEditModal,
  fetchInstrument,
}) {
  const router = useRouter()
  const [editForm, setEditForm] = useState(initData)
  const [showModal, setShowModal] = useState(null)

  const initialRef = useRef(null)

  const toast = useToast()
  const { handleFileUpload, handleDeleteFile, handlePreview } =
    useFileManagement()

  const fileIcons = {
    pdf: '/img/pdf.png',
    doc: '/img/word.png',
    docx: '/img/word.png',
    txt: '/img/txt.png',
    xls: '/img/excel.png',
    xlsx: '/img/excel.png',
    csv: '/img/excel.png',
    ppt: '/img/ppt.png',
    pptx: '/img/ppt.png',
    jpg: '/img/jpg.png',
    jpeg: '/img/jpg.png',
    png: '/img/jpg.png',
    zip: '/img/zip.png',
    rar: '/img/zip.png',
    default: '/img/other.png',
  }

  function transformFiles(files = []) {
    console.log(files)
    return files.map((file) => {
      const cleaned = (file.file_type || '').replace('.', '')
      return {
        id: file.id,
        file_url: file.file_url,
        file: { name: file.file_url },
        icon: fileIcons[cleaned] || fileIcons.default,
        existing: true,
      }
    })
  }

  const handleInstrumentSelect = (item) => {
    setEditForm((prev) => ({
      ...prev,
      instrument: item,
    }))
    setShowModal(null)
  }

  const handleFactorySelect = (item) => {
    setEditForm((prev) => ({
      ...prev,
      calibration_org: { id: item.id, name: item.name },
    }))

    setShowModal(null)
  }

  const handleSelectOwner = (item) => {
    if (!item || item?.type?.trim() !== 'user') return

    setEditForm((prev) => ({
      ...prev,
      owner: item.fullname,
      owner_username: item.username,
      dept: item.dept,
    }))
    setShowModal(null)
  }
  const handleEditUpload = (id, targetItem, e) => {
    const targetItemArr = [
      {
        id,
        AttachFile:
          targetItem.AttachFile?.length > 0 ? targetItem.AttachFile : [],
        ...targetItem,
      },
    ]
    const newItem = handleFileUpload(id, targetItemArr, e)
    setEditForm((prev) => ({
      ...prev,
      AttachFile: newItem.find((item) => item.id === id)?.AttachFile || [],
    }))
  }

  const handleEditDeleteFile = (id, targetItem, file) => {
    const targetItemArr = [
      {
        id,
        AttachFile:
          targetItem.AttachFile?.length > 0
            ? targetItem.AttachFile
            : instrumentData.AttachFile || [],
        ...targetItem,
      },
    ]
    const newItem = handleDeleteFile(id, targetItemArr, file)
    setEditForm((prev) => ({
      ...prev,
      AttachFile: newItem.find((item) => item.id === id)?.AttachFile || [],
    }))
  }

  const handleCloseEdit = () => {
    setShowEditModal(false)
    setEditForm(initData)
  }

  const normalizeValue = (k, v) => {
    // 依欄位型別整理
    if (
      [
        'description',
        'scrap_remark',
        'instru_sn',
        'vendor',
        'model',
        'ncr_description',
        'doc_no',
        'sub_instru_id',
      ].includes(k)
    ) {
      const s = (v ?? '').toString().trim()
      return s === '' ? null : s
    }
    if (k === 'calibr_cycle') return Number(v ?? 0)
    if (
      ['oversee', 'standard', 'is_common', 'is_medical_equipment'].includes(k)
    )
      return Boolean(v)
    return v
  }

  const shallowEqual = (a, b) => a === b

  const filesSig = (arr = []) =>
    arr.map((x) => x?.file?.name ?? x?.name ?? '').join('|') // 依你的 file shape 調整

  const buildPatch = (current, initial) => {
    const keys = [
      'description',
      'status',
      'scrap_remark',
      'instru_sn',
      'vendor',
      'model',
      'calibr_class',
      'ncr_description',
      'calibr_cycle',
      'doc_no',
      'sub_instru_id',
      'oversee',
      'standard',
      'is_common',
      'is_medical_equipment',
      'owner',
      'owner_username',
      'dept',
    ]

    const patch = {}

    for (const k of keys) {
      const cur = normalizeValue(k, current?.[k])
      const ini = normalizeValue(k, initial?.[k])
      if (!shallowEqual(cur, ini)) patch[k] = cur
    }

    // 轉換 instrument / calibration_org 成後端要的 id 欄位
    const curInstruId =
      current?.instrument?.id != null ? Number(current.instrument.id) : null
    const iniInstruId =
      initial?.instrument?.id != null ? Number(initial.instrument.id) : null
    if (curInstruId !== iniInstruId) patch.instru_id = curInstruId
    patch.instrument = current?.instrument ?? null

    const curOrgId =
      current?.calibration_org?.id != null
        ? Number(current.calibration_org.id)
        : null
    const iniOrgId =
      initial?.calibration_org?.id != null
        ? Number(initial.calibration_org.id)
        : null
    if (curOrgId !== iniOrgId) patch.external_calibr_id = curOrgId

    patch.AttachFile = current?.AttachFile ?? []
    patch.keepFileIds = existingFileIds
    return patch
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()

    const initial = initialRef.current
    const patch = buildPatch(editForm, initial)

    if (Object.keys(patch).length === 0) {
      toast.success('No changes.')
      handleCloseEdit()
      return
    }
    console.log('patch', patch)
    const result = await calibrationService.updateCalibration(
      instrumentData.id,
      patch
    )
    if (result.status === 'error') {
      console.error(result)
      toast.error(result.message || 'Failed to update instrument.')
      return
    }
    toast.success('Instrument updated successfully.')
    fetchInstrument(instrumentData.id)
    handleCloseEdit()
  }

  const statusOptions = [
    { label: 'Usable', value: 'Usable' },
    { label: 'Calibration', value: 'Calibration' },
    { label: 'Sale', value: 'Sale' },
    { label: 'Hold', value: 'Hold' },
    { label: 'Suspend', value: 'Suspend' },
    { label: 'RePair', value: 'RePair' },
    { label: 'Scrap', value: 'Scrap' },
  ]

  const classOptions = [
    { label: '', value: '' },
    { label: 'Internal Calibration', value: 'Internal Calibration' },
    { label: 'External Calibration', value: 'External Calibration' },
    { label: 'NCR', value: 'NCR' },
    { label: 'On-Site', value: 'On-Site' },
  ]

  const cycleOptions = [
    { label: '0', value: 0 },
    { label: '1 months', value: 1 },
    { label: '2 months', value: 2 },
    { label: '3 months', value: 3 },
    { label: '6 months', value: 6 },
    { label: '12 months', value: 12 },
    { label: '24 months', value: 24 },
    { label: '36 months', value: 36 },
  ]

  const setField = (key) => (e) =>
    setEditForm((prev) => ({ ...prev, [key]: e.target.value }))
  const setBool = (key, value) =>
    setEditForm((prev) => ({ ...prev, [key]: value }))

  if (!instrumentData) {
    return (
      <CContainer fluid className={styles.pageShell}>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardBody className={styles.cardBody}>
              <h4 className="mb-2">Instrument Not Found</h4>
              <p className="text-muted">
                We could not locate the instrument you requested.
              </p>
              <CButton
                color="primary"
                size="lg"
                className="btn-ph-primary"
                onClick={() => router.push('/Calibration/instruments')}
              >
                Back to List
              </CButton>
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    )
  }

  const showStatusRemark = useMemo(() => {
    const status = editForm.status || instrumentData.status
    return (
      status === 'RePair' ||
      status === 'Scrap' ||
      status === 'Hold' ||
      status === 'Suspend' ||
      status === 'Sale'
    )
  }, [editForm.status, instrumentData.status])

  const currentClass = editForm.calibr_class || instrumentData.calibr_class

  const targetReportLog = useMemo(() => {
    if (!history?.length) return null

    return history[history.length - 1]
  }, [history])

  const existingFileIds = useMemo(
    () =>
      editForm.AttachFile?.filter((file) => file.existing).map(
        (file) => file.id
      ),
    [editForm.AttachFile]
  )

  useEffect(() => {
    if (!showEditModal || !instrumentData) return
    console.log(targetReportLog)

    const initial = {
      description: instrumentData.description ?? '',
      status: instrumentData.status ?? 'Usable',
      scrap_remark: instrumentData.scrap_remark ?? '',
      instru_sn: instrumentData.instru_sn ?? '',
      vendor: instrumentData.vendor ?? '',
      model: instrumentData.model ?? '',
      calibr_class: instrumentData.calibr_class ?? '',
      ncr_description: instrumentData.ncr_description ?? '',
      calibr_cycle: instrumentData.calibr_cycle ?? 0,
      doc_no: instrumentData.doc_no ?? '',
      sub_instru_id:
        instrumentData.sub_instru_id === '' ||
        instrumentData.sub_instru_id === 'undefined'
          ? null
          : Number(instrumentData.sub_instru_id),
      oversee: instrumentData.oversee ?? false,
      standard: instrumentData.standard ?? false,
      is_common: instrumentData.is_common ?? false,
      is_medical_equipment: instrumentData.is_medical_equipment ?? false,
      instrument: instrumentData.instrument ?? '',
      calibration_org: instrumentData.calibration_org ?? '',
      owner: instrumentData.owner ?? '',
      owner_username: instrumentData.owner_username || '',
      dept: instrumentData.dept || '',
      AttachFile: transformFiles(targetReportLog?.calibration_log_file || []),
    }
    setEditForm(initial)
    initialRef.current = initial
  }, [showEditModal, instrumentData, history])

  return (
    <>
      <ClientOnly>
        <CModal
          visible={showEditModal}
          onClose={() => handleCloseEdit()}
          size="xl"
        >
          <CModalHeader>
            <h5 className="m-0 h3 fw-bold">Edit Instrument</h5>
          </CModalHeader>
          <CForm onSubmit={handleEditSubmit}>
            <CModalBody>
              <CRow className="g-3 p">
                <CCol md={6}>
                  <CFormLabel htmlFor="PorpertyNo">
                    Porperty No(財產編號)
                  </CFormLabel>
                  <span className="text-muted small d-block mb-1">
                    {instrumentData.property_no}
                  </span>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editDescription">
                    Description(儀器說明)
                  </CFormLabel>
                  <CFormInput
                    id="editDescription"
                    value={editForm.description || ''}
                    onChange={setField('description')}
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editStatus">Status(使用狀態)</CFormLabel>
                  <CFormSelect
                    id="editStatus"
                    value={editForm.status || ''}
                    onChange={(e) => {
                      setEditForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                        AttachFile: [],
                      }))
                    }}
                    options={statusOptions}
                    size="lg"
                    disabled={instrumentData.status === 'Calibration'}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editStatusRemark">
                    Status Remark(狀態備註)
                  </CFormLabel>
                  {showStatusRemark && (
                    <>
                      <div className="d-flex ">
                        <CFormInput
                          id="editStatusRemark"
                          value={editForm.scrap_remark || ''}
                          onChange={setField('scrap_remark')}
                          size="lg"
                        />
                        <CButton
                          color="info"
                          variant="outline"
                          className="p-0 ms-2 btn-ph-outline-primary"
                          size="lg"
                        >
                          <label
                            htmlFor={`file-uploadEdit`}
                            className="py-2 px-3 center-flex h5 m-0"
                          >
                            <FaArrowUpFromBracket size={12.5} className="" />
                          </label>
                        </CButton>
                        <CFormInput
                          type="file"
                          className="d-none"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip,.rar" // 限定檔案類型
                          id={`file-uploadEdit`}
                          onChange={(e) => {
                            handleEditUpload(instrumentData.id, editForm, e)
                          }}
                        />
                      </div>
                    </>
                  )}
                  {editForm.AttachFile?.map((v, index) => (
                    <div
                      className="d-flex align-items-center mt-2 "
                      key={index}
                    >
                      <button
                        className="center-flex border border-2 border-dark p-2 rounded h5 fw-bold m-0"
                        onClick={(e) => {
                          e.preventDefault()
                          if (v.preview) {
                            handlePreview(v.preview)
                          } else {
                            const filename = encodeURIComponent(v.file.name)
                            const url = api(
                              `/data/files?filename=calibration/${filename}`
                            )
                            window.open(url, '_blank')
                          }
                        }}
                      >
                        <div className={styles.imgbox}>
                          <Image
                            src={v.icon} // 動態圖示
                            alt="file-icon"
                            width={20}
                            height={20}
                          />
                        </div>
                        {v.file.name.length > 20
                          ? `${v.file.name.slice(0, 20)}...`
                          : v.file.name}
                      </button>
                      {showStatusRemark && (
                        <FaXmark
                          size={16}
                          className="text-danger"
                          onClick={(e) => {
                            e.preventDefault()
                            handleEditDeleteFile(
                              instrumentData.id,
                              editForm,
                              v.file
                            )
                          }}
                          cursor={'pointer'}
                        ></FaXmark>
                      )}
                    </div>
                  ))}
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editInstrumentName">
                    Instrument Name(儀器名稱)
                  </CFormLabel>
                  <div className="d-flex">
                    <CFormInput
                      id="editInstrumentName"
                      value={editForm.instrument?.instru_name || ''}
                      size="lg"
                    />
                    <CButton
                      color="primary"
                      variant="outline"
                      size="lg"
                      className="ms-2 btn-ph-outline-primary"
                      onClick={() => setShowModal('instrumentName')}
                    >
                      Select
                    </CButton>
                  </div>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editInstrumentSystem">
                    Instrument System(儀器量別)
                  </CFormLabel>
                  <CFormInput
                    id="editInstrumentSystem"
                    value={editForm.instrument?.system || ''}
                    size="lg"
                    readOnly
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editInstrumentSN">
                    Instrument SN(儀器序號)
                  </CFormLabel>
                  <CFormInput
                    id="editInstrumentSN"
                    value={editForm.instru_sn || ''}
                    onChange={setField('instru_sn')}
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editVendor">Vendor(廠牌)</CFormLabel>
                  <CFormInput
                    id="editVendor"
                    value={editForm.vendor || ''}
                    onChange={setField('vendor')}
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editModel">Model(型號)</CFormLabel>
                  <CFormInput
                    id="editModel"
                    value={editForm.model || ''}
                    onChange={setField('model')}
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editCalibrationClass">
                    Calibration Class(校驗類別)
                  </CFormLabel>
                  <CFormSelect
                    id="editCalibrationClass"
                    value={editForm.calibr_class || ''}
                    onChange={setField('calibr_class')}
                    options={classOptions}
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editNCRDescription">
                    NCR Description:
                  </CFormLabel>
                  <CFormInput
                    id="editNCRDescription"
                    value={editForm.ncr_description || ''}
                    onChange={setField('ncr_description')}
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editCalibrationOrg">
                    Calibration Organization(外教單位)
                  </CFormLabel>
                  <div className="d-flex">
                    <CFormInput
                      id="editCalibrationOrg"
                      value={editForm.calibration_org?.name || ''}
                      size="lg"
                      readOnly
                    />
                    <CButton
                      color="primary"
                      variant="outline"
                      size="lg"
                      className="ms-2 btn-ph-outline-primary"
                      onClick={() => setShowModal('instruFactory')}
                      disabled={currentClass !== 'External Calibration'}
                    >
                      Select
                    </CButton>
                  </div>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editCalibrationCycle">
                    Calibration Cycle(校驗週期)
                  </CFormLabel>
                  <CFormSelect
                    id="editCalibrationCycle"
                    value={editForm.calibr_cycle || ''}
                    onChange={setField('calibr_cycle')}
                    options={cycleOptions}
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editDate">Date(入廠日期)</CFormLabel>
                  <span className="text-muted small d-block mb-1">
                    {(instrumentData.date || '').toString().slice(0, 10)}
                  </span>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editOwner">Manager(保管人)</CFormLabel>
                  <div className="d-flex">
                    <CFormInput
                      id="editCalibrationOwner"
                      value={editForm.owner || ''}
                      size="lg"
                      readOnly
                    />
                    <CButton
                      color="primary"
                      variant="outline"
                      size="lg"
                      className="ms-2 btn-ph-outline-primary"
                      onClick={() => setShowModal('user')}
                    >
                      Select
                    </CButton>
                  </div>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editDepartment">
                    Department(保管單位)
                  </CFormLabel>
                  <CFormInput
                    id="editCalibrationDepartment"
                    value={editForm.dept || ''}
                    size="lg"
                    readOnly
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editOversee">
                    Customhouse oversee(是否海關監管)
                  </CFormLabel>
                  <div>
                    <CFormCheck
                      type="radio"
                      inline
                      id="editOverseeYes"
                      name="editOversee"
                      value={true}
                      label="Yes"
                      onChange={() => setBool('oversee', true)}
                      checked={
                        editForm.oversee === true ||
                        (editForm.oversee === undefined &&
                          instrumentData.oversee === true)
                      }
                    />
                    <CFormCheck
                      type="radio"
                      inline
                      id="editOverseeNo"
                      name="editOversee"
                      value={false}
                      label="No"
                      onChange={() => setBool('oversee', false)}
                      checked={
                        editForm.oversee === false ||
                        (editForm.oversee === undefined &&
                          instrumentData.oversee === false)
                      }
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editStandardType">
                    Standard type(是否為標準件)
                  </CFormLabel>
                  <div>
                    <CFormCheck
                      type="radio"
                      inline
                      id="editStandardTypeYes"
                      name="editStandardType"
                      value={true}
                      label="Yes"
                      onChange={() => setBool('standard', true)}
                      checked={
                        editForm.standard === true ||
                        (editForm.standard === undefined &&
                          instrumentData.standard === true)
                      }
                    />

                    <CFormCheck
                      type="radio"
                      inline
                      id="editStandardTypeNo"
                      name="editStandardType"
                      value={false}
                      label="No"
                      onChange={() => setBool('standard', false)}
                      checked={
                        editForm.standard === false ||
                        (editForm.standard === undefined &&
                          instrumentData.standard === false)
                      }
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editCommonInstrument">
                    Is Common Instrument(是否為共用儀器)
                  </CFormLabel>
                  <div>
                    <CFormCheck
                      type="radio"
                      inline
                      id="editCommonInstrumentYes"
                      name="editCommonInstrument"
                      value={true}
                      label="Yes"
                      onChange={() => setBool('is_common', true)}
                      checked={
                        editForm.is_common === true ||
                        (editForm.is_common === undefined &&
                          instrumentData.is_common === true)
                      }
                    />
                    <CFormCheck
                      type="radio"
                      inline
                      id="editCommonInstrumentNo"
                      name="editCommonInstrument"
                      value={false}
                      label="No"
                      onChange={() => setBool('is_common', false)}
                      checked={
                        editForm.is_common === false ||
                        (editForm.is_common === undefined &&
                          instrumentData.is_common === false)
                      }
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editMedicalEquipment">
                    Is Medical Equipment(是否為醫材設備)
                  </CFormLabel>

                  <div>
                    <CFormCheck
                      type="radio"
                      inline
                      id="editMedicalEquipmentYes"
                      name="editMedicalEquipment"
                      value={true}
                      label="Yes"
                      onChange={() => setBool('is_medical_equipment', true)}
                      checked={
                        editForm.is_medical_equipment === true ||
                        (editForm.is_medical_equipment === undefined &&
                          instrumentData.is_medical_equipment === true)
                      }
                    />
                    <CFormCheck
                      type="radio"
                      inline
                      id="editMedicalEquipmentNo"
                      name="editMedicalEquipment"
                      value={false}
                      label="No"
                      onChange={() => setBool('is_medical_equipment', false)}
                      checked={
                        editForm.is_medical_equipment === false ||
                        (editForm.is_medical_equipment === undefined &&
                          instrumentData.is_medical_equipment === false)
                      }
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editDocNo">
                    Document No(操作手冊編號)
                  </CFormLabel>
                  <CFormInput
                    id="editDocNo"
                    value={editForm.doc_no}
                    onChange={setField('doc_no')}
                    size="lg"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel htmlFor="editSubInstruId">
                    Sub Instrument ID(子儀器編號)
                  </CFormLabel>
                  <CFormInput
                    id="editSubInstruId"
                    value={
                      editForm.sub_instru_id ||
                      instrumentData.sub_instru_id ||
                      ''
                    }
                    onChange={setField('sub_instru_id')}
                    size="lg"
                  />
                </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter className="d-flex justify-content-between">
              <CButton
                color="secondary"
                variant="ghost"
                size="lg"
                type="button"
                onClick={() => handleCloseEdit()}
              >
                Cancel
              </CButton>
              <CButton
                color="primary"
                size="lg"
                className="btn-ph-primary"
                type="submit"
              >
                Save
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>
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
      </ClientOnly>
    </>
  )
}
