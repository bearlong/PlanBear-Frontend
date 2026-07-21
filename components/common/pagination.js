import React from 'react'
import { CPagination, CPaginationItem } from '@coreui/react'
import styles from '@/styles/selectForm.module.scss'

export default function Pagination({ totalPages, page, onPageChange }) {
  if (totalPages <= 0) return null
  console.log(totalPages, page)
  const getVisiblePages = (page, totalPages) => {
    const startPage = Math.max(1, page - Math.floor(3 / 2))
    const endPage = Math.min(totalPages, startPage + 3 - 1)

    let visiblePages = []
    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i)
    }

    return visiblePages
  }

  const visiblePages = getVisiblePages(page, totalPages)

  const handleNextPage = () => {
    if (page < totalPages) {
      onPageChange(page + 1)
    }
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      onPageChange(page - 1)
    }
  }
  return (
    <>
      {totalPages > 0 && (
        <CPagination size="lg">
          <CPaginationItem
            className={styles['cursor-pointer']}
            disabled={page === 1}
            onClick={() => {
              handlePreviousPage()
            }}
          >
            <span>&laquo;</span>
          </CPaginationItem>
          {/* 顯示前頁碼 */}
          {visiblePages[0] > 1 && (
            <>
              <CPaginationItem
                onClick={() => {
                  onPageChange(1)
                }}
                className={styles['cursor-pointer']}
              >
                {1}
              </CPaginationItem>
              {visiblePages[0] > 2 && <CPaginationItem>...</CPaginationItem>}
            </>
          )}

          {/* 顯示中間的頁碼 */}
          {visiblePages.map((currencyPage) => (
            <CPaginationItem
              key={currencyPage}
              onClick={() => {
                onPageChange(currencyPage)
              }}
              className={styles['cursor-pointer']}
              active={currencyPage === page}
            >
              {currencyPage}
            </CPaginationItem>
          ))}

          {/* 顯示後頁碼 */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <CPaginationItem>...</CPaginationItem>
              )}
              <CPaginationItem
                onClick={() => {
                  onPageChange(totalPages)
                }}
                className={styles['cursor-pointer']}
              >
                {totalPages}
              </CPaginationItem>
            </>
          )}
          <CPaginationItem
            className={styles['cursor-pointer']}
            disabled={page === totalPages}
            onClick={() => {
              handleNextPage()
            }}
          >
            <span aria-hidden="true">&raquo;</span>
          </CPaginationItem>
        </CPagination>
      )}
    </>
  )
}
