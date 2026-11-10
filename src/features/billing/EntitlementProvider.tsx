import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Alert, AppState, Platform } from "react-native";
import {
  ErrorCode,
  finishTransaction,
  getAvailablePurchases,
  isUserCancelledError,
  useIAP,
  type Purchase,
} from "expo-iap";

import { PaywallSheet } from "../../components/billing/PaywallSheet";
import {
  PHOTO_PACK_30_ID,
  PHOTO_PACK_LARGE_ID,
} from "../../constants/billing";
import { useI18n, type Strings } from "../../i18n";
import {
  isReadyPurchase,
  packCreditAmount,
  purchaseTransactionId,
} from "../../services/purchaseFulfillment";
import {
  grantPackCredits,
  loadQuota,
  tryConsumeCredit,
  type QuotaSnapshot,
} from "../../storage/quotaLedger";

type PendingSave = {
  count: number;
  resolve: (allowed: boolean) => void;
};

type EntitlementContextValue = {
  credits: number | null;
  openPaywall: () => void;
  canStartCapture: () => Promise<boolean>;
  requestSave: (count: number) => Promise<boolean>;
  saveWithinAllowance: (
    uris: string[],
    saveOne: (uri: string) => Promise<void>,
  ) => Promise<{ saved: number; blocked: boolean; quotaError: boolean }>;
};

type SaveAllowance = ReturnType<typeof useSaveAllowance>;

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function useEntitlement(): EntitlementContextValue {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error("useEntitlement must be used within EntitlementProvider");
  }
  return context;
}

function useSaveAllowance() {
  const strings = useI18n();
  const [credits, setCredits] = useState<number | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const pendingRef = useRef<PendingSave | null>(null);

  const apply = useCallback((snapshot: QuotaSnapshot) => {
    setCredits(snapshot.credits);
  }, []);

  const settlePending = useCallback((nextCredits: number) => {
    const pending = pendingRef.current;
    if (!pending) {
      return;
    }
    if (nextCredits >= pending.count) {
      pending.resolve(true);
      pendingRef.current = null;
      setPaywallVisible(false);
    }
  }, []);

  const applyAndSettle = useCallback(
    (snapshot: QuotaSnapshot) => {
      apply(snapshot);
      settlePending(snapshot.credits);
    },
    [apply, settlePending],
  );

  useEffect(() => {
    let active = true;
    void loadQuota().then((snapshot) => {
      if (active) {
        apply(snapshot);
      }
    }).catch(() => {
      if (active) {
        Alert.alert(strings.errorTitle, strings.loadDataFailed);
      }
    });
    return () => {
      active = false;
    };
  }, [apply, strings]);

  const openPaywall = useCallback(() => {
    setPaywallVisible(true);
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallVisible(false);
    const pending = pendingRef.current;
    if (pending) {
      pending.resolve(false);
      pendingRef.current = null;
    }
  }, []);

  const canStartCapture = useCallback(async () => {
    const snapshot = await loadQuota();
    apply(snapshot);
    return snapshot.credits > 0;
  }, [apply]);

  const requestSave = useCallback(
    async (count: number) => {
      const snapshot = await loadQuota();
      apply(snapshot);
      if (snapshot.credits >= count) {
        return true;
      }

      return new Promise<boolean>((resolve) => {
        pendingRef.current = { count, resolve };
        setPaywallVisible(true);
      });
    },
    [apply],
  );

  const saveWithinAllowance = useCallback(
    async (uris: string[], saveOne: (uri: string) => Promise<void>) => {
      let saved = 0;
      let blocked = false;
      let quotaError = false;

      for (const uri of uris) {
        try {
          const snapshot = await loadQuota();
          apply(snapshot);
          if (snapshot.credits <= 0) {
            blocked = true;
            break;
          }
        } catch {
          quotaError = true;
          break;
        }

        try {
          await saveOne(uri);
        } catch {
          continue;
        }

        saved += 1;
        try {
          const consumed = await tryConsumeCredit();
          apply(consumed.snapshot);
          if (!consumed.consumed) {
            quotaError = true;
            break;
          }
        } catch {
          // Keep the saved photo and stop: a failed write may already have committed.
          quotaError = true;
          break;
        }
      }

      return { saved, blocked, quotaError };
    },
    [apply],
  );

  return {
    credits,
    paywallVisible,
    openPaywall,
    closePaywall,
    canStartCapture,
    requestSave,
    saveWithinAllowance,
    applyAndSettle,
  };
}

function displayPriceFor(
  items: Array<{ id: string; displayPrice: string }>,
  id: string,
): string | null {
  return items.find((item) => item.id === id)?.displayPrice ?? null;
}

