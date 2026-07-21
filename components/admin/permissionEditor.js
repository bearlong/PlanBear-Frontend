// pages/index.js
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
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
import { api } from '@/utils/api'
import { logger } from '@/utils/logger'
import Pagination from '../common/pagination'
import DeptTree from '../common/deptTree'

export default function PermissionEditor() {
  const router = useRouter()
  // 處理切換狀態
  const [activeGroup, setActiveGroup] = useState('')
  const [groups, setGroup] = useState([])
  const [visibles, setVisibles] = useState({
    member: false,
    dept: false,
    edit: false,
  })
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const [permissions, setPermissions] = useState({
    vendor_compare_application: {
      print: true,
      export: false,
      edit: true,
      delete: false,
    },
    vendor_compare_application_manager: {
      print: true,
      export: true,
      edit: false,
      delete: false,
    },
    vendor_query: { print: true, export: true, edit: false, delete: false },
  })

  function openModal(type) {
    setVisibles((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, k === type]))
    )
  }

  function closeModal() {
    setVisibles((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, false]))
    )
  }

  function handleToggle(formCode, action) {
    setPermissions((prev) => ({
      ...prev,
      [formCode]: {
        ...prev[formCode],
        [action]: !prev[formCode]?.[action],
      },
    }))
  }

  const handleSearch = async (query, type, page = 1) => {
    if (!query) {
      console.log('請輸入搜尋關鍵字')
      return
    }
    try {
      const url = api(`/${type}/select-options?query=${query}&page=${page}`)
      logger.info(`Member Select : ${url}`, `Editor`)
      const method = 'GET'
      const response = await fetch(url, {
        method,
        credentials: 'include',
      })
      const result = await response.json()
      if (response.ok) {
        logger.info(`${url} API success`, `Editor`)
      } else {
        logger.warn(
          ` ${url} API failed with status ${response.status}`,
          `Editor`
        )
        throw new Error(`Failed to fetch ${url}`)
      }
      if (result.status === 'success') {
        setPage(page)
        setTotalPages(result.totalPages || 0)
        setSearchResults(result.data)
      } else {
        console.log('failed to search member:', result.message)
      }
    } catch (error) {
      logger.error('test', `editor`, error)
    }
  }

  const handleInputKeyDown = (e, type) => {
    if (e.key === 'Enter') {
      handleSearch(e.target.value, type, 1)
      setQuery(e.target.value)
    }
  }

  const handleSearchInit = () => {
    setQuery('')
    setSearchResults([])
    setPage(1)
    setTotalPages(0)
  }

  function handleSaveChanges() {
    console.log('送出權限資料：', permissions)
    // 可送到後端 API or Supabase RPC
  }

  useEffect(() => {
    if (!router.isReady) return
    const getModules = async () => {
      const url = api('/permission/modules')
      logger.info(`Get Modules : ${url}`, `Editor`)
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      const result = await response.json()
      if (response.ok) {
        logger.info(`${url} API success`, `Editor`)
        // 處理模組資料
        setGroup(result.data || [])
      } else {
        logger.warn(
          `${url} API failed with status ${response.status}`,
          `Editor`
        )
        throw new Error(`Failed to fetch ${url}`)
      }
    }
    getModules()
  }, [router.isReady])

  return (
    <>
      {/* 標題區塊 */}
      <h1 className="fw-bold text-center primary d-flex justify-content-center align-items-center mb-4">
        <Image
          className="me-2"
          src="/img/logo.png"
          width={30}
          height={30}
          alt="logo"
        />
        Permission Editor
      </h1>
      <div className="card shadow-sm p-4">
        <div className="d-flex justify-content-between p-3">
          <h3 className="mb-3">模組權限設定</h3>
          <div className="d-flex justify-content-between p-3">
            <CForm className="d-none d-lg-flex center-flex">
              <CFormInput
                className="me-2"
                type="search"
                placeholder="Search"
                size="lg"
                disabled
                title="coming soon"
              />
              <CButton
                type="submit"
                color="success"
                variant="outline"
                className="btn-ph-outline-primary me-3"
                size="lg"
                disabled
                title="coming soon"
              >
                <FaMagnifyingGlass size={16} />
              </CButton>
            </CForm>

            <CButton
              color="success"
              className="btn-ph-primary p me-3"
              onClick={() => {
                openModal('dept')
              }}
            >
              新增角色
            </CButton>
            <CButton
              color="success"
              className="btn-ph-primary p me-3"
              onClick={() => {
                openModal('dept')
              }}
            >
              新增部門
            </CButton>
            <CButton
              color="success"
              className="btn-ph-primary p"
              onClick={() => {
                openModal('member')
              }}
            >
              新增人員
            </CButton>
          </div>
        </div>
        <div className="d-flex justify-content-start gap-5">
          <div className="card shadow-sm" style={{ width: '300px' }}>
            <div className="list-group p">
              {groups.map((group, i) => (
                <button
                  key={i}
                  onClick={() => setActiveGroup(group.code)}
                  className={`list-group-item list-group-item-action ${
                    activeGroup === group.code ? 'active' : ''
                  }`}
                >
                  {group.code}
                </button>
              ))}
            </div>
          </div>
          <div className="card shadow-sm w-100">
            <div className="p row p-3">
              <div className="col-lg-3">
                <div className="border-bottom border-2 border-secondary">
                  Code
                </div>
                <div className="py-2">Z101TPD10</div>
                <div className="py-2">C0CI00T</div>
                <div className="py-2">8892</div>
              </div>
              <div className="col-lg-2">
                <div className="border-bottom border-2 border-secondary">
                  Type
                </div>
                <div className="py-2">Dept.</div>
                <div className="py-2">Dept.</div>
                <div className="py-2">user</div>
              </div>
              <div className="col-lg-6">
                <div className="border-bottom border-2 border-secondary">
                  Name
                </div>
                <div className="py-2">採購部</div>
                <div className="py-2">採購管理部</div>
                <div className="py-2">Bear Shen 沈正龍</div>
              </div>
              <div className="col-lg-1">
                <div className="border-bottom border-2 border-secondary">
                  Edit
                </div>
                <div className="center-flex py-2">
                  <CButton
                    color="secondary"
                    className={`center-flex`}
                    onClick={(e) => {
                      e.stopPropagation()
                      openModal('edit')
                    }}
                  >
                    編輯
                  </CButton>
                </div>
                <div className="center-flex py-2">
                  <CButton
                    color="secondary"
                    className={`center-flex`}
                    onClick={(e) => {
                      e.stopPropagation()
                      openModal('edit')
                    }}
                  >
                    編輯
                  </CButton>
                </div>
                <div className="center-flex py-2">
                  <CButton
                    color="secondary"
                    className={`center-flex`}
                    onClick={(e) => {
                      e.stopPropagation()
                      openModal('edit')
                    }}
                  >
                    編輯
                  </CButton>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CModal
          alignment="center"
          scrollable
          visible={visibles.dept}
          onClose={() => {
            closeModal()
            handleSearchInit()
          }}
          size="lg"
          aria-labelledby="VerticallyCenteredScrollableExample2"
        >
          <CModalHeader>
            <CModalTitle id="VerticallyCenteredScrollableExample2">
              <span className="fw-bold h3">新增部門</span>
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <DeptTree />
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                closeModal()
                handleSearchInit()
              }}
            >
              Close
            </CButton>
            <CButton color="primary">Save changes</CButton>
          </CModalFooter>
        </CModal>
        <CModal
          alignment="center"
          scrollable
          visible={visibles.member}
          onClose={() => {
            closeModal()
            handleSearchInit()
          }}
          size="lg"
          aria-labelledby="VerticallyCenteredScrollableExample2"
        >
          <CModalHeader>
            <CModalTitle id="VerticallyCenteredScrollableExample2">
              <span className="fw-bold h3">採購部/Z101TPD10</span>
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CFormInput
              onChange={(e) => {
                setQuery(e.target.value)
              }}
              onKeyDown={(e) => handleInputKeyDown(e, 'users')}
              value={query}
              size="lg"
            />
            <CButton
              color="secondary"
              className={`center-flex`}
              onClick={(e) => {
                e.stopPropagation()
                handleSearch(query, 'users')
              }}
            >
              Search Users
            </CButton>
            {searchResults &&
              searchResults.map((member, index) => {
                return (
                  <div key={index} className="py-2 h5">
                    {member.ename && (
                      <span className="fw-bold text-secondary">
                        {member.ename} -{' '}
                      </span>
                    )}
                    <span className="fw-bold">{member.fullname}</span> (
                    <span className="fw-bold">
                      {member.username}, {member.dept_name}, {member.dept}
                    </span>
                    )
                  </div>
                )
              })}
            <Pagination
              totalPages={totalPages}
              page={page}
              onPageChange={(newPage) => handleSearch(query, 'users', newPage)}
            />
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                closeModal()
                handleSearchInit()
              }}
            >
              Close
            </CButton>
            <CButton color="primary">Save changes</CButton>
          </CModalFooter>
        </CModal>
        <CModal
          alignment="center"
          scrollable
          visible={visibles.edit}
          onClose={() => {
            closeModal()
            handleSearchInit()
          }}
          size="xl"
          aria-labelledby="VerticallyCenteredScrollableExample2"
        >
          <CModalHeader>
            <CModalTitle id="VerticallyCenteredScrollableExample2">
              <span className="fw-bold h3">採購部/Z101TPD10</span>
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="table-responsive">
              <table className="table table-bordered text-center align-middle">
                <thead className="table-light h4">
                  <tr>
                    <th>表單名稱</th>
                    <th>列印</th>
                    <th>匯出</th>
                    <th>編輯</th>
                    <th>刪除</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      form: 'Vendor Compare Price Application',
                      code: 'vendor_compare_application',
                    },
                    {
                      form: 'Vendor Compare Price Application Query By Manager',
                      code: 'vendor_compare_application_manager',
                    },
                    { form: 'Query Viewer', code: 'vendor_query' },
                  ].map((f, idx) => (
                    <tr key={idx}>
                      <td className="text-start p">{f.form}</td>
                      {['print', 'export', 'edit', 'delete'].map(
                        (action, i) => (
                          <td key={i}>
                            <input
                              type="checkbox"
                              checked={!!permissions[f.code]?.[action]}
                              onChange={() => handleToggle(f.code, action)}
                            />
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => closeModal()}>
              Close
            </CButton>
            <CButton color="primary">Save changes</CButton>
          </CModalFooter>
        </CModal>
        {/* 內容區塊 */}
        <div className="mt-4 text-center">
          <h5>目前選擇群組：{activeGroup}</h5>
          {/* 權限模組呈現區，可根據 activeGroup 動態切換 */}
        </div>
      </div>
      <DeptTree />
    </>
  )
}
