// pages/index.js
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CButton,
  CForm,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
// import PermissionEditor from '@/components/admin/permissionEditor'
import dynamic from 'next/dynamic'

const PermissionEditor = dynamic(
  () => import('../../components/admin/permissionEditor'),
  {
    ssr: false,
  }
)
const RoleEditor = dynamic(() => import('../../components/admin/roleEditor'), {
  ssr: false,
})

export default function Editor() {
  // 處理切換狀態

  return (
    <>
      <main className="bg py-5">
        <div className="container px-4">
          {/* 標題區塊 */}
          {/* <RoleEditor /> */}
          <PermissionEditor />
        </div>
      </main>
    </>
  )
}
