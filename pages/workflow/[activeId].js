import { useRouter } from 'next/router'

const approvalHistory = [
  { marker: '\u2713', label: 'Draft', className: 'done' },
  { marker: '\u2713', label: 'Submitted', className: 'done' },
  { marker: '\u25cf', label: 'Pending Review', className: 'current' },
]

export default function MockWorkflowDetail() {
  const router = useRouter()
  const { activeId } = router.query
  const workflowId = Array.isArray(activeId) ? activeId[0] : activeId

  return (
    <main className="workflow-page">
      <section className="workflow-panel">
        <div className="demo-notice">
          <div className="notice-title">
            <span aria-hidden="true">{'\u2139'}</span>
            <span>Demo Notice</span>
          </div>
          <p>
            This page simulates the external approval workflow used in the
            original enterprise system.
            <br />
            No real workflow service is connected.
          </p>
        </div>

        <h1>Approval Workflow</h1>

        <div className="field">
          <span className="label">Workflow ID</span>
          <span className="value">{workflowId || '-'}</span>
        </div>

        <div className="field">
          <span className="label">Status</span>
          <span className="value">{'\u{1F7E1}'} Pending Review</span>
        </div>

        <div className="field">
          <span className="label">Current Step</span>
          <span className="value">Manager Review</span>
        </div>

        <div className="history">
          <h2>Approval History</h2>
          <ul>
            {approvalHistory.map((item) => (
              <li key={item.label} className={item.className}>
                <span className="marker">{item.marker}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <style jsx>{`
        .workflow-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 56px 20px;
          background: #f5f7fb;
          color: #1f2937;
        }

        .workflow-panel {
          width: 100%;
          max-width: 560px;
          padding: 32px;
          border: 1px solid #d8dee9;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
        }

        .demo-notice {
          margin-bottom: 28px;
          padding: 14px 16px;
          border: 1px solid #d7e3f4;
          border-radius: 6px;
          background: #f7faff;
          color: #3b4a5f;
        }

        .notice-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 700;
        }

        .demo-notice p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
        }

        h1 {
          margin: 0 0 28px;
          font-size: 28px;
          font-weight: 700;
        }

        .field {
          display: grid;
          gap: 8px;
          margin-bottom: 24px;
        }

        .label {
          font-size: 14px;
          font-weight: 700;
          color: #4b5563;
        }

        .value {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .history {
          margin-top: 32px;
        }

        h2 {
          margin: 0 0 16px;
          font-size: 20px;
          font-weight: 700;
        }

        ul {
          display: grid;
          gap: 12px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          color: #1f2937;
        }

        .marker {
          width: 24px;
          font-weight: 700;
          text-align: center;
        }

        .done .marker {
          color: #15803d;
        }

        .current .marker {
          color: #ca8a04;
        }
      `}</style>
    </main>
  )
}
