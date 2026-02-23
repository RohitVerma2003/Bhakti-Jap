import { useTheme } from "@/context/ThemeContext";
import { loadAppData, saveAppData } from "@/storage/japStorage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Counter {
  id: string;
  name: string;
  dailyGoal: number;
  currentCount: number;
  lifetimeCount: number;
  lastUpdated: string;
}

export default function index() {
  const router = useRouter();
  const { theme } = useTheme();

  const [counters, setCounters] = useState<Counter[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [userName, setUserName] = useState<string>("Seeker");
  const [modalVisible, setModalVisible] = useState(false);
  const [newMantraName, setNewMantraName] = useState("");
  const [newMantraGoal, setNewMantraGoal] = useState("108");
  const [todayTotal, setTodayTotal] = useState(0);

  const modalAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const load = async () => {
    const data = await loadAppData();

    if (!data.onboardingDone) {
      router.replace("/onboarding");
      return;
    }

    setCounters([...data.counters]);
    setActiveId(data.activeCounterId);
    setUserName(data.userName || "Seeker");
    setTodayTotal(data.todayTotal);
  };

  const setActiveCounter = async (id: string) => {
    const data = await loadAppData();

    if (data.activeCounterId !== id) {
      data.activeCounterId = id;
      await saveAppData(data);
    }

    setActiveId(id);

    // 🔥 Navigate to Jap screen
    router.push("/jap");
  };

  const openModal = () => {
    setNewMantraName("");
    setNewMantraGoal("108");
    setModalVisible(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const confirmAddCounter = async () => {
    if (!newMantraName.trim()) return;

    const data = await loadAppData();

    const id = `mantra_${Date.now()}`;

    const today = new Date().toISOString().split("T")[0];

    data.counters.push({
      id,
      name: newMantraName.trim(),
      dailyGoal: parseInt(newMantraGoal) || 108,
      currentCount: 0,
      lifetimeCount: 0,
      lastUpdated: today,
    });

    data.activeCounterId = id;

    await saveAppData(data);

    closeModal();

    setCounters([...data.counters]);
    setActiveId(id);
  };

  const totalLifetime = counters.reduce((sum, c) => sum + c.lifetimeCount, 0);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getProgress = (c: Counter) =>
    c.dailyGoal > 0 ? Math.min(c.currentCount / c.dailyGoal, 1) : 0;

  const renderItem = ({ item, index }: { item: Counter; index: number }) => {
    const isActive = item.id === activeId;
    const progress = getProgress(item);
    const progressPercent = Math.round(progress * 100);
    const malasToday = Math.floor(item.currentCount / item.dailyGoal);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isActive ? theme.accent + "18" : theme.surface,
            borderColor: isActive ? theme.accent : theme.ringTrack + "60",
          },
        ]}
        onPress={() => setActiveCounter(item.id)}
        activeOpacity={0.82}
      >
        {/* Top row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            {isActive && (
              <View
                style={[styles.activeDot, { backgroundColor: theme.accent }]}
              />
            )}
            <Text
              style={[
                styles.mantraName,
                { color: isActive ? theme.accent : theme.text },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
          <View
            style={[
              styles.goalPill,
              {
                backgroundColor: isActive
                  ? theme.accent + "22"
                  : theme.ringTrack + "40",
              },
            ]}
          >
            <Text
              style={[
                styles.goalPillText,
                { color: isActive ? theme.accent : theme.textMuted },
              ]}
            >
              Goal {item.dailyGoal}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.ringTrack + "50" },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: isActive ? theme.accent : theme.accent + "90",
              },
            ]}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {item.currentCount}
              <Text style={[styles.statDivider, { color: theme.textMuted }]}>
                /{item.dailyGoal}
              </Text>
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Today
            </Text>
          </View>

          <View
            style={[
              styles.vertDivider,
              { backgroundColor: theme.ringTrack + "60" },
            ]}
          />

          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {malasToday}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Malas
            </Text>
          </View>

          <View
            style={[
              styles.vertDivider,
              { backgroundColor: theme.ringTrack + "60" },
            ]}
          />

          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {item.lifetimeCount.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              Lifetime
            </Text>
          </View>

          <View style={styles.progressPct}>
            <Text
              style={[
                styles.progressPctText,
                { color: isActive ? theme.accent : theme.textMuted },
              ]}
            >
              {progressPercent}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const modalScale = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {userName}
          </Text>
        </View>
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: theme.accent + "25" },
          ]}
        >
          <Text style={[styles.avatarLetter, { color: theme.accent }]}>
            {userName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.accent + "15",
              borderColor: theme.accent + "40",
            },
          ]}
        >
          <Text style={[styles.summaryValue, { color: theme.accent }]}>
            {todayTotal.toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.accent + "cc" }]}>
            Chants Today
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.ringTrack + "60",
            },
          ]}
        >
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {totalLifetime.toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
            Lifetime Total
          </Text>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Your Mantras
        </Text>
        <Text style={[styles.sectionCount, { color: theme.textMuted }]}>
          {counters.length} active
        </Text>
      </View>

      <FlatList
        data={counters}
        keyExtractor={(item) => item.id}
        extraData={counters}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // Android memory optimization
        maxToRenderPerBatch={8}
        windowSize={10}
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.accent }]}
        onPress={openModal}
        activeOpacity={0.85}
      >
        <Text style={[styles.addButtonText, { color: theme.background }]}>
          +
        </Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <Animated.View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.surface,
                transform: [{ scale: modalScale }],
                opacity: modalAnim,
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: theme.ringTrack }]}
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              New Mantra
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              What mantra will you practice?
            </Text>

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
              Mantra Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.ringTrack + "80",
                },
              ]}
              placeholder="e.g. Om Namah Shivaya"
              placeholderTextColor={theme.textMuted}
              value={newMantraName}
              onChangeText={setNewMantraName}
              autoFocus
              returnKeyType="next"
            />

            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
              Daily Goal
            </Text>
            <View style={styles.goalOptions}>
              {["108", "216", "324", "1008"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.goalChip,
                    {
                      backgroundColor:
                        newMantraGoal === g ? theme.accent : theme.background,
                      borderColor:
                        newMantraGoal === g
                          ? theme.accent
                          : theme.ringTrack + "80",
                    },
                  ]}
                  onPress={() => setNewMantraGoal(g)}
                >
                  <Text
                    style={{
                      color:
                        newMantraGoal === g
                          ? theme.background
                          : theme.textMuted,
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.ringTrack + "80",
                  marginTop: 10,
                },
              ]}
              placeholder="Or enter custom number"
              placeholderTextColor={theme.textMuted}
              value={
                ["108", "216", "324", "1008"].includes(newMantraGoal)
                  ? ""
                  : newMantraGoal
              }
              onChangeText={(v) => setNewMantraGoal(v.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              returnKeyType="done"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.cancelBtn,
                  { borderColor: theme.ringTrack + "80" },
                ]}
                onPress={closeModal}
              >
                <Text style={{ color: theme.textMuted, fontWeight: "500" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.confirmBtn,
                  {
                    backgroundColor: newMantraName.trim()
                      ? theme.accent
                      : theme.ringTrack,
                  },
                ]}
                onPress={confirmAddCounter}
                disabled={!newMantraName.trim()}
              >
                <Text style={{ color: theme.background, fontWeight: "600" }}>
                  Add Mantra
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  sectionCount: {
    fontSize: 13,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 8,
  },
  mantraName: {
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: 0.1,
    flex: 1,
  },
  goalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  goalPillText: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  statDivider: {
    fontSize: 14,
    fontWeight: "400",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  vertDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 4,
  },
  progressPct: {
    paddingLeft: 12,
    alignItems: "flex-end",
  },
  progressPctText: {
    fontSize: 13,
    fontWeight: "600",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 30,
    fontWeight: "300",
    includeFontPadding: false,
    textAlign: "center",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
    opacity: 0.4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 18,
  },
  goalOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  goalChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  confirmBtn: {
    borderWidth: 0,
  },
});
