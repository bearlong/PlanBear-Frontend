import React, { useState, useMemo, useEffect } from 'react'
import { CButton, CFormCheck } from '@coreui/react'
import styles from '@/styles/application.module.scss'
import { FaArrowUp, FaArrowsUpDown } from 'react-icons/fa6'
import Swal from 'sweetalert2'
import { motion } from 'framer-motion'
import Pagination from '../../common/pagination'
import ItemRow from './ItemRow'

export default function ApplyFormContent({
  items,
  handleEdit,
  handleSort,
  sortConfigs,
  onDeleteItems,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [openRowId, setOpenRowId] = useState(null)
  const [showCheckbox, setShowCheckbox] = useState(false)
  const [selectIds, setSelectIds] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = () => {
    const idsOnPage = paginatedItems.map((item) => item.id)
    const isAllSelected = idsOnPage.every((id) => selectIds.includes(id))
    console.log(isAllSelected)
    if (isAllSelected) {
      setSelectIds([])
    } else {
      const newSelectIds = Array.from(new Set([...selectIds, ...idsOnPage]))
      console.log(newSelectIds)
      setSelectIds(newSelectIds)
    }
  }

  const handleBatchDeleteClick = () => {
    if (!showCheckbox) {
      setShowCheckbox(true)
      setSelectIds([])
      return
    }
    if (selectIds.length === 0) {
      Swal.fire({
        customClass: 'h5',
        title: 'Errors',
        html: 'Please select at least one item to delete.',
        icon: 'error',
      })
      return
    }
    onDeleteItems(selectIds)
    setShowCheckbox(false)
    setSelectIds([])
    setSelectAll(false)
  }

  const itemsPerPage = 100

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = currentPage * itemsPerPage
    setShowCheckbox(false)
    setSelectAll(false)
    return items.slice(start, end)
  }, [items, currentPage])

  useEffect(() => {
    if (selectAll) {
      handleSelectAll()
    } else {
      setSelectIds([])
    }
  }, [selectAll])

  return (
    <>
      <div className={`${styles.formContent}`}>
        {items.length !== 0 ? (
          <>
            <div className={`d-flex justify-content-end align-items-center`}>
              <CButton
                color="primary"
                className="btn-ph-primary p mb-3 text-end me-3"
                onClick={() => {
                  handleSort('CostDown', 'number')
                }}
              >
                Cost Down
                <motion.span
                  initial={false}
                  animate={{
                    rotate:
                      sortConfigs[1].direction === 'asc'
                        ? 0
                        : sortConfigs[1].direction === 'desc'
                        ? 180
                        : 0,
                    opacity: 1,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: 'inline-block',
                    marginLeft: 8,
                  }}
                >
                  {sortConfigs[1].direction === null ? (
                    <FaArrowsUpDown size={16} />
                  ) : (
                    <FaArrowUp size={16} />
                  )}
                </motion.span>
              </CButton>
              <CButton
                color="danger"
                className="p mb-3 text-end"
                onClick={() => {
                  handleBatchDeleteClick()
                }}
                disabled={typeof onDeleteItems !== 'function'}
              >
                {showCheckbox ? '確認刪除' : '批次刪除'}
              </CButton>
            </div>
            <div className={`table-responsive shadow-sm mb-3`}>
              <table className="table table-bordered table-hover align-middle table-borderless mb-0 overflow-auto">
                <thead className="bg-light text-secondary text-nowrap h4">
                  <tr className="text-center table-primary">
                    {showCheckbox && (
                      <th>
                        <CFormCheck
                          onChange={() => {
                            setSelectAll(!selectAll)
                          }}
                          checked={selectAll}
                        ></CFormCheck>
                      </th>
                    )}
                    <th
                      scope="col"
                      onClick={() => {
                        handleSort('id', 'number')
                      }}
                      className={styles.sortBtn}
                    >
                      item
                    </th>
                    <th
                      scope="col"
                      onClick={() => {
                        handleSort('Factory', 'text')
                      }}
                      className={styles.sortBtn}
                    >
                      Factory{' '}
                      {sortConfigs[0].key === 'Factory' &&
                        (sortConfigs[0].direction === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                    <th scope="col">Buy</th>
                    <th
                      scope="col"
                      onClick={() => {
                        handleSort('Vendor', 'text')
                      }}
                      className={styles.sortBtn}
                    >
                      Vendor{' '}
                      {sortConfigs[0].key === 'Vendor' &&
                        (sortConfigs[0].direction === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                    <th
                      scope="col"
                      onClick={() => {
                        handleSort('Brand', 'text')
                      }}
                      className={styles.sortBtn}
                    >
                      Brand
                      {sortConfigs[0].key === 'Brand' &&
                        (sortConfigs[0].direction === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                    <th
                      scope="col"
                      onClick={() => {
                        handleSort('Parts', 'text')
                      }}
                      className={styles.sortBtn}
                    >
                      Parts
                      {sortConfigs[0].key === 'Parts' &&
                        (sortConfigs[0].direction === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                    <th scope="col">Description</th>
                    <th scope="col">Share Rate(%)</th>
                    <th scope="col">Last Price</th>
                    <th scope="col">Rate</th>
                    <th scope="col">Unit Price</th>
                    <th scope="col">Cost Down(%)</th>
                    <th scope="col">Moq</th>
                    <th scope="col">Mpq</th>
                    <th scope="col">Lead Time</th>
                    <th scope="col">Effective Date</th>
                    <th scope="col">Remark</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {paginatedItems.map((item, i) => {
                    return (
                      <ItemRow
                        key={item.id}
                        item={item}
                        isOpen={openRowId === item.id}
                        onToggle={() =>
                          setOpenRowId(openRowId === item.id ? null : item.id)
                        }
                        onEdit={handleEdit}
                        showCheckbox={showCheckbox}
                        selectIds={selectIds}
                        setSelectIds={setSelectIds}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              totalPages={totalPages}
              page={currentPage}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center h3 m-5 fw-bold">NO DATA FOUND</div>
        )}
      </div>
    </>
  )
}