function NativeEntitlementProvider({ children }: { children: ReactNode }) {
  const strings = useI18n();
  const stringsRef = useRef(strings);
  stringsRef.current = strings;
  const [purchasing, setPurchasing] = useState(false);
  const allowance = useSaveAllowance();
  const allowanceRef = useRef(allowance);
  allowanceRef.current = allowance;

  const fulfill = useCallback(async (purchase: Purchase) => {
    if (!isReadyPurchase(purchase)) {
      return 0;
    }

    const amount = packCreditAmount(purchase.productId, purchase.quantity);
    if (amount == null) {
      return 0;
    }

    const granted = await grantPackCredits(
      purchaseTransactionId(purchase),
      amount,
    );
    allowanceRef.current.applyAndSettle(granted.snapshot);
    try {
      await finishTransaction({ purchase, isConsumable: true });
    } catch {
      // The transaction id is already stored, so a later retry will not add credits twice.
    }
    return granted.granted;
  }, []);

  const refreshStore = useCallback(async () => {
    const purchases = await getAvailablePurchases();
    let granted = 0;
    for (const purchase of purchases) {
      granted += await fulfill(purchase);
    }
    return { granted };
  }, [fulfill]);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      setPurchasing(false);
      void fulfill(purchase)
        .then(() => refreshStore())
        .catch(() => Alert.alert(stringsRef.current.errorTitle, stringsRef.current.purchaseFailed));
    },
    onPurchaseError: (error) => {
      setPurchasing(false);
      if (isUserCancelledError(error)) {
        return;
      }
      if (error.code === ErrorCode.AlreadyOwned) {
        void refreshStore().catch(() => undefined);
        return;
      }
      Alert.alert(
        stringsRef.current.errorTitle,
        stringsRef.current.purchaseFailed,
      );
    },
  });

  useEffect(() => {
    if (!connected) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        await fetchProducts({
          skus: [PHOTO_PACK_30_ID, PHOTO_PACK_LARGE_ID],
          type: "in-app",
        });
        if (!cancelled) {
          await refreshStore();
        }
      } catch {
        // The paywall still opens when the store catalog is not ready.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, fetchProducts, refreshStore]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && connected) {
        void refreshStore().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [connected, refreshStore]);

  const largePackPrice = displayPriceFor(products, PHOTO_PACK_LARGE_ID);
  const pack30Price = displayPriceFor(products, PHOTO_PACK_30_ID);
  const largePackDisabled = !connected || largePackPrice == null;

  const buy = useCallback(
    async (productId: string) => {
      if (!connected) {
        Alert.alert(
          stringsRef.current.errorTitle,
          stringsRef.current.purchasesUnavailable,
        );
        return;
      }

      setPurchasing(true);
      try {
        await requestPurchase({
          type: "in-app",
          request: {
            apple: { sku: productId },
            google: { skus: [productId] },
          },
        });
      } catch (error) {
        setPurchasing(false);
        if (isUserCancelledError(error)) {
          return;
        }
        Alert.alert(
          stringsRef.current.errorTitle,
          stringsRef.current.purchaseFailed,
        );
      }
    },
    [connected, requestPurchase],
  );

  const offers = useMemo(
    () =>
      buildOffers({
        strings,
        largePackPrice,
        pack30Price,
        largePackDisabled,
        packsDisabled: !connected,
      }),
    [connected, largePackDisabled, largePackPrice, pack30Price, strings],
  );

  const value = useEntitlementValue(allowance);

  return (
    <EntitlementContext.Provider value={value}>
      {children}
      <PaywallSheet
        visible={allowance.paywallVisible}
        credits={allowance.credits}
        offers={offers}
        purchasing={purchasing}
        storeAvailable
        onBuy={(productId) => {
          void buy(productId);
        }}
        onClose={allowance.closePaywall}
      />
    </EntitlementContext.Provider>
  );
}

function WebEntitlementProvider({ children }: { children: ReactNode }) {
  const strings = useI18n();
  const allowance = useSaveAllowance();
  const offers = useMemo(
    () =>
      buildOffers({
        strings,
        largePackPrice: null,
        pack30Price: null,
        largePackDisabled: true,
        packsDisabled: true,
      }),
    [strings],
  );
  const value = useEntitlementValue(allowance);

  return (
    <EntitlementContext.Provider value={value}>
      {children}
      <PaywallSheet
        visible={allowance.paywallVisible}
        credits={allowance.credits}
        offers={offers}
        purchasing={false}
        storeAvailable={false}
        onBuy={() => undefined}
        onClose={allowance.closePaywall}
      />
    </EntitlementContext.Provider>
  );
}

function useEntitlementValue(allowance: SaveAllowance): EntitlementContextValue {
  return useMemo(
    () => ({
      credits: allowance.credits,
      openPaywall: allowance.openPaywall,
      canStartCapture: allowance.canStartCapture,
      requestSave: allowance.requestSave,
      saveWithinAllowance: allowance.saveWithinAllowance,
    }),
    [
      allowance.canStartCapture,
      allowance.credits,
      allowance.openPaywall,
      allowance.requestSave,
      allowance.saveWithinAllowance,
    ],
  );
}

function buildOffers({
  strings,
  largePackPrice,
  pack30Price,
  largePackDisabled,
  packsDisabled,
}: {
  strings: Strings;
  largePackPrice: string | null;
  pack30Price: string | null;
  largePackDisabled: boolean;
  packsDisabled: boolean;
}) {
  return [
    {
      id: PHOTO_PACK_LARGE_ID,
      title: strings.packTitle(100_000_000),
      detail: "",
      price: largePackPrice,
      primary: true,
      disabled: largePackDisabled,
    },
    {
      id: PHOTO_PACK_30_ID,
      title: strings.packTitle(30),
      detail: "",
      price: pack30Price,
      disabled: packsDisabled || pack30Price == null,
    },
  ];
}

export function EntitlementProvider({ children }: { children: ReactNode }) {
  if (Platform.OS === "web") {
    return <WebEntitlementProvider>{children}</WebEntitlementProvider>;
  }
  return <NativeEntitlementProvider>{children}</NativeEntitlementProvider>;
}
