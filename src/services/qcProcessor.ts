import axios from "axios";
import { execFile } from "child_process";
import { promisify } from "util";

export type QcUpdateType = "PASS" | "FAIL" | "MISS";

export interface QcProcessAuthHeaders {
  cookie?: string;
  csrfToken?: string;
  xsrfToken?: string;
  bxUa?: string;
  bxUmidToken?: string;
  eagleeyePappname?: string;
  eagleeyeSessionid?: string;
  eagleeyeTraceid?: string;
}

export interface QcProcessResult {
  qcCode: string;
  fulfillmentType: string;
  mappedType: QcUpdateType;
  updateStatus: "success" | "fail" | "miss";
  attempts: number;
}

const LAZ_VALIDATE_URL = "https://www.lazlogistics.vn/api/rms/logisticClosure/validate";
const REQUEST_TIMEOUT_MS = 15000;
const execFileAsync = promisify(execFile);
const HARDCODED_XSRF_TOKEN = "718ae40f-9215-4946-a11f-30e4bbd1c457";
const HARDCODED_BX_UMIDTOKEN = "T2gAGNaCYfUdt3ePs1O3C3s-TORpBm8Det5-S4xmIt58n6O0jlSqsDZraw2a0C7FPr4=";
const HARDCODED_BX_UA = "231!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";
const HARDCODED_COOKIE = "LAP_DEVICE_ID=6156cc4a-7f20-4d16-bf5a-f6e9e705cf43; SSO_LANG_V2=zh-CN; cna=qTFYIguX2RACAXsV4tpGGYLE; _bl_uid=4hmzgnI6kswkk5wtkinq3tg8OOt5; logistics-adminportal_USER_COOKIE_V3=ST169.gXK_QoQoJIE_0RXvi-sPM6Ldl0xs0CgJdrb7TJgeG-DX_jo4mSleV1o5sPdWU9LmA9omW2J1HMHgl2GoumUyuIl_DCXOcwwQJSIDNfoMc6F_1gwGh4GOKm95uPti6FTOfkWUzCwU9XkEb5D-LNzVC6kFypjE8PvvUFmz1IcnXxOLzVBzGs7TNINChBbWYAuDfOQ5pZSa6ZvVxwOkjUxcogAPRr8lbn1f0YCYzUGvH50y6V96A0OsmuPF--KC1lCMmEbennB0Y4tA4cgIXE9gYtw_5oGxI8tzzCjB-kO3yfnQ0fJn-No8dDCCA4nAyfhe0MquBWF7uQfGgu6xXycYrkcanNQcu-ck8SbW_mLV99QRqZboCuqI6tYBkarS3pGkLSGVG-qrWvDRK8QZb0AllzXfal6MgFK9wzQUfE4pxKKXgguHjpw3HkhQsKNoXzxY3FBwV5Xv2ktb3srh8Ex4urxMLxVX3EL0CaodHFHHtJI.jjVjaGk4x58LIDP-iCavg-73U0omPtDbsPE0VF4H16rvF7MJ-OL7PQRA4F4vhjv-X6INhxXxcLiEW_6AQSKunryH9ElFcM3qEAevMaaN6qR9j6QkWsRn0Vv22mFRvL0PMuBKxqx9-VHklkko7enXOi2HeZ4oy8tDU3XbjiDjb2a-6pAUHBw1h8akJLmHTlvV860HJbdIWX6HiSL0_SZriY3uSmJku8MHIjzizQ_SQBMzBOOXamILFJ1u0lwGTqH51T6tdjFnfUhB07VZprx9eXeGQopTwGaaUQk7Hd1IPqUc5owYixdTyVGztWJGy-VNCFmNjsBsbfp2SKgXeX75yA; logistics-adminportal_SSO_TOKEN_V3=ST169.eyJ0aW1lIjoxNzc2MjY2MDE4ODg2LCJ0b2tlbiI6ImIxM2VkOThmMWEzNDRhZTQ5YTkxNmJiZGVkYjVmZTUyMWViYTkxMDEifQ.t1Z1yS61mOs8lAch81Ce6hirwsNxRhO6mchVyv29162g1dNh744y9isJ_WjoZlLov-83p2zExDlnWKiD0cNBYSb92bTgmO1KJYP0G-xSZ7eLE7loTbZZhJ9FZwW-GTodttnOMUhp96uabjPh1aIqFQrL4NzO7xHTCPZriKdPxuomsQIjH_ISeig2RoQZvuiomH2oLYECSnmNet0HqsgzRb96H_qSndpoGJSE6CnMF2ufRMXjDON6O1GEsrNuEE_lSQUMkwhGASSebFU6sNozspC10YFuJFPUlrzTYAnrtbZoJJS12F-GtxrvNpZM3PQVBT41EJ_feMegsDmmM8V8uw; XSRF-TOKEN=718ae40f-9215-4946-a11f-30e4bbd1c457; unique_id=qTFYIguX2RACAXsV4tpGGYLE; x-hng=region=VN&lang=en-US&currency=VND&tz=GMT+7; xlly_s=1; isg=BLW1YXJ4MKsI41QZ5CCaVXuJxDFvMmlEkh5wBDfaiyx7DtEA_YKqFCPIWMo4ToH8; tfstk=gG-Ec3qvrDneWvGD3Kjr7OWgpkjdDglft315ELvld6f3AkNk7CdzFgsBA05kHB-QALXWzCJy_k1HNMNr4LvDdHGpNQ5khLTBaLHdE_Aka_TI5m9ppgIoGQojcpE4JL-WTabhjYXPFuD1-0JzlqSoGji_E3I6IgvI6CXBIdfOUTVlZQ2gI1B0Zgfhr54Gn1flqQflSOXfHy23qu2iQTCGEgjkZGDNF1flqgAkIA0lrZrNewDUT20wTv2O-svh_uq469Q35pz7moDcKN5cS1rlChWF8svHma87iOx6bZ__FfSMHFOhQioUM98M3MXy2x4Paa-dbT8tTyO29TvG7BM7yO8yEnId08mHQM5Fo3RgnlRDQLYf7hMmDMShtUspF-lBQHRBphJ7EPjFAF72YimYt_T633Wy2bnwgLvvrN-zTgu8wObao3LUZz7hBO5jQAJ7Jsl-2Ox_IzURR5BNGvD3yzQhBO5jQAz8ywgOQsMnK";

const getInternalBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};

const mapFulfillmentTypeToUpdateType = (fulfillmentType: string): QcUpdateType => {
  return fulfillmentType === "crossborder" ? "PASS" : "FAIL";
};

const buildValidateHeaders = (auth: QcProcessAuthHeaders) => {
  const headers: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,vi;q=0.8",
    "bx-ua": HARDCODED_BX_UA,
    "bx-umidtoken": HARDCODED_BX_UMIDTOKEN,
    "bx-v": "2.5.0",
    cookie: HARDCODED_COOKIE,
    "content-type": "application/json",
    "eagleeye-pappname": "hyey0hz67v@18e9f83864cdaf5",
    "eagleeye-sessionid": "3Xmm0ozn0jv65Xyn9jwqrCzs2bRd",
    "eagleeye-traceid": "d5d7fd7217762661010421004cdaf5",
    origin: "https://www.lazlogistics.vn",
    priority: "u=1, i",
    referer: "https://www.lazlogistics.vn/rms/logisticclosure",
    "sec-ch-ua": '"Microsoft Edge";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0",
    "x-csrf-token": HARDCODED_XSRF_TOKEN,
    "x-xsrf-token": HARDCODED_XSRF_TOKEN,
  };

  return Object.fromEntries(
    Object.entries(headers).filter(([, value]) => value.trim().length > 0),
  );
};

const extractFulfillmentType = (payload: any): string => {
  return (
    payload?.data?.fulfillmentType ??
    payload?.result?.data?.fulfillmentType ??
    payload?.result?.fulfillmentType ??
    payload?.fulfillmentType ??
    ""
  );
};

const quoteCurlArg = (value: string) => {
  return `"${value.replace(/"/g, '\\"')}"`;
};

const buildCurlCommand = (args: string[]) => {
  return [`curl`, ...args.map((arg) => quoteCurlArg(arg))].join(" ");
};

