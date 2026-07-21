import { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/context/AuthContext'
import Swal from 'sweetalert2'
import { logger } from '@/utils/logger'
import useUserPermissions from '@/hooks/useUserPermissions'

export default function usePermissionGuard(moduleCode) {
  const router = useRouter()
  const { user } = useContext(AuthContext)
  const { hasModuleAccess, handlePermissionGuard } = useUserPermissions()
  useEffect(() => {
    if (!user) return
    if (!hasModuleAccess(moduleCode)) {
      handlePermissionGuard(moduleCode)
    }
  }, [hasModuleAccess, handlePermissionGuard, user])
}
