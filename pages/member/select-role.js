import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { CButton, CContainer, CFormCheck } from '@coreui/react'
import { FadeLoader } from 'react-spinners'
import Swal from 'sweetalert2'
import { AuthContext } from '@/context/AuthContext'
import { api } from '@/utils/api'
import styles from '@/styles/selectFactory.module.scss'

export default function SelectRole() {
  const router = useRouter()
  const { user, setUser } = useContext(AuthContext)
  const [roles, setRoles] = useState([])
  const [selectedRoles, setSelectedRoles] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showWarning = (message) =>
    Swal.fire({
      title: 'Warning',
      text: message,
      icon: 'warning',
      customClass: 'h5',
    })

  const loadRoles = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch(api('/login/demo-roles'), {
        credentials: 'include',
      })
      const result = await response.json()

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || 'Failed to load roles')
      }

      setRoles(result.data.roles || [])
      setStatus('ready')
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load roles')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const handleRoleChange = (roleCode) => {
    setSelectedRoles((currentRoles) =>
      currentRoles.includes(roleCode)
        ? currentRoles.filter((code) => code !== roleCode)
        : [...currentRoles, roleCode]
    )
  }

  const handleConfirm = async () => {
    if (!selectedRoles.length) {
      showWarning('Please select at least one role.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(api('/login/select-role'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role_codes: selectedRoles }),
      })
      const result = await response.json()

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || 'Failed to select role')
      }

      const updatedUser = result.data.user
      setUser(updatedUser)
      router.replace(updatedUser.factory ? '/' : '/member/selectFactory')
    } catch (error) {
      showWarning(error.message || 'Failed to select role')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <CContainer className={styles.card}>
        <h1 className={styles.title}>Select Demo Role</h1>
        <p className={styles.helper}>
          Choose one or more roles and permissions for this demo session.
        </p>

        {status === 'loading' && (
          <div className={styles.stateBox}>
            <FadeLoader color="#0d5cab" loading />
          </div>
        )}

        {status === 'error' && (
          <div className={styles.stateBox}>
            <span className={styles.errorText}>{errorMessage}</span>
            <CButton color="secondary" variant="outline" onClick={loadRoles}>
              Retry
            </CButton>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className={styles.field}>
              <span className={styles.label}>Roles</span>
              <div className="d-flex flex-column gap-3">
                {roles.map((role) => (
                  <CFormCheck
                    key={role.role_code}
                    id={`role-${role.role_code}`}
                    label={`${role.name} (${role.role_code})`}
                    checked={selectedRoles.includes(role.role_code)}
                    onChange={() => handleRoleChange(role.role_code)}
                    className={`p`}
                  />
                ))}
              </div>
            </div>
            <div className="d-flex justify-content-center">
              <CButton
                color="primary"
                className="btn-ph-primary mb-3
                "
                size="lg"
                disabled={isSubmitting}
                onClick={handleConfirm}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </CButton>
            </div>
          </>
        )}
      </CContainer>
    </main>
  )
}
