// pages/index.js
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CContainer } from '@coreui/react'
import styles from '../styles/homePage.module.scss'
import PendingTasks from '../components/common/pending-tasks'
import Favorites from '../components/common/favorites'

export default function Home() {
  return (
    <main className="bg">
      <CContainer className="py-4">
        <div className="text-center mb-4">
          <h1 className="fw-bold primary d-flex align-items-center justify-content-center gap-2">
            <Image src="/img/logo.png" width={30} height={30} alt="logo" />
            Dashboard
          </h1>
        </div>
        <div className="d-flex flex-column gap-4">
          <div className="d-flex gap-4">
            <Favorites />
          </div>

          <PendingTasks />
        </div>
      </CContainer>
    </main>
  )
}
