import { useContext } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/context/AuthContext'
import Swal from 'sweetalert2'
import { logger } from '@/utils/logger'

const useUserPermissions = () => {
  const router = useRouter()
  const { user } = useContext(AuthContext)
  const hasModuleAccess = (moduleCode) => {
    return user?.permissions?.modules?.includes(moduleCode)
  }

  const buildPermissionMap = (forms = []) => {
    const map = new Map()
    forms.forEach(({ form_code, action_code }) => {
      if (!map.has(form_code)) map.set(form_code, new Set())
      map.get(form_code).add(action_code)
    })
    return map
  }

  const permissionMap = buildPermissionMap(user?.permissions?.forms)

  const canUserDo = (formCode, actionCode) => {
    return permissionMap.get(formCode)?.has(actionCode) ?? false
  }

  const handlePermissionGuard = (moduleCode) => {
    logger.warn(`Access denied for module ${moduleCode}`, `useUserPermissions`)
    Swal.fire({
      customClass: 'h5',
      icon: 'error',
      title: 'Access Restricted',
      text: 'Your current role does not permit access to this page. Redirecting to the homepage.',
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      router.push('/')
    })
  }

  return { hasModuleAccess, canUserDo, handlePermissionGuard }
}

export default useUserPermissions
