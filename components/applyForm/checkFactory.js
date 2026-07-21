import React, { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import {
  CButton,
  CFormCheck,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import { logger } from '@/utils/logger'

export default function CheckFactory({
  item,
  getUpdateFactory,
  visible,
  onCloseVisible,
}) {
  const [factoryOptions, setFactoryOptions] = useState([])

  const [visibleUnit, setVisibleUnit] = useState(visible)
  const [factory, setFactory] = useState([])

  const handleCloseModal = (id = '') => {
    setVisibleUnit(false)
    setFactory([])
    onCloseVisible()
  }

  const handleSelectFactory = (value) => {
    setFactory(value)
  }

  const getFactory = async () => {
    const url = api('/factories')
    logger.info(`Fetching factories from ${url}`, 'CheckFactory')
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
        logger.info('factories API success', 'CheckFactory')
      } else {
        logger.warn(
          `factories API failed with status ${response.status}`,
          'CheckFactory'
        )
        throw new Error('Failed to fetch factories')
      }

      return result
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    setVisibleUnit(visible)
  }, [visible])

  useEffect(() => {
    const fetchFactory = async () => {
      const newFactory = await getFactory()
      setFactoryOptions(newFactory.data) // 這裡可以 setState
    }
    fetchFactory()
  }, [])

  return (
    <>
      <CModal
        alignment="center"
        visible={!!visibleUnit}
        onClose={() => handleCloseModal(item.id)}
        aria-labelledby={`model${item.id}`}
        backdrop="static"
      >
        <CModalHeader className="text-center" closeButton={false}>
          <CModalTitle id={`model${item.id}`} className="primary h3 ">
            Factory List
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-2 border  border-1 p-2 border-secondary-subtle">
            {factoryOptions.map((option) => (
              <CFormCheck
                key={option.code}
                type="radio"
                className="h5"
                name={`FactoryMV_${option.code}`}
                id={`FactoryMV_${option.code}`}
                label={`${option.code}->${option.name}`}
                value={JSON.stringify(option)}
                onChange={(e) => {
                  handleSelectFactory(JSON.parse(e.target.value))
                }}
                checked={
                  factory && String(factory.code) === String(option.code)
                }
              />
            ))}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              handleCloseModal(item.id)
            }}
            size="lg"
          >
            Close
          </CButton>

          <CButton
            color="primary"
            onClick={() => {
              getUpdateFactory(item.id, factory)
              handleCloseModal(item.id)
            }}
            size="lg"
          >
            Send OK
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}
