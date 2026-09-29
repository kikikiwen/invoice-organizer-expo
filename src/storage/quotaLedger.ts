import * as FileSystem from "expo-file-system/legacy";

import { FREE_SAVE_CREDITS } from "../constants/billing";

export type QuotaSnapshot = {
  credits: number;
  subscriptionExpiresAt: number | null;
};

type QuotaFile = QuotaSnapshot & {
  grantedTransactionIds: string[];
  revision?: number;
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

function parseQuota(raw: string): QuotaFile | null {
  try {
    const data = JSON.parse(raw) as Partial<QuotaFile>;
    if (
      !Number.isSafeInteger(data.credits) || (data.credits ?? -1) < 0 ||
      (data.revision !== undefined &&
        (!Number.isSafeInteger(data.revision) || data.revision < 0)) ||
      (data.subscriptionExpiresAt != null &&
        (typeof data.subscriptionExpiresAt !== "number" || !Number.isFinite(data.subscriptionExpiresAt))) ||
      (data.grantedTransactionIds !== undefined &&
        (!Array.isArray(data.grantedTransactionIds) ||
          !data.grantedTransactionIds.every((id) => typeof id === "string")))
    ) {
      return null;
    }

    const grantedTransactionIds = Array.isArray(data.grantedTransactionIds)
      ? data.grantedTransactionIds.filter((id): id is string => typeof id === "string")
      : [];

    return {
      credits: data.credits!,
      revision: data.revision ?? 0,
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

  const latest = await latestStoredQuota(path);
  if (latest) {
    return latest.file;
  }
  const created = freshQuota();
  await writeQuotaFile(created);
  return created;
}

async function latestStoredQuota(path: string): Promise<{
  path: string;
  file: QuotaFile;
} | null> {
  let latest: { path: string; file: QuotaFile } | null = null;
  let found = false;
  for (const candidate of [path, `${path}.backup`]) {
    if (!(await FileSystem.getInfoAsync(candidate)).exists) {
      continue;
    }
    found = true;
    const file = parseQuota(await FileSystem.readAsStringAsync(candidate));
    if (file && (!latest || (file.revision ?? 0) > (latest.file.revision ?? 0))) {
      latest = { path: candidate, file };
    }
  }
  if (found && !latest) {
    throw new Error("Quota ledger is damaged; original files have been preserved");
  }
  return latest;
}

async function writeQuotaFile(file: QuotaFile): Promise<void> {
  const path = quotaPath();
  if (!path) {
    memoryQuota = file;
    return;
  }

  const latest = await latestStoredQuota(path);
  // Never overwrite the newest valid snapshot: interrupted writes leave it intact.
  const destination = latest?.path === path ? `${path}.backup` : path;
  const raw = JSON.stringify({ ...file, revision: (latest?.file.revision ?? 0) + 1 });
  if (!parseQuota(raw)) {
    throw new Error("Invalid quota ledger update");
  }
  await FileSystem.writeAsStringAsync(destination, raw);
  if (await FileSystem.readAsStringAsync(destination) !== raw) {
    throw new Error("Quota ledger write verification failed");
  }
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
