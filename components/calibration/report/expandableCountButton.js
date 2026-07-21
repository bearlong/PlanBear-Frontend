import { CBadge, CButton } from '@coreui/react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'

export default function ExpandableCountButton({
  count,
  color,
  expanded,
  onClick,
  zeroText = '-',
}) {
  if (count === 0) return zeroText

  return (
    <CButton
      color={color}
      variant="ghost"
      className="d-inline-flex align-items-center gap-2 p"
      onClick={onClick}
    >
      <CBadge color={color} shape="rounded-pill">
        {count} items
      </CBadge>
      {expanded ? <FiChevronUp /> : <FiChevronDown />}
    </CButton>
  )
}
