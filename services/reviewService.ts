// services/reviewService.ts
// Google Play In-App Review — shows native rating dialog at the right moment.
//
// Strategy:
// - Only prompt after user has used the app for at least MIN_DAYS_BEFORE_PROMPT days
// - Only prompt after a mala completion (natural moment of satisfaction)
// - Never prompt more than once every DAYS_BETWEEN_PROMPTS days
// - Store prompt history in AsyncStorage so we don't spam
//
// IMPORTANT: Google's API is a black box — we never know if the user actually
// rated. The dialog may not show at all if Google decides the user has already
// rated or has seen it recently. This is by design. Just call it at the right
// moment and trust the system.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const REVIEW_KEY = "BHAKTI_JAP_REVIEW_STATE";
const MIN_DAYS_BEFORE_PROMPT = 1;   // must have used app for 3+ days
const DAYS_BETWEEN_PROMPTS   = 15;  // don't re-prompt within 30 days

interface ReviewState {
  firstLaunchDate: string;   // ISO date string of first app open
  lastPromptDate:  string | null; // ISO date string of last prompt shown
}

async function loadReviewState(): Promise<ReviewState> {
  const raw = await AsyncStorage.getItem(REVIEW_KEY);
  if (raw) return JSON.parse(raw);

  // First ever launch — record today as the start date
  const state: ReviewState = {
    firstLaunchDate: new Date().toISOString(),
    lastPromptDate:  null,
  };
  await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(state));
  return state;
}

async function saveReviewState(state: ReviewState): Promise<void> {
  await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(state));
}

function daysBetween(dateA: string, dateB: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((dateB.getTime() - new Date(dateA).getTime()) / msPerDay);
}

// Call this after a mala is completed (currentCount % dailyGoal === 0).
// It will silently do nothing if conditions aren't met.
export async function maybeRequestReview(): Promise<void> {
  if (Platform.OS !== "android") return; // iOS needs a different setup

  try {
    const state = await loadReviewState();
    const now   = new Date();

    // Check: has the user used the app for MIN_DAYS_BEFORE_PROMPT days?
    const daysUsing = daysBetween(state.firstLaunchDate, now);
    
    if (daysUsing < MIN_DAYS_BEFORE_PROMPT) return;

    // Check: have we prompted recently?
    if (state.lastPromptDate) {
      const daysSincePrompt = daysBetween(state.lastPromptDate, now);
      if (daysSincePrompt < DAYS_BETWEEN_PROMPTS) return;
    }

    // All conditions met — request the review
    const InAppReview = require("react-native-google-play-review").default;
    await InAppReview.requestReview();

    // Record that we prompted (regardless of whether dialog showed or user rated)
    state.lastPromptDate = now.toISOString();
    await saveReviewState(state);

  } catch (e) {
    // Never crash the app over a review prompt
    console.warn("In-app review error:", e);
  }
}