const runLazadaValidateCurl = async (qcCode: string) => {
  const args = [
    LAZ_VALIDATE_URL,
    "-H",
    "accept: application/json, text/plain, */*",
    "-H",
    "accept-language: en-US,en;q=0.9,vi;q=0.8",
    "-H",
    `bx-ua: ${HARDCODED_BX_UA}`,
    "-H",
    `bx-umidtoken: ${HARDCODED_BX_UMIDTOKEN}`,
    "-H",
    "bx-v: 2.5.0",
    "-H",
    "content-type: application/json",
    "-b",
    HARDCODED_COOKIE,
    "-H",
    "eagleeye-pappname: hyey0hz67v@18e9f83864cdaf5",
    "-H",
    "eagleeye-sessionid: 3Xmm0ozn0jv65Xyn9jwqrCzs2bRd",
    "-H",
    "eagleeye-traceid: d5d7fd7217762661010421004cdaf5",
    "-H",
    "origin: https://www.lazlogistics.vn",
    "-H",
    "priority: u=1, i",
    "-H",
    "referer: https://www.lazlogistics.vn/rms/logisticclosure",
    "-H",
    'sec-ch-ua: "Microsoft Edge";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    "-H",
    "sec-ch-ua-mobile: ?0",
    "-H",
    'sec-ch-ua-model: ""',
    "-H",
    'sec-ch-ua-platform: "Windows"',
    "-H",
    "sec-fetch-dest: empty",
    "-H",
    "sec-fetch-mode: cors",
    "-H",
    "sec-fetch-site: same-origin",
    "-H",
    "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0",
    "-H",
    `x-csrf-token: ${HARDCODED_XSRF_TOKEN}`,
    "-H",
    `x-xsrf-token: ${HARDCODED_XSRF_TOKEN}`,
    "--data-raw",
    JSON.stringify({
      data: {
        identifier: qcCode,
      },
    }),
  ];

  console.log("Lazada validate curl:", buildCurlCommand(args));

  const { stdout, stderr } = await execFileAsync("curl", args, {
    timeout: REQUEST_TIMEOUT_MS,
    maxBuffer: 1024 * 1024,
  });

  if (stderr && stderr.trim()) {
    console.log("Lazada curl stderr:", stderr);
  }

  return JSON.parse(stdout || "{}");
};

const validateFulfillmentType = async (qcCode: string, auth: QcProcessAuthHeaders) => {
  try {
    const curlData = await runLazadaValidateCurl(qcCode);
    const fulfillmentTypeFromCurl = extractFulfillmentType(curlData);
    console.log("Lazada validate response (curl):", curlData);

    if (fulfillmentTypeFromCurl) {
      return fulfillmentTypeFromCurl;
    }
  } catch (curlError) {
    console.error("Lazada validate curl failed, fallback to axios", curlError);
  }

  const response = await axios.post(
    LAZ_VALIDATE_URL,
    {
      data: {
        identifier: qcCode,
      },
    },
    {
      headers: buildValidateHeaders(auth),
      timeout: REQUEST_TIMEOUT_MS,
      withCredentials: true,
    },
  );

  const fulfillmentType = extractFulfillmentType(response.data);
  console.log("Lazada validate response (axios fallback):", response.data);
  return fulfillmentType;
};

const updateType = async (qcCode: string, type: QcUpdateType) => {
  await axios.put(
    `${getInternalBaseUrl()}/api/qc/update-type`,
    {
      qcCode,
      type,
    },
    {
      headers: {
        "content-type": "application/json",
      },
      timeout: REQUEST_TIMEOUT_MS,
      withCredentials: true,
    },
  );
};

const updateTypeWithRetry = async (qcCode: string, type: QcUpdateType) => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await updateType(qcCode, type);
      console.log("QC update status:", "success", { qcCode, type, attempt });
      return {
        status: "success" as const,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;
      console.error(`QC update failed on attempt ${attempt}`, error);
    }
  }

  try {
    await updateType(qcCode, "MISS");
    console.log("QC update status:", "miss", { qcCode, type: "MISS" });
    return {
      status: "miss" as const,
      attempts: 3,
    };
  } catch (missError) {
    console.error("QC update MISS failed", missError);
    throw lastError ?? missError;
  }
};

export async function processQC(qcCode: string, auth: QcProcessAuthHeaders = {}): Promise<QcProcessResult> {
  const normalizedQcCode = qcCode.trim();

  if (!normalizedQcCode) {
    throw new Error("qcCode is required");
  }

  try {
    const fulfillmentType = await validateFulfillmentType(normalizedQcCode, auth);
    console.log("QC fulfillmentType:", fulfillmentType);

    const mappedType = mapFulfillmentTypeToUpdateType(fulfillmentType);
    console.log("QC mapped type:", mappedType);

    const updateResult = await updateTypeWithRetry(normalizedQcCode, mappedType);

    return {
      qcCode: normalizedQcCode,
      fulfillmentType,
      mappedType,
      updateStatus: updateResult.status,
      attempts: updateResult.attempts,
    };
  } catch (error) {
    console.error("processQC failed", error);
    throw error;
  }
}