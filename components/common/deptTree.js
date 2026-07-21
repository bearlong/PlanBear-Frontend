import { useCallback, useEffect, useMemo, useState } from 'react'
import { CButton, CFormInput, CSpinner } from '@coreui/react'
import { api } from '@/utils/api'
import { logger } from '@/utils/logger'
import TreeNode from './treeNode'

const isDeptNode = (node) => node?.type === 'dept'

const getDeptLabel = (node) => {
  const name = node?.name || node?.dept || 'Department'
  const code = node?.dept || node?.id || ''
  return code ? `${name} (${code})` : name
}

const getUserLabel = (node) => {
  return node.label
}

const getNodeLabel = (node) =>
  isDeptNode(node) ? getDeptLabel(node) : getUserLabel(node)

const matchesQuery = (node, query) => {
  if (!query) return true
  const target = [
    node?.name,
    node?.dept,
    node?.fullname,
    node?.ename,
    node?.job_title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return target.includes(query)
}

const filterTree = (nodes, query) => {
  if (!query) return nodes
  return nodes.reduce((acc, node) => {
    const children = node?.children?.length
      ? filterTree(node.children, query)
      : []
    if (matchesQuery(node, query) || children.length) {
      acc.push({ ...node, children })
    }
    return acc
  }, [])
}

const findNodeById = (nodes, id) => {
  if (!id) return null
  for (const node of nodes) {
    if (node.id === id) return node
    const found = node?.children?.length
      ? findNodeById(node.children, id)
      : null
    if (found) return found
  }
  return null
}

const attachMembersToDept = (nodes, deptId, members) =>
  nodes.map((node) => {
    if (node.id === deptId) {
      const nextChildren = Array.isArray(node.children)
        ? [...node.children]
        : []
      const cleaned = nextChildren.filter(
        (child) => child?.type !== 'members' && child?.type !== 'user'
      )
      if (!members.length) {
        return { ...node, children: cleaned }
      }
      const nextMembers = members.map((member) => ({
        ...member,
        dept: node?.name || member?.dept,
      }))
      return { ...node, children: [...cleaned, ...nextMembers] }
    }
    if (node?.children?.length) {
      return {
        ...node,
        children: attachMembersToDept(node.children, deptId, members),
      }
    }
    return node
  })

export default function DeptTree({ onSelectedNodeChange }) {
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())
  const [selectedId, setSelectedId] = useState('')

  const fetchDeptTree = useCallback(async () => {
    try {
      setLoading(true)
      const url = api('/depts/dept-tree')
      logger.info(`Get Dept Tree : ${url}`, 'DeptTree')
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok || result?.status !== 'success') {
        logger.warn(
          `${url} API failed with status ${response.status}`,
          'DeptTree'
        )
        throw new Error(`Failed to fetch ${url}`)
      }
      logger.info(`${url} API success`, 'DeptTree')
      const data = Array.isArray(result?.data) ? result.data : []
      setTreeData(data)
      console.log(data)

      const rootExpanded = new Set(
        data.filter((node) => isDeptNode(node)).map((node) => node.id)
      )
      setExpanded(rootExpanded)
    } catch (error) {
      logger.error('DeptTree fetch failed', 'DeptTree', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMembers = async (dept) => {
    try {
      const url = api(
        `/depts/dept-users?dept=${encodeURIComponent(dept)}&limit=200&offset=0`
      )
      logger.info(`Load Members : ${url}`, 'DeptTree')
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok || result?.status !== 'success') {
        logger.warn(
          `${url} API failed with status ${response.status}`,
          'DeptTree'
        )
        throw new Error(`Failed to fetch ${url}`)
      }
      logger.info(`${url} API success`, 'DeptTree')
      return Array.isArray(result?.data)
        ? result.data.map((member) => ({ ...member, children: [] }))
        : []
    } catch (error) {
      logger.error('Load Members fetch failed', 'DeptTree', error)
      return []
    }
  }

  const searchMembers = async (query) => {
    try {
      const url = api(`/depts/search-user?query=${encodeURIComponent(query)}`)
      logger.info(`Search Members : ${url}`, 'DeptTree')
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok || result?.status !== 'success') {
        logger.warn(
          `${url} API failed with status ${response.status}`,
          'DeptTree'
        )
        throw new Error(`Failed to fetch ${url}`)
      }
      logger.info(`${url} API success`, 'DeptTree')
      return Array.isArray(result?.data)
        ? result.data.map((member) => ({ ...member, children: [] }))
        : []
    } catch (error) {
      logger.error('Search Members fetch failed', 'DeptTree', error)
      return []
    }
  }

  useEffect(() => {
    fetchDeptTree()
  }, [fetchDeptTree])

  const selectedNode = useMemo(
    () => findNodeById(treeData, selectedId),
    [treeData, selectedId]
  )

  const selectedLabel = selectedNode
    ? getNodeLabel(selectedNode)
    : 'No selection'

  const handleToggle = async (node) => {
    if (!isDeptNode(node)) return
    const isExpanding = !expanded.has(node.id)
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(node.id)) {
        next.delete(node.id)
      } else {
        next.add(node.id)
      }
      return next
    })
    if (!isExpanding) return
    if (!node?.dept) return
    const members = await loadMembers(node.dept)
    setTreeData((prev) => attachMembersToDept(prev, node.id, members))
  }

  const handleMemberSearch = async () => {
    const query = search.trim()
    if (!query) return

    const members = await searchMembers(query)
    setTreeData(members)
  }

  const handleSelect = (node) => {
    setSelectedId(node?.id || '')
    if (onSelectedNodeChange) {
      onSelectedNodeChange(node)
    }
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div>
          <p className="text-muted small mb-1">Selected node</p>
          <div className="fw-semibold">{selectedLabel}</div>
        </div>
        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
          <CFormInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleMemberSearch()
              }
            }}
            placeholder="Search by name, dept, or title"
            autoComplete="off"
            className="shadow-sm"
          />
          <CButton
            color="info"
            variant="outline"
            className="btn-ph-primary"
            onClick={handleMemberSearch}
            disabled={loading}
          >
            Search
          </CButton>
          <CButton
            color="primary"
            variant="outline"
            className="btn-ph-primary"
            onClick={fetchDeptTree}
            disabled={loading}
          >
            Refresh
          </CButton>
        </div>
      </div>

      <div className="border rounded shadow-sm p-2 bg-white">
        {loading ? (
          <div className="d-flex align-items-center justify-content-center p-4">
            <CSpinner size="sm" className="me-2" />
            <span className="text-muted small">Loading...</span>
          </div>
        ) : treeData.length === 0 ? (
          <div className="text-center text-muted small p-4">
            No matching nodes
          </div>
        ) : (
          treeData.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              expanded={expanded}
              onToggle={handleToggle}
              onSelect={handleSelect}
              selectedId={selectedId}
            />
          ))
        )}
      </div>
    </div>
  )
}
