// src/services/qcService.ts

import axios from 'axios';
import axiosInstance from '@/utils/axiosInstance';

export interface QCItem {
  id: number;
  qcCode: string;
  scanTime: string;
  employeeId: number;
}

export interface DashboardResponse {
  total: number;
  avgSpeed: number;
  kpiPercent: number;
  items: QCItem[];
}

export interface KpiConfig {
  targetPerHour: number;
  workingHours: number;
}

export interface KpiConfigPayload {
  employeeId: number;
  date: string;
  targetPerHour: number;
  workingHours: number;
}

export interface LeaderboardItem {
  employeeId: number;
  employeeName: string;
  total: number;
}

export interface QcProcessResult {
  qcCode: string;
  fulfillmentType: string;
  mappedType: 'PASS' | 'FAIL' | 'MISS';
  updateStatus: 'success' | 'fail' | 'miss';
  attempts: number;
}

export interface MissQcRecord extends QcProcessResult {
  checkedAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

const qcAxios = axios.create({
  baseURL: ' https://causal-jawfish-immune.ngrok-free.app/v1/api/qc',
});

export const qcService = {
  async scanQC(payload: { qcCode: string; employeeId: number }): Promise<QCItem> {
    const response = await qcAxios.post<ApiResponse<QCItem>>('/scan', payload);
    return response.data.result;
  },

  async getDashboard(employeeId: number, date: string): Promise<DashboardResponse> {
    const response = await qcAxios.get<ApiResponse<DashboardResponse>>(`/dashboard?employeeId=${employeeId}&date=${date}`);
    return response.data.result;
  },

  async searchQC(employeeId: number, keyword: string): Promise<QCItem[]> {
    const response = await qcAxios.get<ApiResponse<QCItem[]>>(`/search?employeeId=${employeeId}&keyword=${keyword}`);
    return response.data.result;
  },

  async deleteQC(id: number, employeeId: number): Promise<void> {
    await qcAxios.delete(`/delete/${id}?employeeId=${employeeId}`);
  },

  async initQC(employeeId: number, value: number): Promise<void> {
    await qcAxios.post(`/init?employeeId=${employeeId}&value=${value}`);
  },

  async getKpiConfig(employeeId: number, date: string): Promise<KpiConfig> {
    const response = await qcAxios.get<ApiResponse<KpiConfig>>(`/kpi-config?employeeId=${employeeId}&date=${date}`);
    return response.data.result;
  },

  async saveKpiConfig(config: KpiConfigPayload): Promise<void> {
    await qcAxios.post('/kpi-config', config);
  },

  async getLeaderboard(date: string): Promise<LeaderboardItem[]> {
    const response = await qcAxios.get<ApiResponse<LeaderboardItem[]>>(`/leaderboard?date=${date}`);
    return response.data.result;
  },

  async processQC(qcCode: string): Promise<QcProcessResult> {
    const response = await axiosInstance.post<{ success: boolean; result: QcProcessResult }>(
      '/api/qc/process',
      { qcCode },
    );

    return response.data.result;
  },

  async getMissQcList(): Promise<MissQcRecord[]> {
    const response = await axiosInstance.get<{ success: boolean; result: MissQcRecord[] }>('/api/qc/type/miss');
    return response.data.result ?? [];
  },
};
