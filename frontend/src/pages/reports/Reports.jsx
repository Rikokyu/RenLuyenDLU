import React, { useState } from "react";
import "./Reports.css";
import ReportOverview from "./ReportOverview";
import ReportAnalytics from "./ReportAnalytics";
import ReportDetails from "./ReportDetails";
import "./ReportsTypography.css";

function Reports() {
  const [reportQuery, setReportQuery] = useState({});

  return (
    <main className="reports-dashboard">
      {/* HEADER SECTION */}
      <header className="dashboard-header">
        <div>
          <h2>Báo Cáo & Thống Kê Hoạt Động Sinh Viên</h2>
          <p>
            Hệ thống theo dõi, đánh giá sự tham gia phong trào và quản lý minh chứng tích lũy
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <span className="icon">📥</span> Xuất báo cáo tổng hợp
          </button>
        </div>
      </header>

      {/* ================= TẦNG 1: OVERVIEW & KPIS ================= */}
      <ReportOverview onPeriodChange={setReportQuery} />

      {/* ================= TẦNG 2: PHÂN TÍCH & PHÂN KHÚC ================= */}
      <ReportAnalytics key={JSON.stringify(reportQuery)} periodQuery={reportQuery} />

      {/* ================= TẦNG 3: CHI TIẾT & VẬN HÀNH ================= */}
      <ReportDetails />
    </main>
  );
}

export default Reports;
