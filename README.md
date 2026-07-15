# Plan Bear Enterprise Platform — Frontend

Plan Bear Enterprise Platform 是一套管理系統 Demo，主要包含 RFQ 詢價流程、簽核流程、儀器校驗、待辦事項、收藏模組與角色權限控制。

本專案由企業內部系統重構而來。為避免公開真實公司資料、商業邏輯與企業內部服務，已完成資料去識別化、Mock 化與品牌抽象化。

## Project Overview

本專案展示一套以前端操作體驗為主的企業管理平台，保留原本 API 呼叫方式與模組分層概念，並透過 Mock Authentication、Mock Role Selection 與去識別化資料，提供可公開展示的 Demo 版本。

主要模組包含：

- Request for Quotation（RFQ）
- Approval Workflow
- Instrument Calibration
- Pending Tasks
- Favorites
- Role-Based Access Control

## Live Demo

> Placeholder：可於此放置 GitHub Pages、Vercel 或其他部署平台連結。

### Demo Login

| Field | Value |
| --- | --- |
| Username | 任意帳號 |
| Password | `1234` |

登入後可選擇 Demo Role，以體驗不同角色的功能與權限。

### Demo Roles

| Role | Identifier |
| --- | --- |
| 管理員 | `admin` |
| 採購 | `procurement` |
| 儀校 | `calibration` |
| 儀校主管 | `calibration_boss` |
| 特定權限人員 | `specific person` |

所有身份驗證、權限資料與業務資料皆為模擬內容。

## Features

### Demo Authentication

- 任意帳號搭配固定密碼登入
- 不連接企業 AD、LDAP 或 SSO
- 登入後可選擇不同 Demo Role

### Role-Based Access Control

- 根據角色顯示不同 Sidebar 模組
- 控制頁面存取權限
- 控制 Approve / Reject 等操作權限

### Request for Quotation

- 建立與查詢 RFQ
- 表單詳細資料
- 狀態追蹤
- 模擬提交簽核
- 模擬 Approve / Reject

### Instrument Calibration

- 儀器清單查詢
- 條件篩選與分頁
- 儀器詳細資訊
- 校驗歷程
- 報表與附件預覽
- 校驗統計
- 維修申請

### Common Modules

- Favorites 快捷模組
- Pending Tasks 代辦事項模組
- User Help

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 14 |
| UI Library | React 18 |
| Language | JavaScript |
| UI Framework | CoreUI, Bootstrap |
| API Client | Axios / Fetch API |
| Alert / Dialog | SweetAlert2 |
| State Management | React Context |
| Styling | CSS Modules |

## Demo Architecture

```text
Next.js Page
    ↓
Frontend Service
    ↓
Express API
    ↓
Mock Repository
    ↓
Anonymized Mock Data
```

前端仍保留原本 API 呼叫方式，Mock 資料主要由後端回傳，避免將資料邏輯直接寫死在畫面元件中。

## Mock Strategy

本專案原在公司內部運行，為了可公開展示進行以下調整：

- 移除公司名稱與 Logo
- 使用 Plan Bear 自訂品牌
- 移除真實員工、人名、工號與 Email
- 移除真實料號、供應商與財產編號
- 使用 Mock Authentication
- 使用 Mock Role Selection
- 將外部 簽核平台 改為 Workflow Demo
- 將真實附件替換為 Demo PDF
- 不連接任何正式 DB、API 或企業內部服務

## Screenshots

> Placeholder：可於此放置系統畫面截圖，例如登入頁、角色選擇、RFQ 列表、儀器校驗列表與簽核操作畫面。

## Getting Started

### Installation

```bash
git clone <frontend-repository-url>
cd planbear-frontend
yarn install
```

### Development

```bash
yarn dev
```

## Environment Variables

建立 `.env.local`：

```env
NODE_ENV=development
NEXT_PUBLIC_ANALYTICS_ID=abcdefghijk
NEXT_PUBLIC_API_URL=http://localhost:3005/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_VERSION=v1.6.0-beta.2
NEXT_PUBLIC_USE_MOCK=true
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Express Backend API URL |
| `NEXT_PUBLIC_USE_MOCK` | 啟用 Demo / Mock Mode |

## Project Structure

```text
next-base/
├── assets/        # 靜態與介面相關資源
├── components/    # 共用 UI 元件
├── configs/       # Demo 與系統設定
├── context/       # React Context
├── data/          # 前端資料檔
├── hooks/         # 自訂 Hooks
├── lib/           # 共用函式庫
├── pages/         # Next.js Pages
├── public/        # Public assets
├── services/      # 前端服務層與 API 呼叫
├── styles/        # 全域與模組樣式
└── utils/         # 共用工具函式
```

## Known Limitations

- 本專案為 Demo / Mock Mode，身份驗證、權限資料與業務資料皆為模擬內容。
- 不連接企業 AD、LDAP 或 SSO。
- 不連接任何正式 DB、API 或企業內部服務。
- 外部簽核平台已改為 Workflow Demo。
- 真實附件已替換為 Demo PDF。
- Screenshots 與 Live Demo 連結目前保留 Placeholder。

## Disclaimer

本專案僅作為作品集展示與技術 Demo 使用。所有公司名稱、員工資料、料號、供應商、財產編號、附件與業務資料皆已去識別化或替換為模擬資料，不代表任何真實企業資料或正式營運系統。

## Author

沈正龍 Bear Shen
- GitHub： https://github.com/bearlong
- Linkedin： https://www.linkedin.com/in/cheng-long-shen-1843082b7/
- email： a86774546@gmail.com


