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
  deepLinkToSubscriptions,
  finishTransaction,
  getActiveSubscriptions,
  getAvailablePurchases,
  isUserCancelledError,
  useIAP,
  type ActiveSubscription,
  type ProductSubscription,
  type Purchase,
} from "expo-iap";

import { PaywallSheet } from "../../components/billing/PaywallSheet";
import {
  ANDROID_PACKAGE,
  PHOTO_PACK_100_ID,
  PHOTO_PACK_30_ID,
  SUBSCRIPTION_OFFLINE_WINDOW_MS,
  UNLIMITED_MONTHLY_ID,
} from "../../constants/billing";
import { useI18n, type Strings } from "../../i18n";
import {
  isReadyPurchase,
  isUnlimitedProduct,
  packCreditAmount,
  purchaseTransactionId,
} from "../../services/purchaseFulfillment";
import {
  grantPackCredits,
  isCachedUnlimited,
  loadQuota,
  setSubscriptionExpiry,
  tryConsumeCredit,
  type QuotaSnapshot,
} from "../../storage/quotaLedger";

type PendingSave = {
  count: number;
  resolve: (allowed: boolean) => void;
};

type EntitlementContextValue = {
  credits: number | null;
  unlimited: boolean;
  openPaywall: () => void;
  canStartCapture: () => Promise<boolean>;
  requestSave: (count: number) => Promise<boolean>;
  saveWithinAllowance: (
    uris: string[],
    saveOne: (uri: string) => Promise<void>,
  ) => Promise<{ saved: number; blocked: boolean }>;
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

function useSaveAllowance(storeUnlimited: boolean | null) {
  const [credits, setCredits] = useState<number | null>(null);
  const [cachedUnlimited, setCachedUnlimited] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const pendingRef = useRef<PendingSave | null>(null);
  const storeUnlimitedRef = useRef(storeUnlimited);
  const cachedUnlimitedRef = useRef(false);

  storeUnlimitedRef.current = storeUnlimited;

  const currentlyUnlimited = useCallback(() => {
    if (storeUnlimitedRef.current != null) {
      return storeUnlimitedRef.current;
    }
    return cachedUnlimitedRef.current;
  }, []);

  const acknowledgeStore = useCallback((active: boolean) => {
    storeUnlimitedRef.current = active;
  }, []);

  const apply = useCallback((snapshot: QuotaSnapshot) => {
    cachedUnlimitedRef.current = isCachedUnlimited(snapshot);
    setCachedUnlimited(cachedUnlimitedRef.current);
    setCredits(snapshot.credits);
  }, []);

  const settlePending = useCallback(
    (nextCredits: number) => {
      const pending = pendingRef.current;
      if (!pending) {
        return;
      }
      if (currentlyUnlimited() || nextCredits >= pending.count) {
        pending.resolve(true);
        pendingRef.current = null;
        setPaywallVisible(false);
      }
    },
    [currentlyUnlimited],
  );

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
    });
    return () => {
      active = false;
    };
  }, [apply]);

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
    return currentlyUnlimited() || snapshot.credits > 0;
  }, [apply, currentlyUnlimited]);

  const requestSave = useCallback(
    async (count: number) => {
      const snapshot = await loadQuota();
      apply(snapshot);
      if (currentlyUnlimited() || snapshot.credits >= count) {
        return true;
      }

      return new Promise<boolean>((resolve) => {
        pendingRef.current = { count, resolve };
        setPaywallVisible(true);
      });
    },
    [apply, currentlyUnlimited],
  );

  const saveWithinAllowance = useCallback(
    async (uris: string[], saveOne: (uri: string) => Promise<void>) => {
      let saved = 0;
      let blocked = false;

      for (const uri of uris) {
        if (!currentlyUnlimited()) {
          const snapshot = await loadQuota();
          apply(snapshot);
          if (snapshot.credits <= 0) {
            blocked = true;
            break;
          }
        }

        try {
          await saveOne(uri);
        } catch {
          continue;
        }

        saved += 1;
        if (!currentlyUnlimited()) {
          const consumed = await tryConsumeCredit();
          apply(consumed.snapshot);
        }
      }

      return { saved, blocked };
    },
    [apply, currentlyUnlimited],
  );

  return {
    credits,
    unlimited: storeUnlimited ?? cachedUnlimited,
    paywallVisible,
    openPaywall,
    closePaywall,
    canStartCapture,
    requestSave,
    saveWithinAllowance,
    applyAndSettle,
    acknowledgeStore,
  };
}

