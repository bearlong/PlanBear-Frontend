import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CForm,
  CFormCheck,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CNav,
  CNavItem,
  CNavLink,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CPlaceholder,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import {
  FiChevronDown,
  FiChevronUp,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
} from 'react-icons/fi'
import Swal from 'sweetalert2'
import ClientOnly from '@/components/common/clientOnly'
import { useToast } from '@/hooks/useToast'
import styles from '@/styles/notice-member-list.module.scss'
import { noticeMemberListService } from '@/services/Calibration/noticeMemberList.service'
import DeptTree from '@/components/common/deptTree'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const initialMemberForm = {
  username: '',
  name: '',
  dept_code: '',
  factory_code: '',
  mail_role: 'to',
}

const mailRoleLabel = {
  0: 'TO',
  1: 'CC',
}

const roleColor = {
  0: 'primary',
  1: 'secondary',
}

const normalizeMailRole = (value) => {
  if (value === 0 || value === '0' || value === 'to') return 'to'
  if (value === 1 || value === '1' || value === 'cc') return 'cc'
  return ''
}

const buildUniqueOptions = (items, key) => {
  const set = new Set()
  items.forEach((item) => {
    const value = item?.[key]
    if (value) set.add(value)
  })
  return Array.from(set).map((value) => ({ code: value, name: value }))
}

const normalizeNoticeMemberForView = (member) => {
  if (!member) return null
  return {
    ...member,
    id:
      member.id ??
      `${member.username || 'member'}-${member.dept || ''}-${
        member.factory || ''
      }-${member.use_level ?? ''}`,
    username: member.username?.toString() ?? '',
    name: member.name || member.fullname || '',
    dept: member.dept || '',
    factory: member.factory || '',
    use_level:
      member.use_level === null || member.use_level === undefined
        ? ''
        : member.use_level.toString(),
    cc:
      member.cc === true ||
      member.cc === 1 ||
      member.cc === '1' ||
      member.cc === 'true',
  }
}

