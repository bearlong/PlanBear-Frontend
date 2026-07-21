import {
  FaMoneyBill,
  FaSearchengin,
  FaCheck,
  FaBook,
  FaBell,
  FaChartLine,
  FaScrewdriverWrench,
  FaGears,
  FaBuildingColumns,
  FaUsersGear,
  FaSignature,
  FaFileLines,
  FaChartBar,
  FaToolbox,
} from 'react-icons/fa6'

/**
 * sidebarModules 使用說明
 * ------------------------------------------------------------------
 * 用途：
 *   1. 驅動 Sidebar 的結構（避免在 Sidebar component 裡硬寫 JSX）
 *   2. 做為模組／功能的「單一真實來源」（Single Source of Truth）
 *      - Sidebar 顯示
 *      - 權限控管 (hasModuleAccess)
 *      - 未來的「常用模組捷徑 / 我的最愛」都可重用這份定義
 *
 * 欄位說明：
 *   - key: 模組代碼（例如 'Procurement', 'Calibration'）
 *          ‣ 用來辨識是哪一組模組、記錄展開狀態、log、未來個人化設定等
 *
 *   - label: 模組在 UI 上顯示的名稱（Sidebar group title）
 *
 *   - displayOrder: 顯示順序（數字愈小愈前面）
 *          ‣ 目前未在程式中使用，但可在 Sidebar 渲染前先 sort：
 *              sidebarModules.sort((a, b) => a.displayOrder - b.displayOrder)
 *
 *   - alwaysVisible: 控制「模組群組本身」是否永遠顯示
 *          ‣ true  ：不管 hasModuleAccess(module.key) 結果如何，都顯示 group
 *          ‣ false ：需要 hasModuleAccess(module.key) 通過才顯示 group
 *
 *   - items: 模組底下的功能清單（實際的選單項目）
 *
 * items 欄位說明：
 *   - key: 功能代碼（如 'vcp_apply_create'、'ic_add_new'）
 *          ‣ 推薦規則：<模組縮寫>_<功能>_<動作>
 *          ‣ 未來 user_favorites / log / 權限細項 建議都用這個 key
 *
 *   - icon: 對應的圖示 component（來自 react-icons）
 *
 *   - text: 選單上顯示的文字
 *
 *   - href: 點擊後要前往的路由
 *
 *   - moduleKey: 功能級權限代碼
 *          ‣ null          ：代表「全員可見」，不做權限判斷
 *          ‣ 'Calibration' ：代表需 hasModuleAccess('Calibration') 才會顯示
 *
 * ------------------------------------------------------------------
 * 權限控制邏輯建議（Sidebar component 內實作）：
 *
 *   // 1) 模組（Group）層
 *   sidebarModules.filter((module) => {
 *     // alwaysVisible = true → group 永遠顯示
 *     if (module.alwaysVisible) return true
 *
 *     // alwaysVisible = false → 需 module.key 有權限才顯示
 *     return hasModuleAccess(module.key)
 *   })
 *
 *   // 2) 子項目（Item）層
 *   module.items.filter((item) => {
 *     // moduleKey = null → 全員顯示
 *     if (!item.moduleKey) return true
 *     // moduleKey 有值 → 檢查 hasModuleAccess(item.moduleKey)
 *     return hasModuleAccess(item.moduleKey)
 *   })
 *
 * 這樣就可以達成：
 *   - Procurement：整組以 module.key = 'Procurement' 控管顯示
 *   - Calibration：group 永遠顯示（alwaysVisible: true），
 *                   但個別功能視 item.moduleKey 決定是否顯示
 *
 * ------------------------------------------------------------------
 * Sidebar 端使用範例（簡化版）：
 *
 *   {sidebarModules
 *     .filter((module) => {
 *       if (module.alwaysVisible) return true
 *       return hasModuleAccess(module.key)
 *     })
 *     .map((module) => (
 *       <CNavGroup key={module.key} ...>
 *         {module.items
 *           .filter((item) => !item.moduleKey || hasModuleAccess(item.moduleKey))
 *           .map((item) => (
 *             <CNavItem key={item.key}>
 *               <Link href={item.href}>
 *                 <item.icon />
 *                 {item.text}
 *               </Link>
 *             </CNavItem>
 *           ))}
 *       </CNavGroup>
 *     ))}
 *
 * ------------------------------------------------------------------
 */

