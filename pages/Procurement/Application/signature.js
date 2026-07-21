import React, { useState, useEffect, useContext, useMemo } from 'react'
import { api } from '@/utils/api'
import Image from 'next/image'
import Link from 'next/link'
import { CButton, CTable, CContainer } from '@coreui/react'
import styles from '@/styles/signature.module.scss'
import ApplyFormContent from '@/components/applyForm/applyFormContent'
import useCompareInfo from '@/hooks/useCompareInfo'
import { AuthContext } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import { FadeLoader } from 'react-spinners'
import { logger } from '@/utils/logger'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

const getWorkflowUrl = (formUrl, activeId) => {
  if (!isMockMode) return formUrl

  try {
    const url = new URL(formUrl)
    const workflowActiveId = url.searchParams.get('activeId') || activeId
    return workflowActiveId ? `/workflow/${workflowActiveId}` : formUrl
  } catch {
    return activeId ? `/workflow/${activeId}` : formUrl
  }
}

export default function Signature() {
  usePermissionGuard('Procurement')
  const { user } = useContext(AuthContext)
  const { getCompareApply, loading, error } = useCompareInfo()
  const [loadingTitle, setLoadingTitle] = useState(true)
  const [items, setItems] = useState([])
  const [dataItems, setDataItems] = useState([])
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

  const columns = [
    {
      key: 'applyno',
      label: 'Apply No.',
      _props: { scope: 'col' },
    },
    {
      key: 'applyName',
      label: 'Sign Man',
      _props: { scope: 'col' },
    },
    {
      key: 'type',
      label: 'Type',
      _props: { scope: 'col' },
    },
    {
      key: 'signUnit',
      label: 'Sign Unit',
      _props: { scope: 'col' },
    },
    {
      key: 'step',
      label: 'Step',
      _props: { scope: 'col' },
    },
    {
      key: 'signdate',
      label: 'Sign Date',
      _props: { scope: 'col' },
    },
    {
      key: 'preview',
      label: 'Preview',
      _props: { scope: 'col' },
    },
  ]

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

  const getSignature = async () => {
    const url = api('/signature?title=Vendor Compare Price')
    logger.info(`Getting signature : ${url}`, 'Signature')
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
        logger.info('Signature API success', 'Signature')
      } else {
        logger.warn(
          `Signature API failed with status ${response.status}`,
          'Signature'
        )
        throw new Error('Failed to get signature')
      }
      return result
    } catch (err) {
      logger.error('Error getting signature', 'Signature', err)
    }
  }

  const handlePreview = async (activeId) => {
    try {
      const dataDB = await getCompareApply('', activeId)
      if (error) return <p>Error: {error.message}</p>
      if (!loading) {
        if (dataDB.error) {
          logger.error('Error fetching data:', 'Signature', dataDB.error)
          return
        }
        logger.info(
          `Fetched preview data for activeId=${activeId}`,
          'Signature'
        )
        console.log('Raw data from DB:', dataDB)
        const newItems = dataDB.data.compare_apply.map((item, i) => {
          return {
            ...item,
            Rate: rate[item.CurrencyOld]?.[item.CurrencyNew] || 0,
            PlaceOfOrigin: JSON.parse(item.PlaceOfOrigin),
          }
        })
        // 如果資料加載成功，更新狀態
        setDataItems(newItems)
      }
    } catch (e) {
      logger.error('Error fetching sapSource', 'Signature', e)
      setDataItems([])
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
    logger.info(`sort by key=${key} type=${type}`, 'Signature')
    setSortConfigs((prevConfigs) => getNextSortConfigs(prevConfigs, key, type))
  }

  const removeParentheses = (text) => text.replace(/^\(.*?\)/, '').trim()

  const sortedItems = useMemo(() => {
    if (!sortConfigs.length) return dataItems

    return [...dataItems].sort((a, b) => {
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
  }, [dataItems, sortConfigs])

  useEffect(() => {
    if (!router.isReady) return // 確保 route 準備好再執行
    logger.info('Enter Compare Signature Page', 'Signature')
    if (!user) return

    const fetchData = async () => {
      const result = await getSignature()
      if (result.status === 'success') {
        const newData = result.data.map((item) => {
          let applyno, type, signUnit, step

          const memoMatch = item.memo2.match(
            /VENDOR Compare Price：(.*?) Type：(.*)/
          )
          if (memoMatch) {
            applyno = memoMatch[1] // XXXXXXXX
            type = memoMatch[2] // Y
          }
          const descMatch = item.description.match(/^([^.]+)\.(.*)$/)
          if (descMatch) {
            step = descMatch[1] // Z
            signUnit = descMatch[2] // RRR
          }
          console.log(item.formUrl)

          return {
            applyno: applyno || '',
            applyName: item.applyName,
            type: type || '',
            signUnit,
            step,
            signdate: item.enterDate,
            formUrl: getWorkflowUrl(item.formUrl, item.activeId),
            activeId: item.activeId,
          }
        })
        setLoadingTitle(false)
        setItems(newData)
      } else {
        setLoadingTitle(false)
        setItems([])
      }
    }

    fetchData()
  }, [router.isReady, user])
  return (
    <>
      <main className="print-area">
        <div className={`pt-3 container d-flex justify-content-center`}>
          <h1 className={`fw-bold text-center primary center-flex mb-3`}>
            <Image
              className="me-2 "
              src="/img/logo.png"
              width={30}
              height={30}
              alt="logo"
            />
            Sign Document&apos;s List
          </h1>
        </div>
        {loadingTitle ? (
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
          <>
            <CContainer className="d-none d-md-table">
              <CTable
                className={`p fw-normal text-center mb-5 ${styles.signList}`}
                columns={columns}
                items={items.map((item, i) => ({
                  ...item,
                  applyno: item.applyno ? (
                    <>
                      <CButton
                        as="a"
                        color="link"
                        target="_blank"
                        href={item.formUrl}
                        size="lg"
                      >
                        {item.applyno}
                      </CButton>
                    </>
                  ) : (
                    <>
                      <CButton
                        as="a"
                        color="link"
                        target="_blank"
                        href={item.formUrl}
                        size="lg"
                      >
                        起單階段
                      </CButton>
                    </>
                  ),
                  preview: (
                    <>
                      <CButton
                        color="success"
                        variant="outline"
                        className="btn-ph-outline-primary"
                        size="lg"
                        onClick={() => {
                          handlePreview(item.activeId)
                        }}
                      >
                        檢視
                      </CButton>
                    </>
                  ),

                  _cellProps: { id: { scope: 'row' } },
                }))}
                bordered
                borderColor="primary"
                tableHeadProps={{
                  color: 'primary',
                }}
                color="light"
              />
            </CContainer>
            <div className="d-flex flex-column m-5 d-md-none gap-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-primary rounded p-4 shadow bg-white mb-3"
                >
                  <p>
                    <strong>Apply No：</strong>{' '}
                    <CButton
                      as="a"
                      color="link"
                      target="_blank"
                      href={item.formUrl}
                      size="lg"
                    >
                      {item.applyno || '起單階段'}
                    </CButton>
                  </p>
                  <p>
                    <strong>Sign Man：</strong> {item.applyName}
                  </p>
                  <p>
                    <strong>Type：</strong> {item.type}
                  </p>
                  <p>
                    <strong>Sign Unit：</strong> {item.signUnit}
                  </p>
                  <p>
                    <strong>Step：</strong> {item.step}
                  </p>
                  <p>
                    <strong>Sign Date：</strong> {item.signdate}
                  </p>
                  <div className="mt-2 text-end">
                    <CButton
                      color="success"
                      variant="outline"
                      className="btn-ph-outline-primary"
                      size="lg"
                      onClick={() => handlePreview(item.activeId)}
                    >
                      檢視
                    </CButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {dataItems.length !== 0 && (
          <ApplyFormContent
            items={sortedItems}
            handleEdit={''}
            handleSort={handleSort}
            sortConfigs={sortConfigs}
            className="mb-3"
          />
        )}
        <div className="d-flex gap-5 justify-content-center mt-3">
          <Link href="/">
            <CButton color="secondary" className={styles.ch15}>
              Back
            </CButton>
          </Link>
        </div>
      </main>
    </>
  )
}
