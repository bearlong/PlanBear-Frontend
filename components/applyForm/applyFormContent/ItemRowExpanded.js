import { motion } from 'framer-motion'
import React from 'react'
import Image from 'next/image'
import useFileManagement from '@/hooks/useFileManagement'
import { api } from '@/utils/api'

export default function ItemRowExpanded({ item }) {
  const { handlePreview } = useFileManagement()

  return (
    <motion.tr
      key="expandable-row"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={undefined}
      transition={{ duration: 0.5 }}
      className="table-active"
    >
      <td colSpan={18}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={undefined}
        >
          <div className="p-3">
            <div className="row p text-start">
              <div className="col-lg-6 mb-2">
                <div className="h3 fw-semibold border-bottom border-secondary pb-2">
                  基本資料
                </div>
                <div className="row gy-3 p fw-normal">
                  <div className="col-lg-6">
                    <strong>LME：</strong>
                  </div>
                  <div className="col-lg-6">{item.LME}</div>
                  <div className="col-lg-6">
                    <strong>Control Quantity：</strong>
                  </div>
                  <div className="col-lg-6">{item.ControlQuantity}</div>
                  <div className="col-lg-6">
                    <strong>Quota Date：</strong>
                  </div>
                  <div className="col-lg-6">{item.QuotaDate}</div>
                  <div className="col-lg-6">
                    <strong>Annulment Date：</strong>
                  </div>
                  <div className="col-lg-6">{item.AnnulmentDate}</div>
                </div>
              </div>
              <div className="col-lg-6 mb-2">
                <div className="h3 fw-semibold border-bottom border-secondary pb-2">
                  其他資訊
                </div>
                <div className="row gy-3 p fw-normal">
                  <div className="col-lg-6">
                    <strong>Vendor Quotation No.：</strong>
                  </div>
                  <div className="col-lg-6">{item.VendorQuotationNo}</div>
                  <div className="col-lg-6">
                    <strong>Place of Origin：</strong>
                  </div>
                  <div className="col-lg-6">
                    {item.PlaceOfOrigin.join(', ')}
                  </div>
                  <div className="col-lg-6">
                    <strong>Spot Price：</strong>
                  </div>
                  <div className="col-lg-6">{item.IsSpotPrice}</div>
                  <div className="col-lg-6">
                    <strong>Unpaid Order Effective：</strong>
                  </div>
                  <div className="col-lg-6">{item.IsUnpaidOrderEffective}</div>
                  <div className="col-lg-6">
                    <strong>Attach File：</strong>
                  </div>
                  <div className="col-lg-6">
                    <div className="d-flex justify-content-center align-items-start flex-column">
                      {item.AttachFile?.map((v, index) => (
                        <button
                          className="center-flex border border-2 border-dark p-2 rounded mb-2"
                          onClick={() => {
                            if (v.preview) {
                              handlePreview(v.preview)
                            } else {
                              const filename = encodeURIComponent(v.file.name)
                              const url = api(
                                `/data/files?filename=${filename}`
                              )
                              window.open(url, '_blank')
                            }
                          }}
                          key={index}
                        >
                          <div className="imgbox">
                            <Image
                              src={v.icon}
                              alt="file-icon"
                              width={20}
                              height={20}
                            />
                          </div>
                          {v.file.name.length > 20
                            ? `${v.file.name.slice(0, 20)}...`
                            : v.file.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </td>
    </motion.tr>
  )
}