export const sidebarModules = [
  {
    key: 'Procurement',
    label: 'Request for Quotation',
    displayOrder: 1,
    alwaysVisible: false,
    items: [
      {
        icon: FaMoneyBill,
        key: 'vcp_apply_create',
        text: 'Create RFQ',
        href: '/Procurement/Application/list',
        moduleKey: null,
      },
      {
        icon: FaSearchengin,
        key: 'vcp_apply_query',
        text: 'RFQ List',
        href: '/Procurement/Application/query',
        moduleKey: null,
      },
      {
        icon: FaCheck,
        key: 'vcp_pending_approval',
        text: 'Pending Reviews',
        href: '/Procurement/Application/signature',
        moduleKey: null,
      },
    ],
  },
  {
    key: 'Calibration',
    label: 'Instrument Calibration',
    displayOrder: 2,
    alwaysVisible: true,
    items: [
      {
        icon: FaBook,
        key: 'ic_maintain_instrument_name',
        text: 'Instrument Catalog',
        href: '/Calibration/instrument-names',
        moduleKey: 'Calibration',
      },

      {
        icon: FaBell,
        key: 'ic_notice_member_list',
        text: 'Notification Settings',
        href: '/Calibration/notice-member-list',
        moduleKey: 'Calibration',
      },
      {
        icon: FaChartLine,
        key: 'ic_calibration_time_calculation',
        text: 'Calibration Metrics',
        href: '/Calibration/calibration-time-calculation',
        moduleKey: 'Calibration',
      },
      // {
      //   icon: FaCheck,
      //   key: 'ic_create_instrument_data',
      //   text: 'Create Instrument Data',
      //   href: '/Procurement/Application/signature4',
      //   moduleKey: 'Calibration',
      // },
      {
        icon: FaScrewdriverWrench,
        key: 'ic_instrument_repair_application',
        text: 'Repair Requests',
        href: '/Calibration/instrument-repair/query',
        moduleKey: null,
      },
      {
        icon: FaGears,
        key: 'ic_maintain_instrument_information',
        text: 'Instrument Management',
        href: '/Calibration/instruments',
        moduleKey: null,
      },
      {
        icon: FaBuildingColumns,
        key: 'ic_instrument_factory',
        text: 'Calibration Laboratory',
        href: '/Calibration/instrument-factory',
        moduleKey: 'Calibration',
      },
      {
        icon: FaUsersGear,
        key: 'ic_maintain_all_owner',
        text: 'Batch Owner Update',
        href: '/Calibration/maintain-instrument-all-owner',
        moduleKey: 'Calibration',
      },
      {
        icon: FaSignature,
        key: 'ic_instrument_report_file_signature',
        text: 'Document Signatures',
        href: '/Calibration/signature-list',
        moduleKey: 'Calibration_boss',
      },
      // {
      //   icon: FaCheck,
      //   key: 'ic_instrument_history_report',
      //   text: 'Instrument Information、History、Report',
      //   href: '/Procurement/Application/signature8',
      //   moduleKey: null,
      // },
      // {
      //   icon: FaCheck,
      //   key: 'ic_loan_and_return',
      //   text: 'Instrument Loan and Return Management',
      //   href: '/Procurement/Application/signature9',
      //   moduleKey: null,
      // },
      // {
      //   icon: FaCheck,
      //   key: 'ic_maintain_instrument_data',
      //   text: 'Maintain Instrument Data、Keep Report File',
      //   href: '/Procurement/Application/signature10',
      //   moduleKey: null,
      // },

      {
        icon: FaFileLines,
        key: 'ic_report',
        text: 'Report',
        href: '/Calibration/report',
        moduleKey: 'Calibration',
      },
      {
        icon: FaChartBar,
        key: 'ic_statistics',
        text: 'Statistics',
        href: '/Calibration/statistics',
        moduleKey: 'Calibration',
      },
      {
        icon: FaToolbox,
        key: 'ic_tools',
        text: 'Tools',
        href: '/Calibration/tools',
        moduleKey: 'Calibration',
      },
    ],
  },
]
