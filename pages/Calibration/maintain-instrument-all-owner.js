import { useEffect, useState } from 'react'
import Head from 'next/head'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CRow,
} from '@coreui/react'
import ClientOnly from '@/components/common/clientOnly'
import DeptTree from '@/components/common/deptTree'
import { useToast } from '@/hooks/useToast'
import { api } from '@/utils/api'
import styles from '@/styles/maintain-instrument-all-owner.module.scss'
import { calibrationService } from '@/services/Calibration/calibration.service'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const buildOwnerLabel = (owner) => {
  if (!owner) return ''
  const name = owner.fullname || owner.ename || ''
  const user = owner.username ? ` (${owner.username})` : ''
  const dept = owner.dept ? ` - ${owner.dept}` : ''
  return `${name}${user}${dept}`.trim()
}

export default function ChangeInstrumentAllOwnerPage() {
  usePermissionGuard('Calibration')
  const [oldOwner, setOldOwner] = useState('')
  const [newOwner, setNewOwner] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [oldOwnerOptions, setOldOwnerOptions] = useState([
    { label: 'Select old owner', value: '' },
  ])
  const toast = useToast()

  const newOwnerLabel = buildOwnerLabel(newOwner) || 'Select new owner'

  const fetchOwnerList = async () => {
    try {
      const owners = await calibrationService.getOwnerList()
      const options = owners.data.map((data) => ({
        label: data.owner,
        value: data.owner_username || data.owner,
      }))
      setOldOwnerOptions([{ label: 'Select old owner', value: '' }, ...options])
    } catch (error) {
      console.log(error)
      toast.error('Failed to fetch owner list.')
    }
  }

  const handleSelectNewOwner = (node) => {
    if (!node || node?.type?.trim() !== 'user') return
    const nextOwner = {
      username: node.username,
      fullname: node.fullname,
      ename: node.ename,
      job_title: node.job_title,
      dept: node.dept,
    }
    setNewOwner(nextOwner)
    setShowModal(false)
  }

  const handleReset = () => {
    setOldOwner('')
    setNewOwner(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = []
    if (!oldOwner) errors.push('Please select an old owner.')
    if (!newOwner) errors.push('Please select a new owner.')
    if (oldOwner && newOwner && oldOwner === newOwner.username) {
      errors.push('Old owner and new owner must be different.')
    }

    if (errors.length) {
      errors.forEach((message) => toast.error(message))
      return
    }
    try {
      console.log(oldOwner, newOwner.username)
      const result = await calibrationService.updateAllOwner(
        oldOwner,
        newOwner.username,
        newOwner.dept
      )
      if (result.status === 'error') {
        toast.error('Failed to change owner.')
        return
      }
      const newOwnerOptions = oldOwnerOptions.filter(
        (option) => option.value !== oldOwner
      )
      newOwnerOptions.push({
        label: newOwner.fullname,
        value: newOwner.username,
      })
      setOldOwnerOptions(newOwnerOptions)
      handleReset()

      toast.success('Owner change request submitted.')
    } catch (error) {
      console.error('Error changing owner:', error)
      toast.error('An unexpected error occurred.')
    }
  }

  useEffect(() => {
    fetchOwnerList()
  }, [])

  return (
    <>
      <Head>
        <title>Change Instrument ALL Owner</title>
      </Head>
      <CContainer fluid className={styles.pageShell}>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardHeader className={styles.cardHeader}>
              <div>
                <p className={styles.eyebrow}>Calibration</p>
                <h2 className={styles.title}>Change Instrument ALL Owner</h2>
              </div>
            </CCardHeader>
            <CCardBody className={styles.cardBody}>
              <CForm onSubmit={handleSubmit}>
                <CRow className="g-4">
                  <CCol xs={12}>
                    <CFormLabel htmlFor="oldOwner" className="h5">
                      Instrument old Owner
                    </CFormLabel>
                    <CFormSelect
                      id="oldOwner"
                      value={oldOwner}
                      onChange={(event) => setOldOwner(event.target.value)}
                      options={oldOwnerOptions}
                      size="lg"
                    />
                  </CCol>
                  <CCol xs={12}>
                    <CFormLabel htmlFor="newOwner" className="h5">
                      Instrument new Owner
                    </CFormLabel>
                    <CInputGroup>
                      <CFormInput
                        id="newOwner"
                        value={newOwnerLabel}
                        readOnly
                        size="lg"
                      />
                      <CButton
                        color="primary"
                        className="btn-ph-primary"
                        type="button"
                        size="lg"
                        onClick={() => setShowModal(true)}
                      >
                        Select
                      </CButton>
                    </CInputGroup>
                  </CCol>
                </CRow>

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <CButton
                    color="secondary"
                    variant="outline"
                    type="button"
                    size="lg"
                    onClick={handleReset}
                  >
                    Reset
                  </CButton>
                  <CButton
                    color="primary"
                    type="submit"
                    size="lg"
                    className="btn-ph-primary"
                  >
                    Change Owner
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </div>
      </CContainer>

      <ClientOnly>
        <CModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          size="lg"
        >
          <CModalHeader>
            <h5 className="m-0 h4 fw-bold">Select New Owner</h5>
          </CModalHeader>
          <CModalBody>
            <DeptTree onSelectedNodeChange={handleSelectNewOwner} />
          </CModalBody>
          <CModalFooter className="d-flex justify-content-between">
            <CButton
              color="secondary"
              variant="ghost"
              size="lg"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </CButton>
          </CModalFooter>
        </CModal>
      </ClientOnly>
    </>
  )
}
