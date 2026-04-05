// import React from "react";

// const Welcome: React.FC = () => {
//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-teal-500">
//       <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
//         <div className="text-center mb-6">
//           <h1 className="text-4xl font-extrabold text-gray-900">
//             Chào mừng trở lại!
//           </h1>
//           <p className="text-gray-700 mt-2 text-lg">
//             Bạn đã đăng nhập thành công.
//           </p>
//         </div>
       
       
//       </div>
//     </div>
//   );
// };

// export default Welcome;
"use client";
import React, { useEffect, useRef, useState } from "react";

type QC = {
  id: number;
  qcCode: string;
  scanTime: string;
};

const API = "http://localhost:8080/api/qc";

const getKpiMeta = (progress: number) => {
  if (progress < 50)
    return {
      color: "bg-red-500",
      text: "text-red-500",
      glow: "shadow-red-500 animate-pulse",
    };
  if (progress < 80)
    return {
      color: "bg-yellow-400",
      text: "text-yellow-500",
      glow: "shadow-yellow-400 animate-pulse",
    };
  return {
    color: "bg-green-500",
    text: "text-green-500",
    glow: "shadow-green-500 animate-pulse",
  };
};

export default function QCScanPage() {
  const [qcCode, setQcCode] = useState("");
  const [qcList, setQcList] = useState<QC[]>([]);
  const [filteredList, setFilteredList] = useState<QC[]>([]);
  const [search, setSearch] = useState("");

  const [countToday, setCountToday] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [kpiProgress, setKpiProgress] = useState(0);

  const [date, setDate] = useState(new Date().toLocaleDateString("sv-SE"));

  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const kpi = getKpiMeta(kpiProgress);

  const loadData = async () => {
    try {
      const res = await fetch(`${API}/by-date?date=${date}`);
      const data = await res.json();
      const list = data.qcList || [];
      setQcList(list);
      setFilteredList(list);
      setCountToday(list.length);
      setAvgTime(data.avgTime || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const loadKPI = async () => {
    try {
      const res = await fetch(
        `${API}/kpi?start=${date}T00:00:00&end=${date}T23:59:59&targetPerHour=50`
      );
      const data = await res.json();
      setKpiProgress(data.progress || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    loadKPI();
  }, [date]);

  useEffect(() => {
    const keyword = search.toLowerCase();
    setFilteredList(
      qcList.filter((q) => q.qcCode.toLowerCase().includes(keyword))
    );
  }, [search, qcList]);

  const handleSubmit = async () => {
    if (!qcCode || loading) return;
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qcCode,
          scanTime: new Date().toISOString(),
        }),
      });
      if (!res.ok) return;
      const newQC = await res.json();
      setQcList((prev) => [newQC, ...prev]);
      setCountToday((prev) => prev + 1);
      loadKPI();
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      setQcCode("");
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-100 via-white to-blue-200 flex flex-col transition-all">
      {/* HEADER */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 text-white shadow-xl flex items-center justify-between text-sm">
        <h1 className="font-extrabold text-lg tracking-wide drop-shadow-lg">
          🚀 QC Dashboard
        </h1>
        <div className="flex items-center gap-6">
          <span>QC: <b>{countToday}</b></span>
          <span>Avg: <b>{avgTime.toFixed(2)}s</b></span>
          <div className="flex items-center gap-2">
            <span>KPI</span>
            <span className={`${kpi.text} font-bold`}>{kpiProgress}%</span>
            <div className="w-28 h-2 bg-white/30 rounded overflow-hidden shadow-inner">
              <div className={`h-2 ${kpi.color} ${kpi.glow}`} style={{ width: `${kpiProgress}%` }} />
            </div>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border px-2 py-1 rounded text-xs text-gray-800 hover:border-pink-400 transition focus:ring-2 focus:ring-yellow-300"
          />
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-[260px] bg-gradient-to-b from-white to-gray-100 border-r p-4 space-y-4 shadow-lg">
          <h2 className="text-sm font-semibold text-gray-700">✨ Scan QC</h2>
          <input
            ref={inputRef}
            value={qcCode}
            onChange={(e) => setQcCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Scan..."
            className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all shadow-md"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white py-2 rounded text-sm font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {loading ? "⏳ Loading..." : "✅ Submit"}
          </button>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Total: {countToday}</p>
            <p>Avg: {avgTime.toFixed(2)}s</p>
            <p>KPI: {kpiProgress}%</p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col">
          {/* SEARCH */}
          <div className="p-3 bg-gradient-to-r from-white to-gray-50 border-b shadow-md">
            <input
              placeholder="🔍 Search QC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-pink-300 transition shadow-sm"
            />
          </div>

          {/* TABLE */}
          <div className={`flex-1 overflow-y-auto bg-white transition ${flash ? "bg-green-50 animate-pulse" : ""}`}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gradient-to-r from-gray-200 via-gray-100 to-white text-gray-700 shadow-md">
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">QC Code</th>
                  <th className="p-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((qc, index) => (
                  <tr
                    key={qc.id}
                    className={`border-t hover:bg-indigo-50 transition-all duration-300 ${
                      index === 0 ? "bg-green-100 animate-pulse" : ""
                    }`}
                  >
                    <td className="p-2">{qc.id}</td>
                    <td className="p-2 font-semibold tracking-wide text-indigo-700">{qc.qcCode}</td>
                    <td className="p-2 text-gray-500">{new Date(qc.scanTime).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
