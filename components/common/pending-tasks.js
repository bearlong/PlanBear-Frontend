import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { AuthContext } from '@/context/AuthContext'
import { api } from '@/utils/api'
import { logger } from '@/utils/logger'
import { useMemo, useState, useEffect, useContext } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CFormInput,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import { FadeLoader } from 'react-spinners'
import styles from '@/styles/homePage.module.scss'

export default function PendingTasks() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [todos, setTodos] = useState([])
  const [keyword, setKeyword] = useState('')
  const { user } = useContext(AuthContext)
  const router = useRouter()

  const fetchPendingTasks = async () => {
    setLoading(true)
    setError(null)
    logger.info(`Fetching Pending Tasks`, 'PendingTasks')
    try {
      const url = api(`/pending-task?username=${user.username}`)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (response.ok) {
        logger.info(`Success: ${url}`, 'PendingTasks')
      } else {
        logger.warn(`Failed with status ${response.status}`, 'PendingTasks')
        throw new Error('Failed to fetch Pending Task')
      }

      if (result.status == 'success') {
        console.log(result.data)
        return result.data
      } else {
        throw new Error('Failed to fetch Pending Task')
      }

      // Process data as needed
    } catch (err) {
      setError(err.message || 'Unknown error')
      logger.error(
        `Error fetching Pending Task: ${err.message}`,
        'PendingTasks'
      )
      return []
    } finally {
      setLoading(false)
    }
  }

  const filteredTodos = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return todos
    return todos.filter((todo) => {
      const haystack = [
        todo.ref_id,
        todo.title,
        todo.model,
        todo.username,
        todo.user_displayname,
        todo.memo,
        todo.create_date,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [keyword, todos])

  const groupedByModel = useMemo(() => {
    return filteredTodos.reduce((acc, todo) => {
      acc[todo.model] = acc[todo.model] ? [...acc[todo.model], todo] : [todo]
      return acc
    }, {})
  }, [filteredTodos])

  const hasResults = filteredTodos.length > 0

  useEffect(() => {
    if (!router.isReady) return // 確保 route 準備好再執行
    if (!user) return
    const getPendingTasks = async () => {
      const dataDB = await fetchPendingTasks()

      if (error) return <p>Error: {error.message}</p>
      setTodos(dataDB)
      setLoading(false)
    }
    getPendingTasks()
  }, [router.isReady, user])

  return (
    <>
      {loading ? (
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
      ) : (
        <div className={styles.moduleFrame}>
          <CCard className={`${styles.heroCard} mb-3`}>
            <CCardBody className="d-flex flex-column flex-md-row align-items-md-center justify-content-between">
              <div>
                <p
                  className={`text-uppercase small mb-1 h2 fw-bold ${styles.subtleLabel}`}
                >
                  Pending Tasks
                </p>
              </div>
              <CBadge className={styles.counterBadge}>
                <span className="h6 fw-bold">{filteredTodos.length} items</span>
              </CBadge>
            </CCardBody>
          </CCard>

          <div className={styles.moduleSearch}>
            <CInputGroup>
              <CInputGroupText>
                <i className="bi bi-search p" aria-hidden />
              </CInputGroupText>
              <CFormInput
                placeholder="Search by ID, Title, Module, Applicant, or Note"
                value={keyword}
                className="p"
                onChange={(e) => setKeyword(e.target.value)}
              />
            </CInputGroup>
            <span className="text-muted small h6">
              Filtered: {filteredTodos.length} items
            </span>
          </div>

          {hasResults ? (
            <CAccordion>
              {Object.entries(groupedByModel).map(([model, items], index) => (
                <CAccordionItem
                  itemKey={index}
                  key={model}
                  className={` accordionHeader`}
                >
                  <CAccordionHeader className="bg-danger">
                    {model}
                  </CAccordionHeader>
                  <CAccordionBody>
                    <div className={styles.taskCard}>
                      <div className={`${styles.taskHeader} p`}>
                        <span className="fw-semibold text-muted">Task</span>
                        <span className="fw-semibold text-muted">Note</span>
                        <span className="fw-semibold text-muted">
                          Start Date
                        </span>
                      </div>
                      <div className={styles.taskList}>
                        {items.map((todo) => {
                          return (
                            <div key={todo.id} className={styles.taskRow}>
                              <div className={styles.taskInfo}>
                                <div>
                                  <div className={`${styles.taskTitle} p`}>
                                    {todo.ref_id}
                                  </div>
                                  <div className="text-muted small h6 fw-semibold">
                                    {todo.title}
                                  </div>
                                  <div className="text-muted small h6 fw-semibold">
                                    {todo.username +
                                      ' ' +
                                      todo.user_displayname}
                                  </div>
                                </div>
                              </div>
                              <div className={`${styles.memo} p`}>
                                {todo.memo}
                              </div>
                              <div>
                                <span className="fw-semibold p">
                                  {todo.create_date}
                                </span>
                              </div>

                              <div className={'d-flex justify-content-center'}>
                                <Link
                                  href={todo.url}
                                  className="text-decoration-none"
                                >
                                  <CButton
                                    color="primary"
                                    variant="ghost"
                                    className="btn-ph-outline-primary"
                                    size="sm"
                                  >
                                    View Details
                                  </CButton>
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CAccordionBody>
                </CAccordionItem>
              ))}
            </CAccordion>
          ) : (
            <div className={`${styles.tableWrap} ${styles.emptyState}`}>
              <div className="text-center text-muted py-4 p">
                No tasks to display.
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