export default function NoticeMemberListPage() {
  usePermissionGuard('Calibration')
  const [tab, setTab] = useState('all')
  const [factoryCode, setFactoryCode] = useState('all')
  const [deptCode, setDeptCode] = useState('')
  const [query, setQuery] = useState('')
  const [mailRoleFilter, setMailRoleFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  })
  const [allMembers, setAllMembers] = useState([])
  const levelOneMembers = useMemo(
    () => allMembers.filter((m) => m.use_level?.toString() === '1'),
    [allMembers]
  )
  // Use level 1 data to build dynamic options for filters and add form.
  const factoryOptions = useMemo(
    () => buildUniqueOptions(levelOneMembers, 'factory'),
    [levelOneMembers]
  )
  const deptOptions = useMemo(
    () => buildUniqueOptions(levelOneMembers, 'dept'),
    [levelOneMembers]
  )
  const members = useMemo(() => {
    const targetLevel = tab === 'all' ? '0' : '1'
    return allMembers.filter((m) => m.use_level?.toString() === targetLevel)
  }, [allMembers, tab])

  const [showAddModal, setShowAddModal] = useState(false)
  const [newMember, setNewMember] = useState(initialMemberForm)
  const [formErrors, setFormErrors] = useState({})
  const toast = useToast()

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return members.filter((member) => {
      if (tab === 'single') {
        if (deptCode && deptCode !== 'all' && member.dept !== deptCode)
          return false
        if (factoryCode !== 'all' && member.factory !== factoryCode) {
          return false
        }
        if (mailRoleFilter !== 'all') {
          const mailRole = mailRoleFilter === 'to' ? false : true
          if (Boolean(member.cc) !== mailRole) return false
        }
      }
      if (normalizedQuery) {
        const email = `${member.username}@ph.local`.toLowerCase()
        const haystack =
          `${member.username} ${member.name} ${email}`.toLowerCase()
        if (!haystack.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [members, tab, deptCode, factoryCode, mailRoleFilter, query])

  const sortedMembers = useMemo(() => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1
    return [...filteredMembers].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''
      return (
        aValue.toString().localeCompare(bValue.toString(), 'en', {
          sensitivity: 'base',
        }) * direction
      )
    })
  }, [filteredMembers, sortConfig])

  const selectedOnPage = sortedMembers.filter((member) =>
    selectedIds.includes(member.id)
  )
  const isAllSelectedOnPage =
    selectedOnPage.length > 0 && selectedOnPage.length === sortedMembers.length

  const fetchCalibrationMembers = async () => {
    try {
      setLoading(true)
      const result = await noticeMemberListService.getNoticeMemberLists()
      console.log('Fetched members:', result.data)
      setAllMembers(
        (Array.isArray(result.data) ? result.data : [])
          .map(normalizeNoticeMemberForView)
          .filter(Boolean)
      )
    } catch (error) {
      setErrorMessage('Failed to load members. Please try again.')
      toast.error('Failed to load members. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  const handleSelectAll = () => {
    if (isAllSelectedOnPage) {
      setSelectedIds((prev) =>
        prev.filter((id) => !sortedMembers.some((member) => member.id === id))
      )
    } else {
      const nextIds = sortedMembers.map((member) => member.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...nextIds])))
    }
  }

  const handleToggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return {
        key,
        direction: 'asc',
      }
    })
  }

  const handleOpenAdd = () => {
    setFormErrors({})
    setNewMember((prev) => ({
      ...initialMemberForm,
      dept_code:
        tab === 'single'
          ? deptCode && deptCode !== 'all'
            ? deptCode
            : deptOptions[0]?.code || prev.dept_code
          : deptOptions[0]?.code || prev.dept_code,
      factory_code:
        factoryCode && factoryCode !== 'all'
          ? factoryCode
          : factoryOptions[0]?.code || prev.factory_code,
    }))
    setShowAddModal(true)
  }

  const handleAddChange = (field) => (event) => {
    setNewMember((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = {}
    if (!selectedNode || selectedNode?.type.trim() !== 'user')
      nextErrors.username = 'Please select a user.'

    if (Object.keys(nextErrors).length > 0) {
      Object.values(nextErrors).forEach((msg) => {
        toast.error(msg)
      })
      setFormErrors(nextErrors)
      return
    }

    // Add member to the existing in-memory list (no API yet).
    const createdMember = {
      username: selectedNode.username.trim(),
      name: selectedNode.fullname.trim(),
      dept: selectedNode.dept,
      use_level: tab === 'all' ? '0' : '1',
      cc: tab === 'all' ? true : newMember.mail_role === 'cc',
    }

    console.log(createdMember)
    const result = await noticeMemberListService.addNoticeMembers(createdMember)
    if (result.status === 'error') {
      toast.error('Failed to add member.')
      return
    } else if (result.status === 'duplicate') {
      toast.error('Member already exists.')
      return
    }

    const nextMember = normalizeNoticeMemberForView(
      result.data || createdMember
    )
    setAllMembers((prev) => [nextMember, ...prev])
    toast.success('Member added successfully')
    setSelectedNode(null)
    setShowAddModal(false)
  }
  const handleBulkUpdate = (role) => {
    try {
      const updateData = selectedIds.map((id) => {
        const member = allMembers.find((m) => m.id === id)
        if (!member) throw new Error(`Member not found: ${id}`)
        return {
          id,
          cc: role,
        }
      })
      const result = noticeMemberListService.updateNoticeMembers(
        'batch',
        updateData
      )
      setAllMembers((prev) =>
        prev.map((member) =>
          selectedIds.includes(member.id) ? { ...member, cc: role } : member
        )
      )
      toast.success('Mail role updated successfully')
      setSelectedIds([])
    } catch (error) {
      toast.error('Failed to update mail role.')
    }
  }

  const handleConfirmDeleteRow = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Remove selected members from the notice list?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      customClass: {
        popup: 'p',
      },
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    })

    return result.isConfirmed
  }
  const handleDeleteMembers = async (memberIds) => {
    if (!memberIds.length) return
    const shouldDelete = await handleConfirmDeleteRow()
    console.log('Delete confirmation result:', shouldDelete)
    if (!shouldDelete) return

    try {
      await noticeMemberListService.deleteNoticeMembers(memberIds)

      setAllMembers((prev) =>
        prev.filter((member) => !memberIds.includes(member.id))
      )

      setSelectedIds((prev) => prev.filter((id) => !memberIds.includes(id)))
      toast.success('Members removed successfully')
    } catch (error) {
      toast.error('Failed to remove members.')
    }
  }

  const handleSingleUpdate = (memberId, role) => {
    try {
      const updatedMember = allMembers.find((m) => m.id === memberId)
      if (!updatedMember) throw new Error('Member not found')
      const result = noticeMemberListService.updateNoticeMembers(memberId, {
        ...updatedMember,
        cc: role,
      })
      if (result.status === 'error') {
        toast.error('Failed to update mail role.')
        return
      }
      setAllMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, cc: role } : member
        )
      )
      toast.success('Mail role updated successfully')
    } catch (error) {
      console.log(error)
      toast.error('Failed to update mail role.')
    }
  }

  const handleClearFilters = () => {
    setFactoryCode('all')
    setDeptCode(tab === 'single' ? 'all' : '')
    setQuery('')
    setMailRoleFilter('all')
  }

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <FiChevronDown className={styles.sortIcon} />
    return sortConfig.direction === 'asc' ? (
      <FiChevronUp className={styles.sortIcon} />
    ) : (
      <FiChevronDown className={styles.sortIcon} />
    )
  }

  useEffect(() => {
    fetchCalibrationMembers()
  }, [])

  useEffect(() => {
    if (tab === 'all') {
      setNewMember((prev) =>
        prev.mail_role === 'cc' ? prev : { ...prev, mail_role: 'cc' }
      )
    }
  }, [tab])

  useEffect(() => {
    setSelectedIds([])
    if (tab === 'single') {
      // Keep filters in a valid state when switching tabs.
      if (!deptCode) setDeptCode('all')
      if (!factoryCode) setFactoryCode('all')
    }
  }, [tab, deptCode, factoryCode])

  return (
    <>
      <Head>
        <title>Calibration Notice Member List</title>
      </Head>
      <CContainer fluid className={styles.pageShell}>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardHeader className={styles.cardHeader}>
              <div>
                <p className={styles.eyebrow}>Calibration</p>
                <h2 className={styles.title}>
                  Notification Settings / 儀校通知人員名單
                </h2>
              </div>
            </CCardHeader>
            <CCardBody className={styles.cardBody}>
              <div className={`h4 ${styles.tabsRow}`}>
                <CNav variant="tabs" className={styles.tabs}>
                  <CNavItem>
                    <CNavLink
                      active={tab === 'all'}
                      onClick={() => setTab('all')}
                    >
                      All Departments（所有部門）
                    </CNavLink>
                  </CNavItem>
                  <CNavItem>
                    <CNavLink
                      active={tab === 'single'}
                      onClick={() => setTab('single')}
                    >
                      Single Department（單一部門）
                    </CNavLink>
                  </CNavItem>
                </CNav>
                <CButton
                  color="primary"
                  className="btn-ph-primary mb-3"
                  onClick={handleOpenAdd}
                  size="lg"
                >
                  <FiPlus />
                  Add Member
                </CButton>
              </div>

              <CForm
                className={`${styles.filterBar} ${
                  tab === 'all' ? styles.filterBarCompact : ''
                } h5`}
              >
                {tab === 'single' && (
                  <div className={styles.filterItem}>
                    <CFormLabel className={styles.filterLabel}>
                      Factory
                    </CFormLabel>
                    <CFormSelect
                      value={factoryCode}
                      onChange={(event) => setFactoryCode(event.target.value)}
                      size="lg"
                      className="p"
                    >
                      <option value="all">ALL</option>
                      {factoryOptions.map((factory) => (
                        <option key={factory.code} value={factory.code}>
                          {factory.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                )}

                {tab === 'single' && (
                  <div className={styles.filterItem}>
                    <CFormLabel className={`${styles.filterLabel}`}>
                      Department
                    </CFormLabel>
                    <CFormSelect
                      value={deptCode}
                      onChange={(event) => setDeptCode(event.target.value)}
                      size="lg"
                    >
                      <option value="all">ALL</option>
                      {deptOptions.map((dept) => (
                        <option key={dept.code} value={dept.code}>
                          {dept.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                )}

                <div className={styles.filterItemWide}>
                  <CFormLabel className={styles.filterLabel}>Search</CFormLabel>
                  <CInputGroup>
                    <CInputGroupText>
                      <FiSearch />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Search username / name "
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      size="lg"
                    />
                  </CInputGroup>
                </div>

                {tab === 'single' && (
                  <div className={styles.filterItem}>
                    <CFormLabel className={styles.filterLabel}>
                      Mail Role
                    </CFormLabel>
                    <CFormSelect
                      value={mailRoleFilter}
                      onChange={(event) =>
                        setMailRoleFilter(event.target.value)
                      }
                      size="lg"
                    >
                      <option value="all">All</option>
                      <option value="to">To</option>
                      <option value="cc">CC</option>
                    </CFormSelect>
                  </div>
                )}

                {tab === 'single' && (
                  <div className={styles.filterActions}>
                    <CButton
                      color="secondary"
                      variant="outline"
                      className={`${styles.clearBtn} p`}
                      onClick={handleClearFilters}
                    >
                      Clear
                    </CButton>
                  </div>
                )}
              </CForm>

              {selectedIds.length > 0 && (
                <div className={`${styles.bulkActions} p`}>
                  <div className={styles.bulkInfo}>
                    {selectedIds.length} selected
                  </div>
                  <div className={styles.bulkButtons}>
                    <CButton
                      color="primary"
                      className="btn-ph-primary"
                      onClick={() => handleBulkUpdate(false)}
                      size="lg"
                      disabled={tab === 'all'}
                    >
                      Set as Mail To
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={() => handleBulkUpdate(true)}
                      size="lg"
                      disabled={tab === 'all'}
                    >
                      Set as Mail CC
                    </CButton>
                    <CButton
                      color="danger"
                      variant="outline"
                      onClick={() => handleDeleteMembers(selectedIds)}
                    >
                      Remove Member
                    </CButton>
                  </div>
                </div>
              )}

              <div>
                <div className={styles.tableWrap}>
                  <CTable hover responsive className={`${styles.table} p`}>
                    <CTableHead className="h4">
                      <CTableRow>
                        <CTableHeaderCell className={styles.checkboxCell}>
                          <CFormCheck
                            checked={isAllSelectedOnPage}
                            onChange={handleSelectAll}
                          />
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className={`${styles.sortable} h4`}
                          onClick={() => handleSort('name')}
                        >
                          User {renderSortIcon('name')}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className={`${styles.sortable} h4`}
                          onClick={() => handleSort('dept')}
                        >
                          Department {renderSortIcon('dept')}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className={`${styles.sortable} h4`}
                          onClick={() => handleSort('factory')}
                        >
                          Factory {renderSortIcon('factory')}
                        </CTableHeaderCell>
                        <CTableHeaderCell
                          className={`${styles.sortable} h4`}
                          onClick={() => handleSort('mail_role')}
                        >
                          Mail Role {renderSortIcon('mail_role')}
                        </CTableHeaderCell>
                        <CTableHeaderCell className={`${styles.actionCell} h4`}>
                          Actions
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {loading
                        ? Array.from({ length: 8 }).map((_, index) => (
                            <CTableRow key={`skeleton-${index}`}>
                              <CTableDataCell>
                                <CPlaceholder className={styles.placeholder} />
                              </CTableDataCell>
                              <CTableDataCell>
                                <CPlaceholder className={styles.placeholder} />
                              </CTableDataCell>
                              <CTableDataCell>
                                <CPlaceholder className={styles.placeholder} />
                              </CTableDataCell>
                              <CTableDataCell>
                                <CPlaceholder className={styles.placeholder} />
                              </CTableDataCell>
                              <CTableDataCell>
                                <CPlaceholder className={styles.placeholder} />
                              </CTableDataCell>
                              <CTableDataCell>
                                <CPlaceholder className={styles.placeholder} />
                              </CTableDataCell>
                            </CTableRow>
                          ))
                        : sortedMembers.map((member) => (
                            <CTableRow key={member.id}>
                              <CTableDataCell>
                                <CFormCheck
                                  checked={selectedIds.includes(member.id)}
                                  onChange={() => handleToggleRow(member.id)}
                                />
                              </CTableDataCell>
                              <CTableDataCell>
                                <div className={styles.userCell}>
                                  <div className={styles.userName}>
                                    {member.name}
                                  </div>
                                  <div className={styles.userMeta}>
                                    @{member.username}
                                  </div>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>{member.dept}</CTableDataCell>
                              <CTableDataCell>{member.factory}</CTableDataCell>
                              <CTableDataCell>
                                <CBadge
                                  color={roleColor[member.cc ? 1 : 0]}
                                  className={styles.roleBadge}
                                >
                                  {mailRoleLabel[member.cc ? 1 : 0]}
                                </CBadge>
                              </CTableDataCell>
                              <CTableDataCell>
                                <CDropdown alignment="end">
                                  <CDropdownToggle
                                    color="secondary"
                                    variant="ghost"
                                    className={styles.moreBtn}
                                  >
                                    <FiMoreHorizontal />
                                  </CDropdownToggle>
                                  <CDropdownMenu>
                                    <CDropdownItem
                                      onClick={() =>
                                        handleSingleUpdate(member.id, false)
                                      }
                                      className="p"
                                      disabled={tab === 'all'}
                                    >
                                      Set To
                                    </CDropdownItem>
                                    <CDropdownItem
                                      onClick={() =>
                                        handleSingleUpdate(member.id, true)
                                      }
                                      className="p"
                                      disabled={tab === 'all'}
                                    >
                                      Set CC
                                    </CDropdownItem>
                                    <CDropdownItem
                                      className={`p `}
                                      onClick={() =>
                                        handleDeleteMembers([member.id])
                                      }
                                    >
                                      Remove Member
                                    </CDropdownItem>
                                  </CDropdownMenu>
                                </CDropdown>
                              </CTableDataCell>
                            </CTableRow>
                          ))}
                    </CTableBody>
                  </CTable>
                  {!loading && sortedMembers.length === 0 && (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyTitle}>No members found</p>
                      <p className={styles.emptySubtitle}>
                        Try adjusting filters or search keywords.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className={styles.errorHint}>{errorMessage}</div>
              )}
            </CCardBody>
          </CCard>
        </div>
      </CContainer>

      {/* Add member modal keeps the existing in-memory list and UI flow intact. */}
      <ClientOnly>
        <CModal
          visible={showAddModal}
          onClose={() => {
            setShowAddModal(false)
            setSelectedNode(null)
          }}
          size="lg"
        >
          <CModalHeader>
            <h5 className="m-0 h4 fw-bold">Add Member</h5>
          </CModalHeader>
          <CForm onSubmit={handleAddSubmit}>
            <CModalBody>
              <div className="row g-3 h5">
                <DeptTree onSelectedNodeChange={setSelectedNode} />
                <div className="col-md-6">
                  <CFormLabel htmlFor="memberRole">Mail Role</CFormLabel>
                  <CFormSelect
                    id="memberRole"
                    value={tab === 'all' ? 'cc' : newMember.mail_role}
                    onChange={handleAddChange('mail_role')}
                    size="lg"
                    disabled={tab === 'all'}
                  >
                    <option value="to">To</option>
                    <option value="cc">CC</option>
                  </CFormSelect>
                </div>
              </div>
            </CModalBody>
            <CModalFooter className="d-flex justify-content-between">
              <CButton
                color="secondary"
                variant="ghost"
                size="lg"
                type="button"
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedNode(null)
                }}
              >
                Cancel
              </CButton>
              <CButton
                color="primary"
                type="submit"
                size="lg"
                className="btn-ph-primary"
              >
                Save
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>
      </ClientOnly>
    </>
  )
}
