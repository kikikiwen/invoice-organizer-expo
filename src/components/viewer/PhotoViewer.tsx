import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  BackHandler,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../i18n";
import type { InvoicePhoto } from "../../types/invoice";

type PhotoViewerProps = {
  photos: InvoicePhoto[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 900;

export function PhotoViewer({
  photos,
  initialIndex,
  visible,
  onClose,
}: PhotoViewerProps) {
  const strings = useI18n();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<InvoicePhoto>>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const resetMotion = useCallback(() => {
    translateY.setValue(0);
    opacity.setValue(1);
  }, [opacity, translateY]);

  useEffect(() => {
    if (!visible) {
      resetMotion();
    }
  }, [visible, resetMotion]);

  useEffect(() => {
    if (!visible || Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });

    return () => subscription.remove();
  }, [visible, onClose]);

  const snapBack = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const dismiss = useCallback(() => {
    resetMotion();
    onClose();
  }, [onClose, resetMotion]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(12)
    .failOffsetX([-24, 24])
    .onUpdate((event) => {
      const offsetY = Math.max(0, event.translationY);
      translateY.setValue(offsetY);
      opacity.setValue(Math.max(0.35, 1 - offsetY / (height * 0.75)));
    })
    .onEnd((event) => {
      if (
        event.translationY > DISMISS_DISTANCE ||
        event.velocityY > DISMISS_VELOCITY
      ) {
        dismiss();
        return;
      }
      snapBack();
    });

  const nativeGesture = Gesture.Native();
  const gesture = Gesture.Simultaneous(panGesture, nativeGesture);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.container,
              {
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>{strings.close}</Text>
              </Pressable>
            </View>

            <FlatList
              ref={listRef}
              data={photos}
              horizontal
              pagingEnabled
              initialScrollIndex={initialIndex}
              keyExtractor={(item) => item.id}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[styles.page, { width, height }]}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>
              )}
              onScrollToIndexFailed={() => {
                listRef.current?.scrollToOffset({
                  offset: width * initialIndex,
                  animated: false,
                });
              }}
            />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: "flex-end",
    paddingHorizontal: 16,
  },
  closeButton: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  page: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
