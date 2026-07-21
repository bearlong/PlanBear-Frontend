import styles from '@/styles/deptTree.module.scss'

const isDeptNode = (node) => node?.type === 'dept'

const getUserLabel = (node) => {
  return node.label
}

const getMembersLabel = (node) => node?.label || 'Members'

export default function TreeNode({
  node,
  level,
  expanded,
  onToggle,
  onSelect,
  selectedId,
}) {
  const canToggle = isDeptNode(node)
  const isExpanded = expanded.has(node.id)
  const showChildren = isExpanded
  const isSelected = selectedId === node.id

  const handleToggle = (event) => {
    event.stopPropagation()
    onToggle(node)
  }

  const handleSelect = () => onSelect(node)
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect()
    }
  }

  const icon = isDeptNode(node) ? 'DEPT' : 'USER'
  const expandIcon = canToggle ? (showChildren ? 'v' : '>') : '.'
  const nodeIconClass = isDeptNode(node) ? styles.deptIcon : styles.userIcon
  const indentStyle = { '--indent': `${level * 20}px` }

  return (
    <div>
      <div
        className={`${styles.treeRow} ${
          level > 0 ? styles.hasIndent : ''
        } d-flex align-items-center gap-2 rounded ${
          isSelected ? styles.selected : ''
        }`}
        style={indentStyle}
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          className={`${styles.expandIcon} d-flex align-items-center justify-content-center`}
          onClick={handleToggle}
          aria-label={canToggle ? 'Toggle' : 'Leaf'}
          disabled={!canToggle}
        >
          {expandIcon}
        </button>
        <span
          className={`${styles.nodeIcon} ${nodeIconClass} d-flex align-items-center h4 p-2`}
        >
          {icon}
        </span>
        <div className="d-flex flex-column">
          <span className="fw-semibold h5">
            {isDeptNode(node)
              ? node?.name || node?.dept || 'Department'
              : getUserLabel(node)}
          </span>
          <span className="text-muted small h6">
            {isDeptNode(node)
              ? node?.dept || 'Dept'
              : node?.job_title || 'User'}
          </span>
        </div>
      </div>
      {showChildren &&
        node?.children?.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            level={level + 1}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
    </div>
  )
}
