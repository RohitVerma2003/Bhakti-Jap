import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  COUNT: "jap_current_count",
  DAILY_GOAL: "jap_daily_goal",
  STREAK: "jap_streak",
  LONGEST_STREAK: "jap_longest_streak",
  LIFETIME_COUNT: "jap_lifetime_count",
  MALAS_TODAY: "jap_malas_today",
  THEME: "jap_theme",
  LAST_ACTIVE_DATE: "jap_last_active_date",
  ONBOARDING_DONE: "jap_onboarding_done",
  USER_NAME: "jap_user_name",
};

export interface JapData {
  currentCount: number;
  dailyGoal: number;
  streak: number;
  longestStreak: number;
  lifetimeCount: number;
  malasToday: number;
  theme: string;
  lastActiveDate: string;
  onboardingDone: boolean;
  userName: string;
}

const today = () => new Date().toISOString().split("T")[0];

export async function loadJapData(): Promise<JapData> {
  try {
    const [
      count,
      goal,
      streak,
      longest,
      lifetime,
      malas,
      theme,
      lastDate,
      onboarded,
      userName,
    ] = await AsyncStorage.multiGet([
      KEYS.COUNT,
      KEYS.DAILY_GOAL,
      KEYS.STREAK,
      KEYS.LONGEST_STREAK,
      KEYS.LIFETIME_COUNT,
      KEYS.MALAS_TODAY,
      KEYS.THEME,
      KEYS.LAST_ACTIVE_DATE,
      KEYS.ONBOARDING_DONE,
      KEYS.USER_NAME,
    ]);

    const lastActiveDate = lastDate[1] ?? today();
    const isNewDay = lastActiveDate !== today();

    return {
      currentCount: isNewDay ? 0 : parseInt(count[1] ?? "0", 10),
      dailyGoal: parseInt(goal[1] ?? "108", 10),
      streak: parseInt(streak[1] ?? "0", 10),
      longestStreak: parseInt(longest[1] ?? "0", 10),
      lifetimeCount: parseInt(lifetime[1] ?? "0", 10),
      malasToday: isNewDay ? 0 : parseInt(malas[1] ?? "0", 10),
      theme: theme[1] ?? "dark",
      lastActiveDate,
      onboardingDone: onboarded[1] === "true",
      userName: userName[1] ?? "",
    };
  } catch {
    return {
      currentCount: 0,
      dailyGoal: 108,
      streak: 0,
      longestStreak: 0,
      lifetimeCount: 0,
      malasToday: 0,
      theme: "dark",
      lastActiveDate: today(),
      onboardingDone: false,
      userName: "",
    };
  }
}

export async function saveCount(count: number, lifetimeCount: number) {
  await AsyncStorage.multiSet([
    [KEYS.COUNT, count.toString()],
    [KEYS.LIFETIME_COUNT, lifetimeCount.toString()],
    [KEYS.LAST_ACTIVE_DATE, today()],
  ]);
}

export async function saveMalaCompleted(
  malasToday: number,
  streak: number,
  longestStreak: number,
) {
  await AsyncStorage.multiSet([
    [KEYS.MALAS_TODAY, malasToday.toString()],
    [KEYS.STREAK, streak.toString()],
    [KEYS.LONGEST_STREAK, longestStreak.toString()],
    [KEYS.LAST_ACTIVE_DATE, today()],
  ]);
}

export async function saveDailyGoal(goal: number) {
  await AsyncStorage.setItem(KEYS.DAILY_GOAL, goal.toString());
}

export async function saveTheme(theme: string) {
  await AsyncStorage.setItem(KEYS.THEME, theme);
}

export async function saveUserName(name: string) {
  await AsyncStorage.setItem(KEYS.USER_NAME, name);
}

export async function setOnboardingDone() {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, "true");
}

export async function resetDailyCount() {
  await AsyncStorage.multiSet([
    [KEYS.COUNT, "0"],
    [KEYS.MALAS_TODAY, "0"],
    [KEYS.LAST_ACTIVE_DATE, today()],
  ]);
}
