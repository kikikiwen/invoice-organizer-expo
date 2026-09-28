import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../i18n";

type PaywallOffer = {
  id: string;
  title: string;
  detail: string;
  price: string | null;
  primary?: boolean;
  disabled: boolean;
};

type PaywallSheetProps = {
  visible: boolean;
  credits: number | null;
  unlimited: boolean;
  offers: PaywallOffer[];
  purchasing: boolean;
  storeAvailable: boolean;
  onBuy: (productId: string) => void;
  onRestore: () => void;
  onManage: () => void;
  onClose: () => void;
};

export function PaywallSheet({
  visible,
  credits,
  unlimited,
  offers,
  purchasing,
  storeAvailable,
  onBuy,
  onRestore,
  onManage,
  onClose,
}: PaywallSheetProps) {
  const strings = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={() => undefined}
        >
          <Text style={styles.title}>{strings.paywallTitle}</Text>
          <Text style={styles.status}>
            {unlimited
              ? strings.paywallUnlimited
              : credits == null
                ? strings.paywallIntro
                : strings.paywallRemaining(credits)}
          </Text>
          {unlimited || credits == null ? null : (
            <Text style={styles.intro}>{strings.paywallIntro}</Text>
          )}

          <View style={styles.offers}>
            {offers.map((offer) => {
              const price = offer.price ?? strings.priceUnavailable;
              return (
                <Pressable
                  key={offer.id}
                  style={[
                    offer.primary ? styles.primaryOffer : styles.offer,
                    (offer.disabled || purchasing) && styles.offerDisabled,
                  ]}
                  disabled={offer.disabled || purchasing}
                  onPress={() => onBuy(offer.id)}
                >
                  <View style={styles.offerCopy}>
                    <Text
                      style={
                        offer.primary ? styles.primaryTitle : styles.offerTitle
                      }
                    >
                      {offer.title}
                    </Text>
                    {offer.detail ? (
                      <Text
                        style={
                          offer.primary
                            ? styles.primaryDetail
                            : styles.offerDetail
                        }
                      >
                        {offer.detail}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={offer.primary ? styles.primaryPrice : styles.offerPrice}
                  >
                    {price}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {purchasing ? (
            <Text style={styles.purchasing}>{strings.purchasing}</Text>
          ) : null}

          {storeAvailable ? (
            <View style={styles.links}>
              <Pressable onPress={onRestore} disabled={purchasing}>
                <Text style={styles.link}>{strings.restorePurchases}</Text>
              </Pressable>
              <Pressable onPress={onManage} disabled={purchasing}>
                <Text style={styles.link}>{strings.manageSubscription}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.unavailable}>{strings.purchasesUnavailable}</Text>
          )}

          <Text style={styles.terms}>{strings.subscriptionTerms}</Text>
          <Pressable onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>{strings.close}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.4)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },
  status: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: "#111827",
  },
  intro: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },
  offers: {
    marginTop: 16,
    gap: 10,
  },
  primaryOffer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  offer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  offerDisabled: {
    opacity: 0.5,
  },
  offerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  primaryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryDetail: {
    marginTop: 2,
    color: "#DBEAFE",
    fontSize: 13,
    lineHeight: 18,
  },
  offerTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  offerDetail: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
  },
  primaryPrice: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  offerPrice: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "700",
  },
  purchasing: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  links: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  link: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },
  unavailable: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },
  terms: {
    marginTop: 14,
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 17,
  },
  close: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 8,
  },
  closeText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },
});
