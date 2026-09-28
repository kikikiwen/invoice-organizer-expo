import * as FileSystem from "expo-file-system/legacy";

import { FREE_SAVE_CREDITS } from "../constants/billing";

export type QuotaSnapshot = {
  credits: number;
  subscriptionExpiresAt: number | null;
};

type QuotaFile = QuotaSnapshot & {
  grantedTransactionIds: string[];
};

const MAX_TRANSACTION_IDS = 200;

let writeChain: Promise<void> = Promise.resolve();
let memoryQuota: QuotaFile | null = null;

function quotaPath(): string | null {
  if (!FileSystem.documentDirectory) {
    return null;
  }
  return `${FileSystem.documentDirectory}quota.json`;
}

function freshQuota(): QuotaFile {
  return {
    credits: FREE_SAVE_CREDITS,
    subscriptionExpiresAt: null,
    grantedTransactionIds: [],
  };
}

function emptyQuota(): QuotaFile {
  return {
    credits: 0,
    subscriptionExpiresAt: null,
    grantedTransactionIds: [],
  };
}

function parseQuota(raw: string): QuotaFile | null {
  try {
    const data = JSON.parse(raw) as Partial<QuotaFile>;
    if (typeof data.credits !== "number" || !Number.isFinite(data.credits)) {
      return null;
    }

    const grantedTransactionIds = Array.isArray(data.grantedTransactionIds)
      ? data.grantedTransactionIds.filter((id): id is string => typeof id === "string")
      : [];

    return {
      credits: Math.max(0, Math.floor(data.credits)),
      subscriptionExpiresAt:
        typeof data.subscriptionExpiresAt === "number"
          ? data.subscriptionExpiresAt
          : null,
      grantedTransactionIds,
    };
  } catch {
    return null;
  }
}

function snapshotOf(file: QuotaFile): QuotaSnapshot {
  return {
    credits: file.credits,
    subscriptionExpiresAt: file.subscriptionExpiresAt,
  };
}

export function isCachedUnlimited(
  snapshot: QuotaSnapshot,
  now = Date.now(),
): boolean {
  return (
    snapshot.subscriptionExpiresAt != null &&
    snapshot.subscriptionExpiresAt > now
  );
}

async function readQuotaFile(): Promise<QuotaFile> {
  const path = quotaPath();
  if (!path) {
    memoryQuota ??= freshQuota();
    return memoryQuota;
  }

  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    const created = freshQuota();
    await writeQuotaFile(created);
    return created;
  }

  const raw = await FileSystem.readAsStringAsync(path);
  return parseQuota(raw) ?? emptyQuota();
}

async function writeQuotaFile(file: QuotaFile): Promise<void> {
  const path = quotaPath();
  if (!path) {
    memoryQuota = file;
    return;
  }

  await FileSystem.writeAsStringAsync(path, JSON.stringify(file));
}

function withQuotaLock<T>(task: () => Promise<T>): Promise<T> {
  const run = writeChain.then(task, task);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function loadQuota(): Promise<QuotaSnapshot> {
  return withQuotaLock(async () => snapshotOf(await readQuotaFile()));
}

export function tryConsumeCredit(): Promise<{
  consumed: boolean;
  snapshot: QuotaSnapshot;
}> {
  return withQuotaLock(async () => {
    const file = await readQuotaFile();
    if (file.credits <= 0) {
      return { consumed: false, snapshot: snapshotOf(file) };
    }

    file.credits -= 1;
    await writeQuotaFile(file);
    return { consumed: true, snapshot: snapshotOf(file) };
  });
}

export function grantPackCredits(
  transactionId: string,
  amount: number,
): Promise<{ granted: number; snapshot: QuotaSnapshot }> {
  return withQuotaLock(async () => {
    const file = await readQuotaFile();
    if (file.grantedTransactionIds.includes(transactionId) || amount <= 0) {
      return { granted: 0, snapshot: snapshotOf(file) };
    }

    file.credits += amount;
    file.grantedTransactionIds.push(transactionId);
    if (file.grantedTransactionIds.length > MAX_TRANSACTION_IDS) {
      file.grantedTransactionIds.splice(
        0,
        file.grantedTransactionIds.length - MAX_TRANSACTION_IDS,
      );
    }
    await writeQuotaFile(file);
    return { granted: amount, snapshot: snapshotOf(file) };
  });
}

export function setSubscriptionExpiry(
  subscriptionExpiresAt: number | null,
): Promise<QuotaSnapshot> {
  return withQuotaLock(async () => {
    const file = await readQuotaFile();
    file.subscriptionExpiresAt = subscriptionExpiresAt;
    await writeQuotaFile(file);
    return snapshotOf(file);
  });
}
