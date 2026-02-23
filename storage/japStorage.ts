import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "DIVINE_JAP_DATA_V1";

const today = () => new Date().toISOString().split("T")[0];

export interface JapCounter {
  id: string;
  name: string;
  dailyGoal: number;
  currentCount: number; // grows during day
  lifetimeCount: number;
  lastUpdated: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastCompletedDate: string | null;
}

export interface JapAppData {
  userName: string;
  theme: "saffron" | "dark";
  onboardingDone: boolean;

  globalDailyGoal: number;

  counters: JapCounter[];
  activeCounterId: string;

  streak: StreakData;

  dailyHistory: {
    [date: string]: number; // total chants that day
  };
  todayTotal: number;
}

/* ---------------------------------- */
/* Default Data */
/* ---------------------------------- */

function createDefaultData(): JapAppData {
  return {
    userName: "",
    theme: "saffron",
    onboardingDone: false,
    globalDailyGoal: 108,
    counters: [],
    activeCounterId: "not_active",
    streak: {
      current: 0,
      longest: 0,
      lastCompletedDate: null,
    },
    dailyHistory: {},
    todayTotal: 0,
  };
}

/* ---------------------------------- */
/* Helpers */
/* ---------------------------------- */

function getTotalToday(data: JapAppData): number {
  return data.counters.reduce((sum, c) => sum + c.currentCount, 0);
}

/* ---------------------------------- */
/* Load / Save */
/* ---------------------------------- */

export async function loadAppData(): Promise<JapAppData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const defaultData = createDefaultData();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  }

  const data: JapAppData = JSON.parse(raw);

  return handleDailyReset(data);
}

export async function saveAppData(data: JapAppData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ---------------------------------- */
/* Daily Reset Logic */
/* ---------------------------------- */

function handleDailyReset(data: JapAppData): JapAppData {
  const todayDate = today();
  const previousDate = data.counters[0]?.lastUpdated;

  if (!previousDate || previousDate === todayDate) {
    return data;
  }

  // Save yesterday's total
  data.dailyHistory[previousDate] = data.todayTotal;

  // Reset only daily values
  data.todayTotal = 0;

  data.counters = data.counters.map((counter) => ({
    ...counter,
    currentCount: 0,
    lastUpdated: todayDate,
  }));

  return data;
}

/* ---------------------------------- */
/* Increment Logic */
/* ---------------------------------- */

export async function incrementCounter(): Promise<JapAppData> {
  const data = await loadAppData();

  const counter = data.counters.find((c) => c.id === data.activeCounterId);

  if (!counter) return data;

  counter.currentCount += 1;
  counter.lifetimeCount += 1;

  // 🔥 Increment global today total
  data.todayTotal += 1;

  updateStreakIfNeeded(data);

  const todayDate = today();
  data.dailyHistory[todayDate] = data.todayTotal;

  await saveAppData(data);

  return data;
}

export async function decrementCounter(): Promise<JapAppData> {
  const data = await loadAppData();
  const counter = data.counters.find((c) => c.id === data.activeCounterId);
  if (!counter) return data;

  if (counter.currentCount > 0) {
    counter.currentCount -= 1;
    counter.lifetimeCount =
      counter.lifetimeCount > 0 ? counter.lifetimeCount - 1 : 0;
    data.todayTotal = data.todayTotal > 0 ? data.todayTotal - 1 : 0;
  }

  await saveAppData(data);
  return data;
}

/* ---------------------------------- */
/* Streak Logic */
/* ---------------------------------- */
function updateStreakIfNeeded(data: JapAppData) {
  const todayDate = today();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().split("T")[0];

  if (data.todayTotal < data.globalDailyGoal) return;

  const last = data.streak.lastCompletedDate;

  if (last === todayDate) return;

  if (last === yDate) {
    data.streak.current += 1;
  } else {
    data.streak.current = 1;
  }

  if (data.streak.current > data.streak.longest) {
    data.streak.longest = data.streak.current;
  }

  data.streak.lastCompletedDate = todayDate;
}

/* ---------------------------------- */
/* Other Actions */
/* ---------------------------------- */

export async function addCounter(name: string) {
  const data = await loadAppData();

  const id = `${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;

  data.counters.push({
    id,
    name,
    dailyGoal: 108,
    currentCount: 0,
    lifetimeCount: 0,
    lastUpdated: today(),
  });

  await saveAppData(data);
}

export async function setActiveCounter(id: string) {
  const data = await loadAppData();
  data.activeCounterId = id;
  await saveAppData(data);
}

export async function updateTheme(theme: "saffron" | "dark") {
  const data = await loadAppData();
  data.theme = theme;
  await saveAppData(data);
}

export async function setUserName(name: string) {
  const data = await loadAppData();
  data.userName = name;
  await saveAppData(data);
}

export async function completeOnboarding() {
  const data = await loadAppData();
  data.onboardingDone = true;
  await saveAppData(data);
}
