import { CButton, CFormCheck } from '@coreui/react'
import { FaPenToSquare } from 'react-icons/fa6'
import { AnimatePresence } from 'framer-motion'
import { Fragment } from 'react'
import ItemRowExpanded from './ItemRowExpanded'
import styles from '@/styles/application.module.scss'

export default function ItemRow({
  item,
  isOpen,
  onToggle,
  onEdit,
  showCheckbox,
  selectIds,
  setSelectIds,
}) {
  return (
    <Fragment key={item.id}>
      <tr className="border-top border-light p fw-normal" onClick={onToggle}>
        {showCheckbox && (
          <th>
            <CFormCheck
              onChange={() => {
                if (selectIds.includes(item.id)) {
                  setSelectIds(selectIds.filter((id) => id !== item.id))
                } else {
                  setSelectIds([...selectIds, item.id])
                }
              }}
              onClick={(e) => {
                e.stopPropagation() // ✅ 阻止點擊冒泡到 tr
              }}
              checked={selectIds.includes(item.id)}
            ></CFormCheck>
          </th>
        )}
        <th scope="row" className="fw-bold">
          {item.id}
        </th>
        <td>{item.Factory.display}</td>
        <td>{item.Buyer?.name || null}</td>
        <td>{item.Vendor.display}</td>
        <td>{item.Brand.display}</td>
        <td>{item.Parts}</td>
        <td
          style={{
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {item.Description}
        </td>
        <td>{item.OrderSharerate}</td>
        <td>
          {item.LastPutPrice}{' '}
          <small className="text-secondary">{item.CurrencyOld}</small>
        </td>
        <td>{item.Rate}</td>
        <td>
          {item.UnitPrice}{' '}
          <small className="text-secondary">{item.CurrencyNew}</small>
        </td>
        <td
          className={
            item.CostDown > 0
              ? 'text-success'
              : item.CostDown < 0
              ? 'text-danger'
              : ''
          }
        >
          {item.CostDown > 0 && '▼ '}
          {item.CostDown < 0 && '▲ '}
          {item.CostDown}
        </td>
        <td>{item.Moq}</td>
        <td>{item.Mpq}</td>
        <td>{item.LeadTime}</td>
        <td>{item.EffectiveDate}</td>
        <td>{item.EffectiveRemark}</td>
        <td>
          <CButton
            color="secondary"
            className={`center-flex ${
              typeof onEdit !== 'function' ? '' : 'btn-ph-primary'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item.id)
            }}
            disabled={typeof onEdit !== 'function'}
          >
            <FaPenToSquare size={20} />
          </CButton>
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {isOpen && <ItemRowExpanded item={item} />}
      </AnimatePresence>
    </Fragment>
  )
}
