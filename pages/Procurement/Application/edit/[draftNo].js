import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useContext,
  useCallback,
} from 'react'
import { api } from '@/utils/api'
import Image from 'next/image'
import Link from 'next/link'
import { CButton, CButtonGroup } from '@coreui/react'
import Swal from 'sweetalert2'
import ApplyFormTitle from '@/components/applyForm/applyFormTitle'
import ApplyFormContent from '@/components/applyForm/applyFormContent'
import AddParts from '@/components/applyForm/addParts'
import OldApplyForm from '@/components/applyForm/oldApplyForm'
import SendButton from '@/components/applyForm/sendButton'
import useCompareInfo from '@/hooks/useCompareInfo'
import { AuthContext } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import debounce from 'lodash.debounce'
import moment from 'moment'
import LoadingOverlay from '@/components/loadingOverlay'
import { logger } from '@/utils/logger'
import usePermissionGuard from '@/hooks/usePermissionGuard'

export default function Index() {
  usePermissionGuard('Procurement')

  const { user } = useContext(AuthContext)

  const { getCompareApplyDraft, getCompareDataDraft, loading, error } =
    useCompareInfo()
  const router = useRouter()
  const date = moment().format('YYYY-MM-DD')
  const fileInputRef = useRef()
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
    }
  }
  const [items, setItems] = useState([])
  const [itemAP, setItemAP] = useState([getInputInit('AP')])
  const [sapSourcer, setSapSourcer] = useState([])
  const [buyer, setBuyer] = useState([])
  const [itemApply, setItemApply] = useState({
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
  const [visibleAP, setVisibleAP] = useState(false)
  const [compareData, setCompareData] = useState([])
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
  const [isLoading, setIsLoading] = useState(false)
  const itemsRef = useRef(items)

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

  const { draftNo } = router.query

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

  const calculateCostDown = (lastPutPrice, unitPrice, exchangeRate) => {
    if (lastPutPrice === 0) return 0
    return (
      ((lastPutPrice * exchangeRate - unitPrice) /
        (lastPutPrice * exchangeRate)) *
      100
    ).toFixed(2)
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
      console.log(updatedItems)
      setItems(updatedItems)
      debouncedAutoSave()
      handleCloseModalAP()
    }
  }

  const handleCloseModalAP = () => {
    setVisibleAP(false)
    setItemAP([getInputInit('AP')])
  }

  const handleEdit = (id) => {
    logger.info(`Edit row: id=${id}`, `draftNo：${draftNo}`)
    const targetItem = items.find((item) => item.id === id)
    const newItem = { ...targetItem, editAgain: id }
    if (targetItem.type === 'AP') {
      setItemAP([{ ...newItem, id: 'AP' }])
      setVisibleAP(true)
    } else {
      setItems(items.map((item) => (item.id === id ? newItem : item)))
      debouncedAutoSave()
    }
  }

  const handleDeleteRow = (id) => {
    logger.info(`Delete row: id=${id}`, `draftNo：${draftNo}`)
    const targetItem = items.find((item) => item.id === id)
    if (!targetItem) return
    if (targetItem.AttachFile && targetItem.AttachFile.length > 0) {
      targetItem.AttachFile.forEach((item) => {
        URL.revokeObjectURL(item.preview)
      })
    }
    const newItems = items.filter((item) => item.id !== id)

    setItems(newItems)
    debouncedAutoSave()
    handleCloseModalAP()
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
      customClass: 'h3',
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteRow(id)
        Swal.fire({
          title: 'Deleted!',
          text: 'Your file has been deleted.',
          icon: 'success',
          customClass: 'h3',
        })
      }
    })
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
    const username =
      itemApply.sap_sourcer?.username || itemApply.buyer?.username
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
      debouncedAutoSave()
    } catch (error) {
      console.error('Error reading Excel file:', error)
      setIsLoading(false)
    }
  }

  const handleExcelUpload = async (event, username) => {
    const file = event.target.files[0]
    try {
      const url = api(`/data/import-excel?buyer=${username}`)
      logger.info(`import excel : ${url}`, `draftNo：${draftNo}`)
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
        logger.info(`${url} API success`, `draftNo：${draftNo}`)
      } else {
        logger.warn(
          ` ${url} API failed with status ${response.status}`,
          `draftNo：${draftNo}`
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
        `draftNo：${draftNo}`,
        error
      )
    }
  }

  const updateForm = (value) => {
    const { compare_data, compare_apply } = value
    logger.info(`updateForm success`, `draftNo：${draftNo}`)
    setItemApply(compare_data)
    const new_compare_apply = compare_apply.map((row) => ({
      ...row,
      Rate: rate[row.CurrencyOld]?.[row.CurrencyNew] || '0',
    }))
    setItems(new_compare_apply)
    debouncedAutoSave()
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
    logger.info(`sort by key=${key} type=${type}`, `draftNo：${draftNo}`)
    setSortConfigs((prevConfigs) => getNextSortConfigs(prevConfigs, key, type))
  }

  // const removeParentheses = (text) => text.replace(/^\(.*?\)/, '').trim()

  const handleDeleteForm = async () => {
    const result = await Swal.fire({
      title: 'Do you want to DELETE the form?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      customClass: 'h3',
    })

    if (!result.isConfirmed) return

    /* Read more about isConfirmed, isDenied below */
    if (result.isConfirmed) {
      const url = api(`/compare-data/draft`)
      logger.info(`Deleting draft : ${url}`, `DraftList`)
      const method = 'DELETE'
      const responseDel = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          draft_no: draftNo,
          username: itemApply.buyer.username,
        }),
      })

      const resultDel = await responseDel.json()
      if (responseDel.ok) {
        logger.info('Delete draft API success', `draftNo：${draftNo}`)
      } else {
        logger.warn(
          `Delete draft API failed with status ${responseDel.status}`,
          `DraftList`
        )
        throw new Error('Failed to delete draft')
      }

      if (resultDel.status !== 'success') {
        logger.error('Error delete draft', `draftNo：${draftNo}`, null)
      }

      Swal.fire({
        position: 'center',
        icon: 'success',
        title: 'Your form has been DELETED successfully',
        customClass: 'h3',
        showConfirmButton: false,
        timer: 1500,
      })
      setTimeout(() => {
        router.push(`/Procurement/Application/list`)
      }, 1500)
      return
    }
  }

  const handleReset = () => {
    if (items.length !== 0) {
      Swal.fire({
        title: 'Do you want to reset the form?',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        customClass: 'h3',
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          logger.info('reset form', `draftNo：${draftNo}`)
          setItems([])
          debouncedAutoSave()
          const newItemApply = {
            id: '',
            apply_no: '',
            sign_number: '',
            buyer: user,
            apply_date: date,
            memo: '',
            sap_sourcer: '',
            status: '',
            end_date: '',
          }
          setItemApply(newItemApply)
        }
      })
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
    logger.info(`Fetching sap-sourcer : ${url}`, `draftNo：${draftNo}`)
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
        logger.info('sap-sourcer API success', `draftNo：${draftNo}`)
      } else {
        logger.warn(
          `sap-sourcer API failed with status ${response.status}`,
          `draftNo：${draftNo}`
        )
        throw new Error('Failed to fetch sap-sourcer')
      }
      return result
    } catch (err) {
      logger.error('sap-sourcer request exception', `draftNo：${draftNo}`, err)
    }
  }

  const getBuyer = async () => {
    const url = api('/buyers')
    logger.info(`Fetching buyer : ${url}`, `draftNo：${draftNo}`)
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
        logger.info('buyer API success', `draftNo：${draftNo}`)
      } else {
        logger.warn(
          `buyer API failed with status ${response.status}`,
          `draftNo：${draftNo}`
        )
        throw new Error('Failed to fetch buyer')
      }
      return result
    } catch (err) {
      logger.error('buyer request exception', `draftNo：${draftNo}`, err)
    }
  }

  const handleGetCompareData = async () => {
    const { username } = user
    const dataDB = await getCompareDataDraft(username)
    if (error) return <p>Error: {error.message}</p>
    setCompareData(dataDB.data)
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
    logger.info(`Deleting rows: ${selectIds.join(', ')}`, `draftNo：${draftNo}`)
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
    debouncedAutoSave()
  }

  const handlesaveDraft = useCallback(async () => {
    const url = api(`/compare-apply/draft/${draftNo}`)
    logger.info(`Saving draft : ${url}`, `draftNo：${draftNo}`)
    const method = 'PUT'

    try {
      const title = {
        draft_no: draftNo,
        buyer: user.username,
        sap_sourcer: itemApply.sap_sourcer.code,
        sap_sourcer_username: itemApply.sap_sourcer?.username,
        sap_sourcer_name: itemApply.sap_sourcer?.name,
        memo: itemApply.memo,
      }
      const newItems = itemsRef.current.map((item) => {
        return {
          ...item,
          draft_no: draftNo,
          Factory: item.Factory.code,
          Vendor: item.Vendor.code,
          Brand: item.Brand.code,
          Buyer: item.Buyer.username,
          PlaceOfOrigin: JSON.stringify(item.PlaceOfOrigin),
        }
      })
      const sendForm = {
        data: newItems,
        title,
      }

      const payload = JSON.stringify(sendForm)
      console.log('payload bytes:', new TextEncoder().encode(payload).length)
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json', // ⬅️ 缺這個
        },
        credentials: 'include',
        body: JSON.stringify(sendForm),
      })

      const result = await response.json()
      if (response.ok) {
        logger.info('compare-apply/draft API success', `draftNo：${draftNo}`)
      } else {
        logger.warn(
          `compare-apply/draft API failed with status ${response.status}`,
          `draftNo：${draftNo}`
        )
        throw new Error('Failed to fetch compare-apply/draft')
      }
      if (result.status === 'success') {
        logger.info('Save draft success', `draftNo：${draftNo}`)
        return
      }
    } catch (err) {
      logger.error('save draft request exception', `draftNo：${draftNo}`, err)
    }
  })

  const debouncedAutoSave = useMemo(
    () => debounce(handlesaveDraft, 1000),
    [handlesaveDraft]
  )

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

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (!router.isReady) return // 確保 route 準備好再執行
    logger.info('Enter Compare Draft Page', `draftNo：${draftNo}`)
    const isMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

    if (!user) return

    async function fetchData() {
      // 設定 itemApply 的初始值
      const dataDB = await getCompareApplyDraft(draftNo)
      if (dataDB.status === 'success') {
        console.log('Current user:', dataDB.data, user.username)
        if (
          dataDB.data.compare_data_draft.buyer.username !== user.username &&
          !isMock
        ) {
          logger.error('Access Denied', `draftNo：${draftNo}`)

          Swal.fire({
            position: 'center',
            icon: 'error',
            title: 'Access Denied',
            showConfirmButton: false,
            timer: 1500,
            customClass: 'h5',
          }).then(() => {
            router.push('/Procurement/Application/list')
          })
          return
        }
        const newItems = dataDB.data.compare_apply_draft.map((item) => ({
          ...item,
          Rate: rate[item.CurrencyOld]?.[item.CurrencyNew] || 0,
          PlaceOfOrigin: JSON.parse(item.PlaceOfOrigin),
        }))
        setItems(newItems)
        console.log(newItems)
        const newItemApply = {
          id: '',
          apply_no: '',
          sign_number: '',
          buyer: user,
          apply_date: date,
          memo: dataDB.data.compare_data_draft.memo,
          sap_sourcer: dataDB.data.compare_data_draft.sap_sourcer
            ? dataDB.data.compare_data_draft.sap_sourcer
            : {},
          status: '',
          end_date: '',
        }
        setItemApply(newItemApply)
      }
      try {
        // 獲取 sapSourcer 資料
        const newSapSourcer = await getSapSourcer()

        if (newSapSourcer.status === 'success') {
          setSapSourcer(newSapSourcer.data)
        }

        // 獲取 buyer 資料
        const newBuyer = await getBuyer()
        if (newBuyer.status === 'success') {
          setBuyer(newBuyer.data)
        }
        logger.info('Fetched compare draft data', `draftNo：${draftNo}`)
      } catch (error) {
        logger.error('Error fetching draft', `draftNo： {draftNo}`, error)
      }
    }
    fetchData()
  }, [router.isReady, user]) // 依賴

  return (
    <>
      <main className={'pb-3 print-area'}>
        {isLoading && <LoadingOverlay text="正在匯入 Excel 資料..." />}

        <div className={`pt-3 container d-flex justify-content-center`}>
          <div className="d-inline-block text-center">
            <h1 className={`fw-bold text-center primary  center-flex mb-3`}>
              <Image
                className="me-2 "
                src="/img/logo.png"
                width={30}
                height={30}
                alt="logo"
              />
              Request for Quotation Form
            </h1>
            <div className="h3 fw-bold text-end mb-3">Date：{date}</div>
            <ApplyFormTitle
              applyForm={itemApply}
              isEdit={true}
              sapSourcer={sapSourcer}
              setItemApply={setItemApply}
            />
          </div>
        </div>
        <div className="container mb-3 pt-5">
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
            </CButton>
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
            <CButton as="a" color="secondary" onClick={handleDeleteForm}>
              <span className="p fw-normal">Cancel Apply</span>
            </CButton>
            <CButton color="secondary" onClick={handleReset}>
              <span className="p fw-normal">Reset Apply</span>
            </CButton>
          </CButtonGroup>

          <CButton onClick={handleDownloadSample} color="link" size="lg">
            <span className="p fw-normal">excel sample</span>
          </CButton>
        </div>
        <ApplyFormContent
          items={sortedItems}
          handleEdit={handleEdit}
          handleSort={handleSort}
          sortConfigs={sortConfigs}
          onDeleteItems={handleDeleteRows}
        />
        {sortedItems.length > 0 && (
          <SendButton items={items} itemApply={itemApply} draftNo={draftNo} />
        )}
      </main>
      {visibleAP && (
        <AddParts
          itemAP={itemAP}
          setItemAP={setItemAP}
          handleAddPARTS={handleAddPARTS}
          handleConfirmDeleteRow={handleConfirmDeleteRow}
          visibleAP={visibleAP}
          handleCloseModalAP={handleCloseModalAP}
          buyer={buyer}
          itemApply={itemApply}
        />
      )}
    </>
  )
}
export async function getServerSideProps() {
  return { props: {} }
}
