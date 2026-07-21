import { useState } from 'react'
import { logger } from '@/utils/logger'

const useFileManagement = () => {
  const fileIcons = {
    // 文書類
    pdf: '/img/pdf.png',
    doc: '/img/word.png',
    docx: '/img/word.png',
    txt: '/img/txt.png',

    // 試算表類
    xls: '/img/excel.png',
    xlsx: '/img/excel.png',
    csv: '/img/excel.png',

    // 簡報類
    ppt: '/img/ppt.png',
    pptx: '/img/ppt.png',

    // 圖片類
    jpg: '/img/jpg.png',
    jpeg: '/img/jpg.png',
    png: '/img/jpg.png',

    // 壓縮檔案類
    zip: '/img/zip.png',
    rar: '/img/zip.png',

    // 預設
    default: '/img/other.png',
  }
  const handleFileUpload = (id, targetItem, e) => {
    const uploadedFiles = Array.from(e.target.files).map((file) => {
      const extension = file.name.split('.').pop().toLowerCase() // 取得副檔名
      return {
        file,
        preview: URL.createObjectURL(file),
        icon: fileIcons[extension] || fileIcons.default, // 根據副檔名選擇圖示
      }
    })
    logger.info(
      `Uploading ${uploadedFiles.length} files to item ID: ${id}`,
      'useFileManagement'
    )

    const newItem = targetItem.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          AttachFile: [...item.AttachFile, ...uploadedFiles],
        }
      }
      return item
    })
    return newItem
  }

  const handleDeleteFile = (id, targetItem, file) => {
    logger.warn(
      `Deleting file ${file.name} from item ID: ${id}`,
      'useFileManagement'
    )
    const newItem = targetItem.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          AttachFile: item.AttachFile.filter((f) => f.file.name !== file.name),
        }
      }
      return item
    })
    URL.revokeObjectURL(file.preview) // 釋放資源
    return newItem
  }

  const handlePreview = (preview) => {
    logger.info(`Previewing file: ${preview}`, 'useFileManagement')
    window.open(preview, '_blank')
  }

  return {
    handleFileUpload,
    handleDeleteFile,
    handlePreview,
  }
}

export default useFileManagement
