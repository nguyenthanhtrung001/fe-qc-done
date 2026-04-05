"use client";
import React, { useEffect, useRef, useState } from "react";
import { qcService, QCItem, LeaderboardItem } from "@/services/qcService";
import { useEmployeeStore, initializeEmployeeFromLocalStorage } from '@/stores/employeeStore';
import axiosInstance from '@/utils/axiosInstance';
import { Trash2 } from "lucide-react";

const defaultQcType = "Standard";

const getKpiMeta = (progress: number) => {
  if (progress < 50) {
    return {
      text: "text-red",
      bar: "bg-red",
    };
  }
  if (progress < 70) {
    return {
      text: "text-yellow-500",
      bar: "bg-yellow-400",
    };
  }
  return {
    text: "text-emerald-500",
    bar: "bg-emerald-500",
  };
};

export default function QCScanPage() {
  const { employee, setEmployee } = useEmployeeStore();
  const employeeId = employee?.id;
  console.error('hello', employee);

  // Fetch employee data if not in store
  useEffect(() => {
      if (!employee) return;

    const fetchEmployee = async () => {
      if (!employee || !employee.employeeName) {
        try {
          const response = await axiosInstance.get(`https://api-gateway-twzq.onrender.com/v1/api/employees/${employeeId}`); // Adjust endpoint as needed
          setEmployee(response.data);
        } catch (error) {
          console.error('Failed to fetch employee:', error);
        }
      }
    };
    fetchEmployee();
  }, [employee, setEmployee]);

  const [qcCode, setQcCode] = useState("");
  const [initValue, setInitValue] = useState(0);
  const [targetPerHour, setTargetPerHour] = useState(16);
  const [workingHours, setWorkingHours] = useState(8);

  const [qcList, setQcList] = useState<QCItem[]>([]);
  const [filteredList, setFilteredList] = useState<QCItem[]>([]);
  const [total, setTotal] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [kpiPercent, setKpiPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [flashId, setFlashId] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const kpiMeta = getKpiMeta(kpiPercent);
  const pageCount = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const pageItems = filteredList.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    initializeEmployeeFromLocalStorage();
  }, []);

  const loadDashboard = async () => {
    try {
      if (!employeeId) return;
      const response = await qcService.getDashboard(employeeId, date);
      setQcList(response.items);
      setFilteredList(response.items);
      setTotal(response.total);
      setAvgSpeed(response.avgSpeed);
      setKpiPercent(response.kpiPercent);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Optionally set empty state or show error
      setQcList([]);
      setFilteredList([]);
      setTotal(0);
      setAvgSpeed(0);
      setKpiPercent(0);
    }
  };

  const loadKpiConfig = async () => {
    try {
       if (!employeeId) return;
      const response = await qcService.getKpiConfig(employeeId, date);
      setTargetPerHour(response.targetPerHour);
      setWorkingHours(response.workingHours);
    } catch (error) {
      console.error('Failed to load KPI config:', error);
      // Optionally set defaults
      setTargetPerHour(16);
      setWorkingHours(8);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await qcService.getLeaderboard(date);
      setLeaderboard(response);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboard([]);
    }
  };

  useEffect(() => {
   if (!employeeId) return;
    void loadDashboard();
  }, [employeeId, date]);

  useEffect(() => {
    if (!employeeId) return;
    void loadKpiConfig();
  }, [employeeId]);

  useEffect(() => {
    void loadLeaderboard();
  }, [date]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredList(qcList);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      const results = qcList.filter((item) =>
        item.qcCode.toLowerCase().includes(search.trim().toLowerCase())
      );
      setFilteredList(results);
      setPage(1);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, qcList]);

  const handleScan = async () => {
    if (!qcCode.trim()) {
      alert("Vui lòng nhập mã QC.");
      return;
    }
    setLoading(true);
    try {
       if (!employeeId) return;
      const newItem = await qcService.scanQC({ qcCode: qcCode.trim(), employeeId });
      setQcList((prev) => [newItem, ...prev]);
      setFilteredList((prev) => [newItem, ...prev]);
      setTotal((prev) => prev + 1);
      setFlashId(newItem.id);
      setTimeout(() => setFlashId(null), 1000);
      setQcCode("");
      inputRef.current?.focus();
      // Reload dashboard to update metrics
      await loadDashboard();
    } catch (error) {
      console.error('Failed to scan QC:', error);
      alert("Scan QC thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa bản ghi QC này?")) return;
    setLoading(true);
    try {
      if (!employeeId) return;
      await qcService.deleteQC(id, employeeId);
      setQcList((prev) => prev.filter(item => item.id !== id));
      setFilteredList((prev) => prev.filter(item => item.id !== id));
      setTotal((prev) => prev - 1);
      alert("Xóa QC thành công.");
      // Reload dashboard to update metrics
      await loadDashboard();
    } catch (error) {
      console.error('Failed to delete QC:', error);
      alert("Xóa QC thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleInit = async () => {
    if (initValue <= 0) {
      alert("Nhập số lượng khởi tạo lớn hơn 0.");
      return;
    }
    setLoading(true);
    try {
      if (!employeeId) return;
      await qcService.initQC(employeeId, initValue);
      setInitValue(0);
      alert("Khởi tạo QC thành công.");
      // Reload dashboard to update metrics
      await loadDashboard();
    } catch (error) {
      console.error('Failed to init QC:', error);
      alert("Khởi tạo QC thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKpi = async () => {
    if (targetPerHour <= 0 || workingHours <= 0) {
      alert("Điền cấu hình KPI hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      if (!employeeId) return;
      await qcService.saveKpiConfig({ employeeId, date, targetPerHour, workingHours });
      alert("Lưu cấu hình KPI thành công.");
      // Reload dashboard to update KPI
      await loadDashboard();
    } catch (error) {
      console.error('Failed to save KPI config:', error);
      alert("Lưu cấu hình KPI thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-200 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-5 py-5">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-slate-200/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">QC Scan Dashboard</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Theo dõi QC {employee?.employeeName ? `- ${employee.employeeName}` : ''}
              </h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-gradient-to-r from-violet-500 via-indigo-600 to-sky-500 p-4 text-white shadow-lg shadow-violet-200/50">
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">Tổng QC hôm nay</p>
                <p className="mt-3 text-3xl font-bold">{total}</p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-lg shadow-slate-200/80">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tốc độ trung bình</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{avgSpeed.toFixed(2)} QC/s</p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-lg shadow-slate-200/80">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">KPI</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className={`text-lg font-semibold ${kpiMeta.text}`}>{kpiPercent}%</p>
                  <div className="flex-1 rounded-full bg-slate-100 px-2 py-2">
                    <div className={`h-2 rounded-full ${kpiMeta.bar}`} style={{ width: `${Math.min(kpiPercent, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600">Ngày</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Chuyển ngày sẽ tải lại dashboard tự động</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-5 pb-8 xl:grid-cols-[340px_auto]">
        <div className="space-y-6 rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-200/60">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-slate-700">
              <div>
                <p className="text-sm font-semibold">Scan QC</p>
                <p className="text-xs text-slate-500">Nhập mã QC và nhấn Enter</p>
              </div>
            </div>
            <input
              ref={inputRef}
              value={qcCode}
              onChange={(e) => setQcCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="QC Code"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={handleScan}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/40 transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "⏳ Đang gửi..." : "Scan QC"}
            </button>
          </div>

          <div className="space-y-3 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Init QC</p>
            </div>
            <input
              type="number"
              value={initValue}
              onChange={(e) => setInitValue(Number(e.target.value))}
              placeholder="Số lượng"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={handleInit}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-200/40 transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "⏳ Đang khởi tạo..." : "Khởi tạo"}
            </button>
          </div>

          <div className="space-y-3 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Cấu hình KPI</p>
            </div>
            <div className="space-y-2">
              <input
                type="number"
                value={targetPerHour}
                onChange={(e) => setTargetPerHour(Number(e.target.value))}
                placeholder="Mục tiêu/giờ"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              />
              <input
                type="number"
                value={workingHours}
                onChange={(e) => setWorkingHours(Number(e.target.value))}
                placeholder="Giờ làm việc"
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <button
              onClick={handleSaveKpi}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/40 transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "⏳ Đang lưu..." : "Lưu KPI"}
            </button>
          </div>
        </div>

        <div className="space-y-6 rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-200/60">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Danh sách QC</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm QC..."
                  className="rounded-2xl border border-slate-200 bg-slate-50 pl-3 pr-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
                {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Mã QC</th>
                  <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
                  <th className="px-4 py-3 text-center font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t border-slate-200 transition-colors hover:bg-slate-100 ${
                      flashId === item.id ? "bg-emerald-50 animate-pulse" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-900">{item.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.qcCode}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(item.scanTime).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={loading}
                        className="inline-flex items-center gap-1 rounded-xl bg-red px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-red-200/40 transition duration-200 hover:bg-red hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} className="transition-transform group-hover:rotate-12" />
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Hiển thị {pageItems.length} / {filteredList.length} bản ghi
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Trước
                </button>
                <span className="text-sm text-slate-700">
                  Trang {page} / {pageCount}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                  disabled={page === pageCount}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-5 pb-8">
  <div className="rounded-[32px] border border-white/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-2xl shadow-slate-300/60">
    <h2 className="text-lg font-bold text-slate-900 mb-4">🏆 Bảng xếp hạng QC</h2>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 text-slate-700">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Hạng</th>
            <th className="px-4 py-3 text-left font-semibold">Nhân viên</th>
            <th className="px-4 py-3 text-left font-semibold">Tổng QC</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((item, index) => {
            const rowColor =
              index === 0
                ? "bg-yellow-100 hover:bg-yellow-200"
                : index === 1
                ? "bg-slate-100 hover:bg-slate-200"
                : index === 2
                ? "bg-orange-100 hover:bg-orange-200"
                : "hover:bg-slate-50";

            return (
              <tr
                key={item.employeeId}
                className={`border-t border-slate-200 transition-all duration-300 ${rowColor}`}
              >
                <td className="px-4 py-3 text-slate-900 font-bold">{index + 1}</td>
                <td className="px-4 py-3 text-slate-900 font-medium">{item.employeeName}</td>
                <td className="px-4 py-3 text-slate-900">{item.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
</div>

    </div>
  );
}