function offerTokenFor(
  subscription: ProductSubscription | undefined,
): string | null {
  for (const offer of subscription?.subscriptionOffers ?? []) {
    if (offer.offerTokenAndroid) {
      return offer.offerTokenAndroid;
    }
  }
  return null;
}

function displayPriceFor(
  items: Array<{ id: string; displayPrice: string }>,
  id: string,
): string | null {
  return items.find((item) => item.id === id)?.displayPrice ?? null;
}

function subscriptionExpiry(subscription: ActiveSubscription): number {
  if (
    subscription.expirationDateIOS != null &&
    subscription.expirationDateIOS > Date.now()
  ) {
    return subscription.expirationDateIOS;
  }
  return Date.now() + SUBSCRIPTION_OFFLINE_WINDOW_MS;
}

function NativeEntitlementProvider({ children }: { children: ReactNode }) {
  const strings = useI18n();
  const stringsRef = useRef(strings);
  stringsRef.current = strings;
  const [storeUnlimited, setStoreUnlimited] = useState<boolean | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const allowance = useSaveAllowance(storeUnlimited);
  const allowanceRef = useRef(allowance);
  allowanceRef.current = allowance;

  const fulfill = useCallback(async (purchase: Purchase) => {
    if (!isReadyPurchase(purchase)) {
      return 0;
    }

    if (isUnlimitedProduct(purchase.productId)) {
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch {
        // An already finished subscription can show up again on the next query.
      }
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

    const active = await getActiveSubscriptions([UNLIMITED_MONTHLY_ID]);
    const current = active.find(
      (item) =>
        item.isActive &&
        (item.productId === UNLIMITED_MONTHLY_ID ||
          item.currentPlanId === UNLIMITED_MONTHLY_ID),
    );

    if (current) {
      const snapshot = await setSubscriptionExpiry(subscriptionExpiry(current));
      allowanceRef.current.acknowledgeStore(true);
      setStoreUnlimited(true);
      allowanceRef.current.applyAndSettle(snapshot);
      return { unlimited: true, granted };
    }

    const snapshot = await setSubscriptionExpiry(null);
    allowanceRef.current.acknowledgeStore(false);
    setStoreUnlimited(false);
    allowanceRef.current.applyAndSettle(snapshot);
    return { unlimited: false, granted };
  }, [fulfill]);

  const {
    connected,
    products,
    subscriptions,
    fetchProducts,
    requestPurchase,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      setPurchasing(false);
      void fulfill(purchase)
        .then(() => refreshStore())
        .catch(() => undefined);
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
          skus: [PHOTO_PACK_30_ID, PHOTO_PACK_100_ID, UNLIMITED_MONTHLY_ID],
          type: "all",
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

  const subscription = subscriptions.find(
    (item) => item.id === UNLIMITED_MONTHLY_ID,
  );
  const offerToken = offerTokenFor(subscription);
  const subscriptionPrice = subscription?.displayPrice ?? null;
  const pack30Price = displayPriceFor(products, PHOTO_PACK_30_ID);
  const pack100Price = displayPriceFor(products, PHOTO_PACK_100_ID);
  const subscribeDisabled =
    !connected ||
    subscriptionPrice == null ||
    (Platform.OS === "android" && offerToken == null);

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
        if (isUnlimitedProduct(productId)) {
          await requestPurchase({
            type: "subs",
            request: {
              apple: { sku: productId },
              google: {
                skus: [productId],
                ...(offerToken
                  ? { subscriptionOffers: [{ sku: productId, offerToken }] }
                  : {}),
              },
            },
          });
          return;
        }

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
    [connected, offerToken, requestPurchase],
  );

  const restore = useCallback(async () => {
    if (!connected) {
      Alert.alert(
        stringsRef.current.errorTitle,
        stringsRef.current.purchasesUnavailable,
      );
      return;
    }

    setPurchasing(true);
    try {
      await restorePurchases();
      const outcome = await refreshStore();
      if (!outcome.unlimited && outcome.granted === 0) {
        Alert.alert(
          stringsRef.current.errorTitle,
          stringsRef.current.restoreEmpty,
        );
      }
    } catch {
      Alert.alert(
        stringsRef.current.errorTitle,
        stringsRef.current.restoreFailed,
      );
    } finally {
      setPurchasing(false);
    }
  }, [connected, refreshStore, restorePurchases]);

  const manage = useCallback(async () => {
    try {
      await deepLinkToSubscriptions({
        skuAndroid: UNLIMITED_MONTHLY_ID,
        packageNameAndroid: ANDROID_PACKAGE,
      });
    } catch {
      Alert.alert(
        stringsRef.current.errorTitle,
        stringsRef.current.purchasesUnavailable,
      );
    }
  }, []);

  const offers = useMemo(
    () =>
      buildOffers({
        strings,
        subscriptionPrice,
        pack100Price,
        pack30Price,
        subscribeDisabled,
        packsDisabled: !connected,
      }),
    [
      connected,
      pack100Price,
      pack30Price,
      strings,
      subscribeDisabled,
      subscriptionPrice,
    ],
  );

  const value = useEntitlementValue(allowance);

  return (
    <EntitlementContext.Provider value={value}>
      {children}
      <PaywallSheet
        visible={allowance.paywallVisible}
        credits={allowance.credits}
        unlimited={allowance.unlimited}
        offers={offers}
        purchasing={purchasing}
        storeAvailable
        onBuy={(productId) => {
          void buy(productId);
        }}
        onRestore={() => {
          void restore();
        }}
        onManage={() => {
          void manage();
        }}
        onClose={allowance.closePaywall}
      />
    </EntitlementContext.Provider>
  );
}

function WebEntitlementProvider({ children }: { children: ReactNode }) {
  const strings = useI18n();
  const allowance = useSaveAllowance(null);
  const offers = useMemo(
    () =>
      buildOffers({
        strings,
        subscriptionPrice: null,
        pack100Price: null,
        pack30Price: null,
        subscribeDisabled: true,
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
        unlimited={allowance.unlimited}
        offers={offers}
        purchasing={false}
        storeAvailable={false}
        onBuy={() => undefined}
        onRestore={() => undefined}
        onManage={() => undefined}
        onClose={allowance.closePaywall}
      />
    </EntitlementContext.Provider>
  );
}

function useEntitlementValue(allowance: SaveAllowance): EntitlementContextValue {
  return useMemo(
    () => ({
      credits: allowance.credits,
      unlimited: allowance.unlimited,
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
      allowance.unlimited,
    ],
  );
}

function buildOffers({
  strings,
  subscriptionPrice,
  pack100Price,
  pack30Price,
  subscribeDisabled,
  packsDisabled,
}: {
  strings: Strings;
  subscriptionPrice: string | null;
  pack100Price: string | null;
  pack30Price: string | null;
  subscribeDisabled: boolean;
  packsDisabled: boolean;
}) {
  return [
    {
      id: UNLIMITED_MONTHLY_ID,
      title: strings.subscriptionTitle,
      detail: strings.subscriptionDetail,
      price: subscriptionPrice,
      primary: true,
      disabled: subscribeDisabled,
    },
    {
      id: PHOTO_PACK_100_ID,
      title: strings.packTitle(100),
      detail: "",
      price: pack100Price,
      disabled: packsDisabled || pack100Price == null,
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
