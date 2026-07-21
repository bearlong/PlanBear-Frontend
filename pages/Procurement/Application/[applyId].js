import React, { useState, useEffect, useRef, useMemo, useContext } from 'react'
import { api } from '@/utils/api'
import Image from 'next/image'
import Link from 'next/link'
import {
  CButton,
  CButtonGroup,
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CContainer,
  CRow,
  CCol,
  CFormCheck,
  CFormSelect,
} from '@coreui/react'
import {
  FaRegCircleCheck,
  FaRegClock,
  FaRegCircleXmark,
  FaCircle,
} from 'react-icons/fa6'
import ApplyFormTitle from '@/components/applyForm/applyFormTitle'
import ApplyFormContent from '@/components/applyForm/applyFormContent'
import AddParts from '@/components/applyForm/addParts'
import styles from '@/styles/signId.module.scss'
import { useRouter } from 'next/router'
import useImportExcerl from '@/hooks/useImportExcerl'
import Swal from 'sweetalert2'
import useCompareInfo from '@/hooks/useCompareInfo'
import { AuthContext } from '@/context/AuthContext'
import ActionButtonGroup from '@/components/applyForm/actionButtonGroup'
import { FadeLoader } from 'react-spinners'
import LoadingOverlay from '@/components/loadingOverlay'
import { logger } from '@/utils/logger'
import useUserPermissions from '@/hooks/useUserPermissions'
import usePermissionGuard from '@/hooks/usePermissionGuard'

