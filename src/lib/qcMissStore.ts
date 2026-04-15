import type { MissQcRecord } from "@/services/qcService";

let missRecords: MissQcRecord[] = [];

export const addMissRecord = (record: MissQcRecord) => {
  missRecords = [record, ...missRecords.filter((item) => item.qcCode !== record.qcCode)];
};

export const getMissRecords = () => missRecords;

export const resetMissRecords = () => {
  missRecords = [];
};