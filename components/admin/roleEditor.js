// pages/index.js
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import {
  CButton,
  CForm,
  CFormInput,
  CFormCheck,
  CListGroup,
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

export default function RoleEditor() {
  const router = useRouter()
  // 處理切換狀態
  const [activeGroup, setActiveGroup] = useState('')
  const [groups, setGroup] = useState([])
  const [groupDetail, setGroupDetail] = useState([])
  const [visibles, setVisibles] = useState({
    member: false,
    dept: false,
    edit: false,
  })
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedDept, setSelectedDept] = useState([])
  const [selectedUser, setSelectedUser] = useState([])
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
    if (type === 'member') {
    } else if (type === 'dept') {
      const selectedDepts = groupDetail
        .filter((item) => item.type === 'dept')
        .map((item) => {
          {
            return { dept: item.dept, dept_name: item.dept_name }
          }
        })

      setSelectedDept(selectedDepts)
    }
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

  // const handleGetDeptTree = async () => {
  //   try {
  //     const url = api('/depts/dept-tree')
  //     logger.info(`Get Dept Tree : ${url}`, `Editor`)
  //     const response = await fetch(url, {
  //       method: 'GET',
  //       credentials: 'include',
  //     })
  //     const result = await response.json()
  //     if (response.ok) {
  //       logger.info(`${url} API success`, `Editor`)
  //       const treeData = buildDeptTree(result.data)
  //       console.log(JSON.stringify(treeData, null, 2))
  //       setSearchResults(result.data)
  //     } else {
  //       logger.warn(
  //         `${url} API failed with status ${response.status}`,
  //         `Editor`
  //       )
  //       throw new Error(`Failed to fetch ${url}`)
  //     }
  //   } catch (error) {
  //     logger.error('test', `editor`, error)
  //   }
  // }

  // function buildDeptTree(list, root = 'TOP') {
  //   return list
  //     .filter((item) => item.up_dept === root)
  //     .map((item) => ({
  //       ...item,
  //       children: buildDeptTree(list, item.dept),
  //     }))
  // }

  function handleChangeGroup(roleCode) {
    setActiveGroup(roleCode)
    getRoleDetails(roleCode)
    logger.info(`Change active group to ${roleCode}`, `Editor`)
  }

  const getRoleDetails = async (roleCode) => {
    const url = api(`/permission/roles/${roleCode}`)
    logger.info(`Get Role Details : ${url}`, `Editor`)
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })
    const result = await response.json()
    if (response.ok) {
      logger.info(`${url} API success`, `Editor`)
      console.log(result.data)

      setGroupDetail(result.data || [])
    } else {
      logger.warn(`${url} API failed with status ${response.status}`, `Editor`)
      throw new Error(`Failed to fetch ${url}`)
    }
  }

  function handleSaveChanges() {
    console.log('送出權限資料：', permissions)
    // 可送到後端 API or Supabase RPC
  }

  useEffect(() => {
    if (!router.isReady) return
    const getRoles = async () => {
      const url = api('/permission/roles')
      logger.info(`Get Roles : ${url}`, `Editor`)
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
    getRoles()
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
        Role Editor
      </h1>
      <div className="card shadow-sm p-4">
        <div className="d-flex justify-content-between p-3">
          <h3 className="mb-3 fw-bold">Role Setting</h3>
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
                // handleGetDeptTree()
              }}
            >
              Add Dept.
            </CButton>
            <CButton
              color="success"
              className="btn-ph-primary p"
              onClick={() => {
                openModal('member')
              }}
            >
              Add User
            </CButton>
          </div>
        </div>
        <div className="d-flex justify-content-start gap-5">
          <div className="card shadow-sm" style={{ width: '300px' }}>
            <div className="list-group p">
              {groups.length &&
                groups.map((group) => (
                  <button
                    key={group.role_code}
                    onClick={() => {
                      handleChangeGroup(group.role_code)
                    }}
                    className={`list-group-item list-group-item-action ${
                      activeGroup === group.code ? 'active' : ''
                    }`}
                  >
                    {group.role_code}
                  </button>
                ))}
            </div>
          </div>
          <div className="card shadow-sm w-100">
            <div className="p row p-3">
              {/* Code 欄 */}
              <div className="col-lg-3">
                <div className="border-bottom border-2 border-secondary">
                  Code
                </div>
                {groupDetail.map((item, index) => (
                  <div className="py-2" key={`code-${index}`}>
                    {item.dept || item.username}
                  </div>
                ))}
              </div>

              {/* Type 欄 */}
              <div className="col-lg-2">
                <div className="border-bottom border-2 border-secondary">
                  Type
                </div>
                {groupDetail.map((item, index) => (
                  <div className="py-2" key={`type-${index}`}>
                    {item.type}
                  </div>
                ))}
              </div>

              {/* Name 欄 */}
              <div className="col-lg-6">
                <div className="border-bottom border-2 border-secondary">
                  Name
                </div>
                {groupDetail.map((item, index) => (
                  <div className="py-2" key={`name-${index}`}>
                    {item.dept_name || item.name}
                  </div>
                ))}
              </div>
              <div className="col-lg-1 d-flex flex-column justify-content-between">
                <div className="border-bottom border-2 border-secondary">
                  Edit
                </div>
                {groupDetail.map((item, index) => (
                  <CButton
                    className="my-2 d-flex justify-content-center align-items-center"
                    key={`name-${index}`}
                    color="danger"
                  >
                    <span className="h6">Del</span>
                  </CButton>
                ))}
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
          aria-labelledby="adddept"
          backdrop="static"
        >
          <CModalHeader>
            <CModalTitle id="adddept">
              <span className="fw-bold h3">Add Department</span>
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="row">
              <div className="col-lg-6">
                <strong className="p">Search:</strong>

                <CFormInput
                  className="mb-2"
                  onChange={(e) => {
                    setQuery(e.target.value)
                  }}
                  onKeyDown={(e) => handleInputKeyDown(e, 'depts')}
                  value={query}
                  size="lg"
                />
                <CButton
                  color="secondary"
                  className={`center-flex p`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSearch(query, 'depts')
                  }}
                >
                  Search Dept
                </CButton>
                {searchResults &&
                  searchResults.map((depts, index) => {
                    return (
                      <CFormCheck
                        key={index}
                        className="h5"
                        id={`${depts.dept}`}
                        label={`${depts.dept_name} ${depts.dept}`}
                        checked={selectedDept.some(
                          (item) => item.dept === depts.dept
                        )}
                        onChange={() => {
                          const exists = selectedDept.some(
                            (item) => item.dept === depts.dept
                          )
                          if (exists) {
                            setSelectedDept(
                              selectedDept.filter(
                                (item) => item.dept !== depts.dept
                              )
                            )
                          } else {
                            setSelectedDept([
                              ...selectedDept,
                              { dept: depts.dept, dept_name: depts.dept_name },
                            ])
                          }
                        }}
                      />
                    )
                  })}
                <Pagination
                  totalPages={totalPages}
                  page={page}
                  onPageChange={(newPage) =>
                    handleSearch(query, 'depts', newPage)
                  }
                />
              </div>
              <div className="col-lg-6" style={{ minHeight: '530px' }}>
                <strong className="p">Selected Departments:</strong>
                <div className="overflow-auto" style={{ maxHeight: '480px' }}>
                  {selectedDept.length > 0 && (
                    <div className="mb-3 p">
                      <ul className="list-group">
                        {selectedDept.map((item, index) => (
                          <li
                            key={index}
                            className="list-group-item cursor-pointer"
                            onClick={() => {
                              setSelectedDept(
                                selectedDept.filter(
                                  (dept) => dept.dept !== item.dept
                                )
                              )
                            }}
                          >
                            {item.dept + ' - ' + item.dept_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
          aria-labelledby="addmember"
          backdrop="static"
        >
          <CModalHeader>
            <CModalTitle id="addmember">
              <span className="fw-bold h3">Add User</span>
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CFormInput
              className="mb-2"
              onChange={(e) => {
                setQuery(e.target.value)
              }}
              onKeyDown={(e) => handleInputKeyDown(e, 'users')}
              value={query}
              size="lg"
            />
            <CButton
              color="secondary"
              className={`center-flex p`}
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

        {/* 內容區塊 */}
        <div className="mt-4 text-center">
          <h5 className="fw-bold">Selected role：{activeGroup}</h5>
          {/* 權限模組呈現區，可根據 activeGroup 動態切換 */}
        </div>
      </div>
    </>
  )
}
