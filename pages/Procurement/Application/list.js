import { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/context/AuthContext'
import useCompareInfo from '@/hooks/useCompareInfo'
import { CButton } from '@coreui/react'
import { api } from '@/utils/api'
import Swal from 'sweetalert2'
import { logger } from '@/utils/logger'
import usePermissionGuard from '@/hooks/usePermissionGuard'

export default function DraftList() {
  usePermissionGuard('Procurement')
  const { user } = useContext(AuthContext)
  const { getCompareData, getCompareDataDraft, loading, error } =
    useCompareInfo()

  const [drafts, setDrafts] = useState([])
  const router = useRouter()

  const handleCreateDraft = async () => {
    try {
      const url = api(`/compare-data/draft?buyer=${user.username}`)
      logger.info(`Creating draft : ${url}`, `DraftList`)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      const result = await response.json()
      if (response.ok) {
        logger.info('Create draft API success', `DraftList`)
      } else {
        logger.warn(
          `Create draft API failed with status ${response.status}`,
          `DraftList`
        )
        throw new Error('Failed to create draft')
      }
      if (result.status === 'success') {
        router.push(`/Procurement/Application/edit/${result.data}`)
      } else {
        Swal.fire({
          customClass: 'h5',
          title: 'Errors',
          html: 'Failed to create draft',
          icon: 'error',
        })
      }
    } catch (err) {
      logger.error('Create draft request exception', `DraftList`, err)
      Swal.fire({
        customClass: 'h5',
        title: 'Errors',
        html: 'An error occurred. Please try again.',
        icon: 'error',
      })
      return null
    }
  }

  const handleEdit = (draft_no) => {
    logger.info(`Click edit draft ${draft_no}`, 'DraftList')
    router.push(`/Procurement/Application/edit/${draft_no}`)
  }

  const handleDelete = async (draft_no) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it',
      customClass: 'h3',
    }).then(async (result) => {
      if (result.isConfirmed) {
        const url = api(`/compare-data/draft`)
        logger.info(`Deleting draft : ${url}`, `DraftList`)
        const method = 'DELETE'
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ draft_no, username: user.username }),
        })
        const result = await response.json()
        if (response.ok) {
          logger.info('Delete draft API success', `DraftList`)
        } else {
          logger.warn(
            `Delete draft API failed with status ${response.status}`,
            `DraftList`
          )
          throw new Error('Failed to delete draft')
        }

        if (result.status === 'success') {
          Swal.fire({
            title: 'Deleted!',
            text: result.message,
            icon: 'success',
            customClass: 'h3',
          })
        }
        setDrafts((prev) => prev.filter((d) => d.draft_no !== draft_no))
      }
    })
  }

  useEffect(() => {
    if (!router.isReady) return // 確保 route 準備好再執行
    logger.info('Enter Compare DraftList Page', `DraftList`)
    const isMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
    if (!user) return

    const getDrafts = async () => {
      const { username } = user
      const dataDB = await getCompareDataDraft(username)
      if (error) return <p>Error: {error.message}</p>
      setDrafts(dataDB.data)
    }
    getDrafts()
  }, [router.isReady, user])

  return (
    <div className="container py-4">
      <CButton
        color="primary"
        size="lg"
        className="btn-ph-primary mb-4 h4"
        onClick={handleCreateDraft}
      >
        新增申請單
      </CButton>
      <h2 className="h3 fw-bold mb-4">📝 我的草稿</h2>

      {drafts.length === 0 ? (
        <p className="text-muted">目前沒有任何草稿。</p>
      ) : (
        <div className="row g-4">
          {drafts.map((draft) => (
            <div className="col-12 col-md-6 col-lg-4" key={draft.draft_no}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <p className="text-muted mb-1">草稿編號：{draft.draft_no}</p>
                  <p className="mb-1">
                    <strong>更新時間：</strong>{' '}
                    {new Date(draft.updated_at).toLocaleString()}
                  </p>
                  <p className="mb-3">Memo：{draft.memo}</p>
                  <div className="d-flex gap-2">
                    <CButton
                      size="lg"
                      className="btn-ph-primary"
                      onClick={() => handleEdit(draft.draft_no)}
                    >
                      Edit
                    </CButton>
                    <CButton
                      size="lg"
                      className="btn-danger"
                      onClick={() => handleDelete(draft.draft_no)}
                    >
                      Del
                    </CButton>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