export default function SignId() {
  const { hasModuleAccess, canUserDo, handlePermissionGuard } =
    useUserPermissions()

  usePermissionGuard('Procurement')

  const getInputInit = (id) => {
    return {
      id: id,
      Factory: '',
      Vendor: '',
      Brand: '',
      Parts: '',
      Description: '',
      OrderSharerate: '',
      LastPutPrice: '',
      CurrencyOld: 'TWD',
      UnitPrice: '',
      CurrencyNew: 'TWD',
      Rate: '',
      EffectiveDate: '',
      EffectiveRemark: '',
      CostDown: '',
      Moq: '',
      Mpq: '',
      LeadTime: '',
      LME: '',
      QuotaDate: '',
      AnnulmentDate: '',
      ControlQuantity: '',
      VendorQuotationNo: '',
      Buyer: '',
      AttachFile: [],
      IsSpotPrice: '',
      IsUnpaidOrderEffective: '',
      PlaceOfOrigin: [],
      type: id,
      // _cellProps: { id: { scope: 'row' } },
    }
  }
  const { user } = useContext(AuthContext)

  const signFormInit = {
    signRoute: '',
  }

  const { parseExcelFile, downloadForExcel } = useImportExcerl()
  const { getCompareApply, loading, error } = useCompareInfo()
  const fileInputRef = useRef()

  const [sapSourcer, setSapSourcer] = useState([])
  const [isControl, setIsControl] = useState(false)
  const [buyer, setBuyer] = useState([])
  const [items, setItems] = useState([])
  const [itemAP, setItemAP] = useState([getInputInit('AP')])
  const [signInfo, setSignInfo] = useState({
    id: '',
    apply_no: '',
    sign_number: '',
    buyer: {},
    apply_date: '',
    memo: '',
    sap_sourcer: {},
    status: '',
    end_date: '',
  })
  const [comments, setComments] = useState([])
  const [visibleAP, setVisibleAP] = useState(false)
  const [visibleSign, setVisibleSign] = useState(false)
  const [signForm, setSignForm] = useState(signFormInit)
  const [isSubmit, setIsSubmit] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentVersion, setCurrentVersion] = useState(1) // [version]
  const [sortConfigs, setSortConfigs] = useState([
    {
      key: 'id',
      direction: 'asc',
      type: '',
    },
    {
      key: 'CostDown',
      direction: null,
      type: 'number',
    },
  ])
  const router = useRouter()
  const { applyId } = router.query
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

  const statusColor = {
    approved: 'success',
    pending: 'secondary',
    rejected: 'danger',
  }

  const statusLabel = {
    approved: '已同意',
    pending: '待審核',
    rejected: '已退回',
  }

  const statusIcon = {
    approved: (
      <FaRegCircleCheck
        color="light"
        size={12}
        className="me-2 d-none d-md-block"
      />
    ),
    pending: (
      <FaRegClock color="light" size={12} className="me-2 d-none d-md-block" />
    ),
    rejected: (
      <FaRegCircleXmark
        color="light"
        size={12}
        className="me-2 d-none d-md-block"
      />
    ),
  }

  const rate = {
    USD: {
      USD: 1,
      TWD: 32.418,
      RMB: 7.14,
      JPY: 141.65,
      GBP: 0.78,
      HKD: 7.82,
      VND: 23485,
      CNY: 7.14,
      EUR: 0.91,
    },
    TWD: {
      USD: 0.03085,
      TWD: 1,
      RMB: 0.22,
      JPY: 4.37,
      GBP: 0.024,
      HKD: 0.24,
      VND: 725,
      CNY: 0.22,
      EUR: 0.028,
    },
    RMB: {
      USD: 0.14,
      TWD: 4.55,
      RMB: 1,
      JPY: 19.85,
      GBP: 0.11,
      HKD: 1.09,
      VND: 3295,
      CNY: 1,
      EUR: 0.13,
    },
    JPY: {
      USD: 0.007,
      TWD: 0.23,
      RMB: 0.05,
      JPY: 1,
      GBP: 0.0055,
      HKD: 0.055,
      VND: 166,
      CNY: 0.05,
      EUR: 0.0065,
    },
    GBP: {
      USD: 1.28,
      TWD: 41.68,
      RMB: 8.97,
      JPY: 181.6,
      GBP: 1,
      HKD: 9.99,
      VND: 30060,
      CNY: 8.97,
      EUR: 1.17,
    },
    HKD: {
      USD: 0.13,
      TWD: 4.13,
      RMB: 0.91,
      JPY: 18.17,
      GBP: 0.1,
      HKD: 1,
      VND: 3010,
      CNY: 0.91,
      EUR: 0.12,
    },
    VND: {
      USD: 0.000043,
      TWD: 0.00138,
      RMB: 0.0003,
      JPY: 0.006,
      GBP: 0.000033,
      HKD: 0.00033,
      VND: 1,
      CNY: 0.0003,
      EUR: 0.000039,
    },
    CNY: {
      USD: 0.14,
      TWD: 4.55,
      RMB: 1,
      JPY: 19.85,
      GBP: 0.11,
      HKD: 1.09,
      VND: 3295,
      CNY: 1,
      EUR: 0.13,
    },
    EUR: {
      USD: 1.1,
      TWD: 35.74,
      RMB: 7.54,
      JPY: 156.1,
      GBP: 0.85,
      HKD: 8.53,
      VND: 25870,
      CNY: 7.54,
      EUR: 1,
    },
  }

  const handleEdit = (id) => {
    logger.info(`Edit row: id=${id}`, `applyId${applyId}`)
    const targetItem = items.find((item) => item.id === id)
    const newItem = { ...targetItem, editAgain: id }
    setItemAP([{ ...newItem, id: 'AP' }])
    setVisibleAP(true)
  }

  const handleCheckEmpty = (id = '') => {
    const errors = validateItems(itemAP)
    if (errors.length > 0) {
      Swal.fire({
        customClass: 'h3',
        title: 'Validation Failed',
        html: errors
          .map(
            (e) =>
              ` ${e.field} ${
                e.reason === 'required' ? 'is required' : 'has invalid format'
              }`
          )
          .join('<br>'),
        icon: 'error',
      })
      return false
    }

    return true
  }

  const isEmpty = (value) =>
    value === '' || value === null || value === undefined

  const isInvalid = (value, rule) => {
    if (rule.type === 'number') return isNaN(Number(value))
    if (rule.type === 'array') {
      return !Array.isArray(value) || value.length < (rule.minLength || 1)
    }
    return false
  }

  const FIELD_RULES = {
    Factory: { required: true },
    Vendor: { required: true },
    Brand: { required: true },
    Parts: { required: true },
    Description: { required: true },
    OrderSharerate: { required: true, type: 'number' },
    LastPutPrice: { required: true, type: 'number' },
    CurrencyOld: { required: true },
    UnitPrice: { required: true, type: 'number' },
    CurrencyNew: { required: true },
    Rate: { required: true, type: 'number' },
    EffectiveDate: { required: true },
    EffectiveRemark: { required: false },
    CostDown: { required: true, type: 'number' },
    Moq: { required: true, type: 'number' },
    Mpq: { required: true, type: 'number' },
    LeadTime: { required: true, type: 'number' },
    LME: { required: false, type: 'number' },
    QuotaDate: { required: true },
    AnnulmentDate: { required: false },
    ControlQuantity: { required: false },
    VendorQuotationNo: { required: false },
    Buyer: { required: true },
    AttachFile: { required: false },
    IsSpotPrice: { required: false },
    IsUnpaidOrderEffective: { required: false },
    PlaceOfOrigin: { required: true, type: 'array', minLength: 1 },
  }

  const validateItems = (items) => {
    const errors = []

    items.forEach((item, i) => {
      for (const [key, rule] of Object.entries(FIELD_RULES)) {
        const value = item[key]

        if (rule.required && isEmpty(value)) {
          errors.push({ row: i, field: key, reason: 'required' })
          continue
        }

        if (!isEmpty(value) && rule.type && isInvalid(value, rule)) {
          errors.push({ row: i, field: key, reason: 'invalid-type' })
        }
      }
    })

    return errors
  }

  const handleAddPARTS = () => {
    if (handleCheckEmpty('AP')) {
      const rowId = itemAP[0].editAgain ? itemAP[0].editAgain : items.length + 1
      const newItemAP = { ...itemAP[0], id: rowId }
      const existingSameItem = items.findIndex(
        (item) =>
          item.Factory.code === itemAP[0].Factory.code &&
          item.Parts === itemAP[0].Parts &&
          item.Vendor.code === itemAP[0].Vendor.code &&
          item.Brand.code === itemAP[0].Brand.code &&
          item.id !== rowId
      )

      if (
        Number(itemAP[0].OrderSharerate) > 100 ||
        Number(itemAP[0].OrderSharerate) < 0
      ) {
        Swal.fire({
          customClass: 'h5',
          title: 'Errors',
          html: 'Order Share Rate must be between 0 and 100.',
          icon: 'error',
        })
        return
      }

      const eff = new Date(itemAP[0].EffectiveDate)
      const ann = new Date(itemAP[0].AnnulmentDate)
      if (eff > ann) {
        Swal.fire({
          customClass: 'h5',
          title: 'Errors',
          html: 'Effective Date cannot be later than Annulment Date.',
          icon: 'error',
        })
        return
      }

      if (existingSameItem !== -1) {
        Swal.fire({
          customClass: 'h5',
          title: 'Errors',
          html: 'Same item saved, please edit the existing item.',
          icon: 'error',
        })
        return
      }
      // 判斷是否已存在相同的 id
      const existingIndex = items.findIndex((item) => item.id === rowId)
      let updatedItems
      if (existingIndex !== -1) {
        // 如果存在，則更新該項目
        updatedItems = items.map((item, index) =>
          index === existingIndex ? newItemAP : item
        )
      } else {
        // 如果不存在，則新增新項目
        updatedItems = [...items, newItemAP]
      }
      setItems(updatedItems)
      handleCloseModalAP()
    }
  }

  const handleConfirmDeleteRow = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteRow(id)
        Swal.fire({
          title: 'Deleted!',
          text: 'Your file has been deleted.',
          icon: 'success',
        })
      }
    })
  }

  const handleCloseModalAP = () => {
    setVisibleAP(false)
    setItemAP([getInputInit('AP')])
  }

  const handleDeleteRow = (id) => {
    const targetItem = items.find((item) => item.id === id)
    if (!targetItem) return
    if (targetItem.AttachFile && targetItem.AttachFile.length > 0) {
      targetItem.AttachFile.forEach((item) => {
        URL.revokeObjectURL(item.preview)
      })
    }
    const newItems = items.filter((item) => item.id !== id)

    setItems(newItems)
    handleCloseModalAP()
  }

  const calculateCostDown = (lastPutPrice, unitPrice, exchangeRate) => {
    if (lastPutPrice === 0) return 0
    return (
      ((lastPutPrice * exchangeRate - unitPrice) /
        (lastPutPrice * exchangeRate)) *
      100
    ).toFixed(2)
  }

  const processRowData = (row) => {
    const exchangeRate = rate[row.CurrencyOld]?.[row.CurrencyNew] || '0'
    const costDownRate = calculateCostDown(
      Number(row.LastPutPrice),
      Number(row.UnitPrice),
      exchangeRate
    )

    return {
      ...row,
      id: items.length + row.id,
      Rate: exchangeRate,
      CostDown: costDownRate === 0 ? '0' : parseFloat(costDownRate).toFixed(2),
    }
  }

  const handleExcelReading = async (e) => {
    const username = signInfo.sap_sourcer?.username || signInfo.buyer?.username
    setIsLoading(true)
    try {
      const data = await handleExcelUpload(e, username) // 等待結果
      if (!data) return
      const updatedData = data.map(processRowData)
      const duplicates = updatedData.filter((newItem) =>
        items.some(
          (item) =>
            item.id !== newItem.id &&
            item.Factory.code === newItem.Factory.code &&
            item.Parts === newItem.Parts &&
            item.Vendor.code === newItem.Vendor.code &&
            item.Brand.code === newItem.Brand.code
        )
      )

      if (duplicates.length > 0) {
        Swal.fire({
          customClass: 'h5',
          title: 'Duplicate Items Detected',
          icon: 'warning',
          html: `There are ${duplicates.length} duplicated rows.<br />Please check before continue.`,
        })
        return
      }

      const newDate = [...items, ...updatedData]
      setItems(newDate)
    } catch (error) {
      console.error('Error reading Excel file:', error)
      setIsLoading(false)
    }
  }

  const handleExcelUpload = async (event, username) => {
    const file = event.target.files[0]

    try {
      const url = api(`/data/import-excel?buyer=${username}`)
      logger.info(`import excel : ${url}`, `applyId：${applyId}`)
      const method = 'POST'
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formData,
      })
      const result = await response.json()
      if (response.ok) {
        logger.info(`${url} API success`, `applyId：${applyId}`)
      } else {
        logger.warn(
          ` ${url} API failed with status ${response.status}`,
          `applyId：${applyId}`
        )
        // throw new Error(`Failed to fetch ${url}`)
      }
      if (result.status === 'success') {
        setIsLoading(false)
        return result.data
      } else {
        setIsLoading(false)
        Swal.fire({
          customClass: 'h5',
          title: 'Errors found in the following rows:',
          html: result.message,
          icon: 'error',
        })
      }
    } catch (error) {
      setIsLoading(false)
      Swal.fire({
        customClass: 'h5',
        title: 'Errors found in the following rows:',
        html: error.message,
        icon: 'error',
      })
      logger.error(
        'import excel request exception',
        `applyId：${applyId}`,
        error
      )
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const createDraftForm = async (formData) => {
    const url = api(`/compare-data/copy?buyer=${user.username}`)
    logger.info(`copy form : ${url}`, `applyId：${applyId}`)
    const method = 'POST'
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData }),
        credentials: 'include',
      })
      const result = await response.json()

      if (response.ok) {
        logger.info('copy form API success', `applyId：${applyId}`)
      } else {
        logger.warn(
          `copy form API failed with status ${response.status}`,
          `applyId：${applyId}`
        )
        throw new Error('Failed to fetch copy form')
      }

      if (result.status === 'success') {
        return result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      logger.error('copy form request exception', `applyId：${applyId}`, err)
      console.log(err.message)
      Swal.fire('Error', err.message, 'error')
    }
  }

  const handleCopyForm = async () => {
    const result = await Swal.fire({
      customClass: 'h5',
      title: 'Are you sure you want to copy this form?',
      text: 'Yse→OK No→Exit',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    })
    if (result.isConfirmed) {
      const title = {
        buyer: user.username,
        sap_sourcer: signInfo.sap_sourcer,
        sap_sourcer_username: signInfo.sap_sourcer,
        memo: signInfo.memo,
      }
      const formData = {
        title,
        items: items,
      }

      try {
        const draftNo = await createDraftForm(formData) // 假設返回  { newFormId: "2024120008" }
        if (draftNo) {
          Swal.fire({
            position: 'center',
            customClass: 'h5',
            icon: 'success',
            title: `Successfully copied! <br/> The new draft number is: ${draftNo} <br/>`,
            showConfirmButton: false,
            timer: 2000,
          })
          setTimeout(() => {
            router.push(`/Procurement/Application/edit/${draftNo}`)
          }, 2000)
        }
      } catch (error) {
        Swal.fire({
          customClass: 'h5',
          title: '拷貝失敗',
          text: '請稍後再試',
          icon: 'error',
        })
      }
    }
  }

  function getNextSortConfigs(prevConfigs, key, type) {
    if (key === 'id') {
      return [
        {
          key: 'id',
          direction: null,
          type: 'number',
        },
        {
          key: 'CostDown',
          direction: null,
          type: 'number',
        },
      ]
    }

    const existIndex = prevConfigs.findIndex((cfg) => cfg.key === key)

    if (existIndex !== -1) {
      const newConfigs = [...prevConfigs]
      const currentDirection = newConfigs[existIndex].direction

      let nextDirection
      if (key === 'CostDown') {
        if (currentDirection === 'asc') nextDirection = 'desc'
        else if (currentDirection === 'desc') nextDirection = null
        else nextDirection = 'asc'
      } else {
        nextDirection = currentDirection === 'asc' ? 'desc' : 'asc'
      }

      newConfigs[existIndex] = {
        ...newConfigs[existIndex],
        direction: nextDirection,
      }

      return newConfigs
    } else {
      return [{ key, direction: 'asc', type }, sortConfigs[1]]
    }
  }

  const handleSort = (key, type) => {
    logger.info(`sort by key=${key} type=${type}`, `applyId：${applyId}`)
    setSortConfigs((prevConfigs) => getNextSortConfigs(prevConfigs, key, type))
  }

  const handleDownloadExcel = () => {
    const title = [
      'Application No.',
      'Buyer',
      'SAP Sourcer',
      'Memo',
      'Apply Date',
      'End Date',
    ]
    const signInfoData = [
      signInfo.apply_no,
      `${signInfo.buyer.name} / (${signInfo.buyer.username})`,
      signInfo.sap_sourcer
        ? `${signInfo.sap_sourcer.name} / ${signInfo.sap_sourcer.username} / (${signInfo.sap_sourcer.code})`
        : '',
      signInfo.memo ? signInfo.memo : '',
      signInfo.apply_date,
      signInfo.end_date,
    ]
    // 定義欄位名稱的標題
    const headers = [
      'id',
      'Factory',
      'Vendor',
      'Brand',
      'Parts',
      'Description',
      'Order Sharerate (%)',
      'Last Put Price',
      'Currency',
      'Unit Price',
      'Currency',
      'Rate',
      'Effective Date (yyyy/mm/dd)',
      'Effective Remark',
      'Moq',
      'Mpq',
      'LeadTime',
      'LME(Copper)',
      'Quota Date(配額生效日)',
      'Annulment Date(單價失效日)',
      'Control Quantity(管控數量)',
      'Vendor Quotation No.',
      'Buyer',
      'Attach File',
      'Is it the spot price?(是否為現貨價?)',
      'Is it the Unpaid order Will take effect?(是否要未交訂單即生效?)',
      'place of origin(原產地)',
    ]

    // 組織表格資料的內容
    const data = items.map((item) => {
      const placeOfOriginString = item.PlaceOfOrigin.join(', ')

      return [
        item.id.toString(),
        item.Factory.display,
        item.Vendor.display,
        item.Brand.display,
        item.Parts,
        item.Description,
        item.OrderSharerate,
        item.LastPutPrice,
        item.CurrencyOld,
        item.UnitPrice,
        item.CurrencyNew,
        item.Rate,
        item.EffectiveDate,
        item.EffectiveRemark,
        item.Moq,
        item.Mpq,
        item.LeadTime,
        item.LME,
        item.QuotaDate,
        item.AnnulmentDate,
        item.ControlQuantity,
        item.VendorQuotationNo,
        item.Buyer.name,
        item.AttachFile,
        item.IsSpotPrice,
        item.IsUnpaidOrderEffective,
        placeOfOriginString,
      ]
    })

    // 將標題與資料合併，形成完整的資料表
    const finalData = [title, signInfoData, [], headers, ...data]

    // 呼叫下載函式
    downloadForExcel(finalData, `Compare_Price_${signInfo.apply_no}.xlsx`)
  }

  const handleDeleteRows = async (selectIds) => {
    if (!Array.isArray(selectIds) || selectIds.length === 0) {
      await Swal.fire({
        customClass: 'h5',
        title: 'Errors',
        html: 'Please select at least one item to delete.',
        icon: 'error',
      })
      return
    }

    const { isConfirmed } = await Swal.fire({
      customClass: 'h3',
      title: `Are you sure to delete [${selectIds.join(', ')}] items?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    })

    if (!isConfirmed) return
    logger.info(`Deleting rows: ${selectIds.join(', ')}`, `applyId：${applyId}`)
    const newItems = items
      .filter((item) => !selectIds.includes(item.id))
      .map((item, index) => ({
        ...item,
        id: index + 1, // 重新排成 1, 2, 3, ...
      }))
    setItems(newItems)
    await Swal.fire({
      position: 'center',
      customClass: 'h5',
      icon: 'success',
      title: `Successfully deleted! ${selectIds.length} items.`,
      showConfirmButton: false,
      timer: 2000,
    })
  }

  const handledestroyForm = async () => {
    const confirmed = await Swal.fire({
      customClass: 'h3',
      title: 'Are you sure to destroy this form?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, destroy it!',
      cancelButtonText: 'Cancel',
    })

    if (!confirmed.isConfirmed) return
    const applyNoWithVersion = `${signInfo.apply_no}_V${currentVersion}`
    const url = api(`/compare-apply/${applyNoWithVersion}/status`)
    logger.info(`destroy form : ${url}`, `applyId：${applyId}`)
    const method = 'PUT'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'destroy',
          commentJson: `[{"displayName":"${user.name}","username":"${user.username}"}]`, // 如需備註記錄
        }),
      })
      const result = await response.json()

      if (response.ok) {
        logger.info('destroy form API success', `applyId：${applyId}`)
      } else {
        logger.warn(
          `destroy form API failed with status ${response.status}`,
          `applyId：${applyId}`
        )
        throw new Error('Failed to fetch destroy form')
      }

      if (result.status === 'success') {
        Swal.fire('Destroyed!', result.message, 'success')
        // ?臬??????”
        router.push('/Procurement/Application/query')
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      logger.error('destroy form request exception', `applyId：${applyId}`, err)
      Swal.fire('Error', err.message, 'error')
    }
  }

  const handleMockSignAction = async (action) => {
    const isReject = action === 'reject'
    const actionText = isReject ? 'Reject' : 'Approve'
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `Mock ${actionText}`,
      input: 'textarea',
      inputLabel: isReject ? 'Reason (required)' : 'Reason',
      inputPlaceholder: 'Please enter a reason',
      inputAttributes: {
        'aria-label': 'Please enter a reason',
      },
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'h3',
        title: isReject ? 'h3 text-danger' : 'h3',
      },
      preConfirm: (value) => {
        if (isReject && !value.trim()) {
          Swal.showValidationMessage('Reject reason is required')
          return false
        }
        return value
      },
    })

    if (!isConfirmed) return

    const version = signInfo.version || currentVersion || 1
    const applyNoWithVersion = `${signInfo.apply_no}_V${version}`
    const url = api(`/compare-apply/${applyNoWithVersion}/status`)
    const now = new Date().toISOString()
    console.log(user)
    const mockComment = {
      desp: `Mock ${user?.role}`,
      department: Array.isArray(user?.factory)
        ? user.factory[0] || ''
        : user?.factory || '',
      mainJob: Array.isArray(user?.role)
        ? user.role[0] || ''
        : user?.role || 'Mock',
      displayName: user?.name || user?.username || 'Mock User',
      username: user?.username || 'mock',
      timestamp: now,
      status: isReject ? '0' : '1',
      comment: reason || '',
    }
    const commentJson = JSON.stringify([...(comments || []), mockComment])

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: isReject ? 'reject' : 'close',
          commentJson,
        }),
      })
      const result = await response.json()

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || `Mock ${actionText} failed`)
      }

      await Swal.fire({
        position: 'center',
        icon: 'success',
        title: `Mock ${actionText} successful!`,
        customClass: 'h3',
        showConfirmButton: false,
        timer: 1200,
      })
      router.reload()
    } catch (err) {
      logger.error(
        `mock ${action} request exception`,
        `applyId：${applyId}`,
        err
      )
      Swal.fire('Error', err.message, 'error')
    }
  }

  const handleDownloadSample = () => {
    const link = document.createElement('a')
    link.href = '/Procurement/import_Compare_Price_sample.xlsx'
    link.download = 'import_Compare_Price_sample.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getSapSourcer = async () => {
    const url = api('/sap-sourcer')
    logger.info(`Fetching sap-sourcer : ${url}`, `applyId：${applyId}`)
    const method = 'GET'
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      const result = await response.json()
      if (response.ok) {
        logger.info('sap-sourcer API success', `applyId：${applyId}`)
      } else {
        logger.warn(
          `sap-sourcer API failed with status ${response.status}`,
          `applyId：${applyId}`
        )
        throw new Error('Failed to fetch sap-sourcer')
      }
      return result
    } catch (err) {
      console.log(err)
    }
  }

  const getBuyer = async () => {
    const url = api('/buyers')
    logger.info(`Fetching buyer : ${url}`, `applyId：${applyId}`)
    const method = 'GET'
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      const result = await response.json()
      if (response.ok) {
        logger.info('buyer API success', `applyId：${applyId}`)
      } else {
        logger.warn(
          `buyer API failed with status ${response.status}`,
          `applyId：${applyId}`
        )
        throw new Error('Failed to fetch buyer')
      }
      return result
    } catch (err) {
      console.log(err)
    }
  }

  const handleSelectSignForm = (id, value) => {
    logger.info(`Selected sign form: ${id} = ${value}`, `applyId：${applyId}`)
    const newSignForm = {
      ...signForm, // 保留 signForm 的其他屬性
      [id]: value, // 更新指定的屬性
    }
    setSignForm(newSignForm)
  }

  const handleOpenSendForm = () => {
    logger.info('Open send form', `applyId：${applyId}`)
    if (items.length > 0) {
      setVisibleSign(true)
    } else {
      logger.warn('No items found', `applyId：${applyId}`)
      Swal.fire({
        title: 'Warning',
        text: 'Please add items first.',
        icon: 'warning',
        confirmButtonText: 'Okay',
        customClass: {
          popup: 'h3',
          title: 'h3 text-danger',
        },
      })
    }
  }

  const isSignFormIncomplete = () => {
    return Object.values(signForm).some((value) => value === '') // 檢查其餘屬性是否為空
  }

  const getProcessOptions = () => {
    return [
      {
        label: 'Open this select menu',
        value: '', // 預設選項的空值
      },
      {
        label: 'Materials(一般料)',
        value: 'A',
      },
      {
        label: 'Supplies(耗材)',
        value: 'B',
      },
    ]
  }

  const checkNumeric = (value) => {
    const numValue = Number(value)
    return !isNaN(numValue) && numValue !== null && value !== undefined
  }

  const validateItem = (item, keys) => {
    const checkResults = keys.reduce((acc, key) => {
      acc[key] = checkNumeric(item[key]) // 檢查每一個 key 是否為有效數字
      return acc
    }, {})

    return checkResults
  }

  const handleResend = async () => {
    logger.info('Resend form', `applyId：${applyId}`)
    setIsSubmit(true)
    const warningTexts = []
    if (isSignFormIncomplete()) {
      logger.warn('sign form is incomplete', `applyId：${applyId}`)
      Swal.fire({
        title: 'Warning',
        text: 'Please fill out all required fields.',
        icon: 'warning',
        confirmButtonText: 'Okay',
        customClass: {
          popup: 'h3',
          title: 'h3 text-danger',
        },
      })
      setIsSubmit(false)
      return
    }

    const keysToCheck = [
      'ControlQuantity',
      'CostDown',
      'Moq',
      'Mpq',
      'OrderSharerate',
      'LeadTime',
      'LastPutPrice',
      'UnitPrice',
      'LME',
    ]

    if (signInfo.buyer && Object.keys(signInfo.buyer).length <= 0) {
      warningTexts.push('Buyer is required.')
    }

    const checkedItems = items.map((item, index) => {
      const checkResults = validateItem(item, keysToCheck)
      return {
        ...item,
        checkResults,
        index: index + 1,
      }
    })

    checkedItems.forEach((item) => {
      const invalidKeys = Object.keys(item.checkResults).filter(
        (key) => !item.checkResults[key]
      )

      if (invalidKeys.length > 0) {
        logger.warn(
          `Item ${item.index} has invalid keys: ${invalidKeys.join(', ')}`,
          `applyId：${applyId}`
        )
        invalidKeys.forEach((key) => {
          warningTexts.push(
            `Item ${item.index}: ${key} is non-numeric. Please check the data.`
          )
        })
      }
    })

    if (warningTexts.length > 0) {
      Swal.fire({
        title: 'Warning',
        text: warningTexts.join('\n'),
        icon: 'warning',
        confirmButtonText: 'Okay',
        customClass: {
          popup: 'h3',
          title: 'h3 text-danger',
        },
      })
      setIsSubmit(false)
      return
    }

    const isValid = !items.some((item) => Number(item.CostDown) < 0)

    const sign_route = isValid
      ? signForm.signRoute
      : signForm.signRoute === 'A'
      ? 'C'
      : 'D'

    const newItemApply = {
      ...signInfo,
      buyer: signInfo.buyer.username,
      sap_sourcer: signInfo.sap_sourcer?.code,
      sap_sourcer_username: signInfo.sap_sourcer?.username,
      sap_sourcer_name: signInfo.sap_sourcer?.name,
      memo: signInfo.memo,
      sign_route: sign_route,
    }
    console.log('newItemApply', newItemApply, signInfo.sap_sourcer)
    const newItems = items.map((item) => {
      return {
        ...item,
        Factory: item.Factory.code,
        FactoryDisplay: `${item.Factory.display}`,
        Vendor: item.Vendor.code,
        VendorDisplay: item.Vendor.display,
        Brand: item.Brand.code,
        BrandDisplay: item.Brand.display,
        Buyer: item.Buyer.username,
        BuyerUsername: item.Buyer.username,
        PlaceOfOrigin: JSON.stringify(item.PlaceOfOrigin),
        AttachFile: item.AttachFile || [],
      }
    })
    const sendForm = {
      signInfo: signForm,
      data: newItems,
      title: newItemApply,
    }
    const formData = new FormData()
    Object.keys(sendForm.signInfo).forEach((key) => {
      formData.append(`signInfo[${key}]`, sendForm.signInfo[key])
    })

    sendForm.data.forEach((item, index) => {
      // 這裡使用 [index] 作為陣列索引來確保數據正確
      Object.keys(item).forEach((key) => {
        if (key === 'AttachFile' && Array.isArray(item[key])) {
          item[key].forEach((fileWrapper, fileIndex) => {
            const file = fileWrapper.file
            if (file instanceof File) {
              // ✅ 真正的檔案
              formData.append(`data[${index}][AttachFile][${fileIndex}]`, file)
            } else if (file?.name) {
              // ✅ 只有檔名的舊資料
              formData.append(
                `data[${index}][AttachFileName][${fileIndex}]`,
                file.name
              )
            }
          })
        } else {
          // 其他欄位處理
          const value = item[key]
          const isNullish =
            value === null ||
            value === undefined ||
            (typeof value === 'string' &&
              (value === 'null' || value === 'undefined'))

          formData.append(`data[${index}][${key}]`, isNullish ? '' : value)
        }
      })
    })
    Object.keys(sendForm.title).forEach((key) => {
      if (sendForm.title[key]) {
        formData.append(`title[${key}]`, sendForm.title[key])
      }
    })
    const newVersion = signInfo.version + 1
    const url = api(`/compare-apply/${signInfo.apply_no}/${newVersion}`)
    logger.info(`Fetching signInfo version : ${url}`, `applyId：${applyId}`)
    const method = 'POST'
    try {
      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: formData,
      })
      const result = await response.json()

      if (response.ok) {
        logger.info(`${url} API success`, `applyId：${applyId}`)
      } else {
        logger.warn(
          ` ${url} API failed with status ${response.status}`,
          `applyId：${applyId}`
        )
        throw new Error(`Failed to fetch ${url}`)
      }
      if (result.status === 'success') {
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Your form has been applied successfully',
          customClass: 'h3',
          showConfirmButton: false,
          timer: 1500,
        })
        setTimeout(() => {
          if (!isMockMode) {
            window.open(result.formUrl, '_blank')
          }
          setTimeout(() => {
            router.reload()
          }, 200) // 稍微延遲刷新，體驗更順
        }, 1500)

        setVisibleSign(false)
        setIsSubmit(false)
        return
      } else {
        Swal.fire({
          title: 'Error',
          text:
            result.message || 'An error occurred while submitting the form.',
          icon: 'error',
          confirmButtonText: 'Okay',
          customClass: {
            popup: 'h3',
            title: 'h3 text-danger',
          },
        })
        setIsSubmit(false)
        logger.error('Error submitting form', `applyId：${applyId}`, null)
      }
    } catch (err) {
      logger.error(`${url} request exception`, `applyId：${applyId}`, err)
    }
  }

  const map = {
    Sign: { label: 'Signing', color: 'bg-success' },
    close: { label: 'close', color: 'bg-secondary' },
    reject: { label: 'reject', color: 'bg-danger' },
    resend: { label: 'resend', color: 'bg-primary' },
    destroy: { label: 'destroy', color: 'bg-warning' },
  }

  const sortedItems = useMemo(() => {
    if (!sortConfigs.length) return items

    return [...items].sort((a, b) => {
      for (const config of sortConfigs) {
        const { key, direction, type } = config
        if (direction === null) continue
        const valueA = a[key]?.display || a[key]
        const valueB = b[key]?.display || b[key]

        let comparison = 0

        if (type === 'number') {
          comparison = Number(valueA) - Number(valueB)
        } else if (type === 'date') {
          comparison = new Date(valueA) - new Date(valueB)
        } else if (type === 'text') {
          comparison = String(valueA).localeCompare(String(valueB))
        }

        if (comparison !== 0) {
          return direction === 'asc' ? comparison : -comparison
        }
        // 如果比較結果是0，繼續比下一個 key
      }

      return 0
    })
  }, [items, sortConfigs])

  const handleChangeVersion = async (apply_no, version) => {
    try {
      const dataDB = await getCompareApply(apply_no, '', version) // 取得資料
      if (error) return <p>Error: {error.message}</p>
      if (!loading) {
        if (dataDB.error) {
          console.error('Error fetching data:', dataDB.error.message)
          return
        }
        const newItems = dataDB.data.compare_apply.map((item, i) => {
          return {
            ...item,
            Rate: rate[item.CurrencyOld]?.[item.CurrencyNew] || 0,
            PlaceOfOrigin: JSON.parse(item.PlaceOfOrigin),
          }
        })
        // 如果資料加載成功，更新狀態
        setItems(newItems)
        setSignInfo(dataDB.data.compare_data)
        if (dataDB.data.comments.length > 0) {
          setComments(dataDB.data.comments)
        } else {
          setComments([])
        }
      }
    } catch (error) {
      console.error('Error fetching sapSourcer:', error)
    }
  }

  const versionList = useMemo(
    () => Array.from({ length: currentVersion }, (_, i) => currentVersion - i),
    [currentVersion]
  )

  const canEditRejectedForm =
    signInfo.status === 'reject' &&
    signInfo.version === Math.max(...versionList) &&
    (isMockMode || user?.username === signInfo.buyer.username)

  useEffect(() => {
    const isMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

    if (!router.isReady) return
    if (!user) return

    const fetchData = async () => {
      logger.info('Enter Compare Apply Page', `applyId：${applyId}`)
      try {
        const dataDB = await getCompareApply(applyId)
        const deptSet = new Set(user.dept || [])
        const roleSet = new Set(user.role || [])

        let company = 'UNKNOWN'
        if (roleSet.has('admin')) {
          company = 'ADMIN'
        } else if (deptSet.has('E000E')) {
          company = 'PHE(W)'
        } else if (deptSet.has('3007')) {
          company = 'PHSY'
        } else if (deptSet.has('PHIHONG')) {
          company = 'PHIHONG'
        } else if (deptSet.has('ZEROVA')) {
          company = 'ZEROVA'
        }
        // 判斷資料是否錯誤
        if (dataDB.error) {
          console.error('Error fetching data:', dataDB.error.message)
          return
        }
        console.log(dataDB)

        if (
          company !== dataDB.data.compare_data.company_code &&
          company !== 'ADMIN' &&
          !isMock
        ) {
          logger.error('Access Denied', `applyId：${applyId}`)
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: 'Access Denied',
            showConfirmButton: false,
            timer: 1500,
            customClass: 'h5',
          }).then(() => {
            router.push('/Procurement/Application/query')
          })
          return
        }

        if (
          dataDB.data.compare_data.buyer.username === user.username ||
          isMock
        ) {
          setIsControl(true)
        }
        // 處理主要資料
        const newItems = dataDB.data.compare_apply.map((item) => ({
          ...item,
          Rate: rate[item.CurrencyOld]?.[item.CurrencyNew] || 0,
          PlaceOfOrigin: JSON.parse(item.PlaceOfOrigin),
        }))
        setItems(newItems)
        console.log('Fetched items:', newItems)
        setSignInfo(dataDB.data.compare_data)
        setCurrentVersion(dataDB.data.compare_data.version)

        if (dataDB.data.comments.length > 0) {
          setComments(dataDB.data.comments)
        }

        const newSapSourcer = await getSapSourcer()
        if (newSapSourcer.status === 'success') {
          setSapSourcer(newSapSourcer.data)
        }

        const newBuyer = await getBuyer()
        if (newBuyer.status === 'success') {
          setBuyer(newBuyer.data)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [router.isReady, user])

  return (
    <>
      {loading ? (
        <main className="pb-3"></main>
      ) : (
        <main className="pb-3 print-area">
          {isLoading && <LoadingOverlay text="甇??臬 Excel 鞈?..." />}
          <div
            className={`px-4 pt-3 container d-flex justify-content-center mb-3`}
          >
            <div className="d-inline-block text-center">
              <h1
                className={`display-4 fw-bold text-center primary center-flex mb-3`}
              >
                <Image
                  className="me-2 "
                  src="/img/logo.png"
                  width={30}
                  height={30}
                  alt="logo"
                />
                Request for Quotation - View Check
              </h1>
              <div className="h3 fw-bold text-end mb-3">
                {`Date：${signInfo.apply_date}`}
              </div>
              <div className="d-flex justify-content-end align-items-center gap-2 mb-3">
                <div
                  className={`d-flex gap-3 ${
                    currentVersion > 1 ? '' : 'd-none'
                  }`}
                >
                  <span className="fs-4 fw-semibold">Version:</span>
                  <div className="d-flex gap-2">
                    {versionList
                      .sort((a, b) => Number(b.version) - Number(a.version)) // V3 V2 V1
                      .map((v, i) => (
                        <CButton
                          key={i}
                          onClick={() => {
                            handleChangeVersion(signInfo.apply_no, v)
                          }}
                          className={`btn-ph-outline-primary ${
                            v === signInfo.version ? 'active' : ''
                          }`}
                          title={v === Math.max(...versionList) ? 'Latest' : ''}
                        >
                          V{v}{' '}
                          <span className="fw-bold">
                            {v === Math.max(...versionList) ? 'New' : ''}
                          </span>
                        </CButton>
                      ))}
                  </div>
                </div>
                <span
                  className={`${map[signInfo.status]?.color} ${
                    styles['status-dot']
                  }`}
                ></span>
                <span className="fs-4 fw-semibold text-dark">
                  {map[signInfo.status]?.label}
                </span>
              </div>
              <ApplyFormTitle
                applyForm={signInfo}
                sapSourcer={sapSourcer}
                isEdit={canEditRejectedForm}
                setItemApply={setSignInfo}
              />
            </div>
          </div>
          {canEditRejectedForm && (
            <div className="container mb-5  pt-5">
              <CButtonGroup
                className=" mx-5"
                role="group"
                aria-label="Basic example"
                size="lg"
              >
                <CButton
                  color="secondary"
                  onClick={() => {
                    setVisibleAP(true)
                  }}
                >
                  <span className="p fw-normal">ADD PARTs</span>
                </CButton>

                <CButton
                  color="secondary"
                  onClick={() => {
                    fileInputRef.current.click()
                  }}
                >
                  <span className="p fw-normal">IMPORT EXCEL</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="d-none"
                    onChange={(e) => {
                      handleExcelReading(e)
                      e.target.value = ''
                    }}
                  />
                </CButton>
              </CButtonGroup>
              <CButton onClick={handleDownloadSample} color="link" size="lg">
                <span className="p fw-normal">excel sample</span>
              </CButton>
            </div>
          )}
          <ApplyFormContent
            className=""
            items={sortedItems}
            handleEdit={canEditRejectedForm ? handleEdit : ''}
            handleSort={handleSort}
            sortConfigs={sortConfigs}
            onDeleteItems={canEditRejectedForm ? handleDeleteRows : ''}
          />
          {comments.length > 0 && (
            <div
              className={`bg-light my-3 border border-2 border-secondary rounded-top-4 ${styles.approvalComments}`}
            >
              <div className={`h3 fw-bold p-3 m-0 ${styles.approvalTitle}`}>
                各站簽核意見
              </div>

              <CAccordion flush>
                {comments.map((comment, index) => {
                  const statusKey =
                    comment.status === '1'
                      ? 'approved'
                      : comment.status === '0'
                      ? 'rejected'
                      : 'pending'
                  return (
                    <CAccordionItem key={index} itemKey={index + 1}>
                      <CAccordionHeader>
                        <div className="d-flex pe-3 w-100 justify-content-between">
                          <div className="d-flex flex-column">
                            <div className="h4 fw-bold m-0 me-3">
                              {comment.desp}
                            </div>
                            <div className="d-flex">
                              <div className="h5 fw-bold m-0 center-flex text-secondary">
                                (
                                {`${comment.department}/${comment.mainJob} ${comment.displayName}`}
                                )
                              </div>
                            </div>
                          </div>
                          <div className="d-flex flex-column">
                            <div className="h6 fw-bold m-0 text-secondary center-flex justify-content-end text-end">
                              {comment.timestamp.split('T')[0]}{' '}
                              {comment.timestamp.split('T')[1]}
                            </div>
                            <div className="center-flex d-flex d-md-none justify-content-end">
                              <FaCircle
                                size={14}
                                className={`text-${statusColor[statusKey]}`}
                              />
                            </div>
                            <div className="d-flex justify-content-end h6">
                              <CBadge
                                color={statusColor[statusKey]}
                                className="d-none d-md-flex center-flex"
                                shape="rounded-pill"
                              >
                                {statusIcon[statusKey]}
                                <p className="m-0 h6">
                                  {statusLabel[statusKey]}
                                </p>
                              </CBadge>
                            </div>
                          </div>
                        </div>
                      </CAccordionHeader>
                      <CAccordionBody>
                        {comment.comment.trim() === '' ? (
                          <p>No comment</p>
                        ) : (
                          comment.comment.split('\r\n').map((line, index) => (
                            <p key={index} className="m-0">
                              {line.trim() ? line : <br key={index} />}
                            </p>
                          ))
                        )}
                      </CAccordionBody>
                    </CAccordionItem>
                  )
                })}
              </CAccordion>
            </div>
          )}
          <ActionButtonGroup
            signInfo={signInfo || ''}
            versionList={versionList}
            onPrint={handlePrint}
            onCopyForm={handleCopyForm}
            onDownloadExcel={handleDownloadExcel}
            onDestroy={handledestroyForm}
            onResend={handleOpenSendForm}
            isControl={isControl}
          />
          {isMockMode &&
            (signInfo.status === 'Sign' || signInfo.status === 'resend') && (
              <div className="container d-flex justify-content-center gap-3 my-4">
                <CButton
                  color="success"
                  size="lg"
                  variant="outline"
                  onClick={() => handleMockSignAction('approve')}
                >
                  Mock Approve
                </CButton>
                <CButton
                  color="danger"
                  size="lg"
                  variant="outline"
                  onClick={() => handleMockSignAction('reject')}
                >
                  Mock Reject
                </CButton>
              </div>
            )}
          {visibleAP && (
            <AddParts
              itemAP={itemAP}
              setItemAP={setItemAP}
              handleAddPARTS={handleAddPARTS}
              handleConfirmDeleteRow={handleConfirmDeleteRow}
              visibleAP={visibleAP}
              handleCloseModalAP={handleCloseModalAP}
              buyer={buyer}
              itemApply={signInfo}
            />
          )}
          {visibleSign && (
            <CModal
              backdrop="static"
              visible={visibleSign}
              alignment="center"
              onClose={() => setVisibleSign(false)}
              aria-labelledby="StaticBackdropExampleLabel"
              className="p"
            >
              <CModalHeader
                className="text-center center-flex"
                closeButton={false}
              >
                <CModalTitle id={`modelMI`} className="primary h3">
                  <Image
                    className="me-2 "
                    src="/img/logo.png"
                    width={30}
                    height={30}
                    alt="logo"
                  />
                  Vendor Compare Price Apply Sign Form
                </CModalTitle>
              </CModalHeader>
              <CModalBody>
                {isSubmit ? (
                  <>
                    <div className="d-flex flex-column justify-content-center align-items-center gap-3">
                      <FadeLoader
                        color={'#0d5cab'}
                        height={15}
                        loading
                        margin={2}
                        radius={2}
                        speedMultiplier={1}
                        width={5}
                      />
                    </div>
                  </>
                ) : (
                  <CContainer className="border h3 border-3">
                    <CRow>
                      <CCol
                        className={`py-4 border border-3 primary text-center`}
                      >
                        Sign Route
                      </CCol>
                      <CCol className="py-4 border border-3" xs={8}>
                        <CFormSelect
                          aria-label="Default select example"
                          options={getProcessOptions()}
                          onChange={(e) => {
                            handleSelectSignForm('signRoute', e.target.value)
                          }}
                          size="lg"
                        />
                      </CCol>
                    </CRow>
                  </CContainer>
                )}
              </CModalBody>
              <CModalFooter className="text-center center-flex">
                {isSubmit ? (
                  <></>
                ) : (
                  <>
                    <CButton
                      color="primary"
                      onClick={() => {
                        handleResend()
                      }}
                      size="lg"
                    >
                      Send
                    </CButton>
                    <CButton
                      color="secondary"
                      onClick={() => {
                        setVisibleSign(false)
                        setSignForm(signFormInit)
                      }}
                      size="lg"
                    >
                      Cancel
                    </CButton>
                  </>
                )}
              </CModalFooter>
            </CModal>
          )}
        </main>
      )}
    </>
  )
}
export async function getServerSideProps() {
  return { props: {} }
}
