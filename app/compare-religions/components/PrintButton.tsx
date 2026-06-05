"use client";

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button className="print-btn" onClick={handlePrint} title="Print comparison">
      <i className="ti ti-printer" aria-hidden="true" />
      <span>Print</span>

      <style jsx>{`
        .print-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1.1rem;
          border-radius: 100px;
          border: 1.5px solid #e4ebe4;
          background: white;
          color: #5a6b5c;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .print-btn:hover {
          border-color: #0a3d2e;
          color: #0a3d2e;
          transform: translateY(-1px);
        }

        .print-btn i {
          font-size: 1rem;
        }

        @media print {
          .print-btn {
            display: none;
          }
        }
      `}</style>
    </button>
  );
}
