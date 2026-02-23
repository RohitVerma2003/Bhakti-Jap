// services/googleBackup.ts
// Uses @react-native-google-signin/google-signin for native in-app auth.
// No browser — shows the native Google account picker sheet.

import { loadAppData, saveAppData } from "@/storage/japStorage";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// ─── One-time configuration ───────────────────────────────────────────────────
// Call this once in _layout.tsx on app startup.
// webClientId = the "Web Application" client ID from Google Cloud Console
// (required for token exchange even on Android).
export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId:
      "155472343207-82fg5oennb0ffq1631c324sar6ueu8u9.apps.googleusercontent.com",
    scopes: ["https://www.googleapis.com/auth/drive.appdata"],
    offlineAccess: false,
  });
}

// ─── Get access token ─────────────────────────────────────────────────────────
// Shows native Google account picker. Returns null if user cancels.

export async function getGoogleAccessToken(): Promise<string | null> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  } catch (error: any) {
    if (
      error.code === statusCodes.SIGN_IN_CANCELLED ||
      error.code === statusCodes.IN_PROGRESS
    ) {
      return null; // user cancelled — not an error
    }
    throw error;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findBackupFileId(token: string): Promise<string | null> {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files" +
      "?spaces=appDataFolder" +
      "&q=name%3D'bhakti_jap_backup.json'" +
      "&fields=files(id%2Cname)",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.files?.[0]?.id ?? null;
}

function buildMultipartBody(
  metadata: object,
  fileContent: string,
  boundary: string,
): string {
  const metaStr = JSON.stringify(metadata);
  return (
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metaStr}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${fileContent}\r\n` +
    `--${boundary}--`
  );
}

// ─── Backup ───────────────────────────────────────────────────────────────────

export async function backupToDrive(token: string): Promise<void> {
  const data = await loadAppData();
  const fileContent = JSON.stringify(data);
  const existingFileId = await findBackupFileId(token);
  const boundary = "BHAKTI_JAP_BOUNDARY_" + Date.now();

  const metadata = {
    name: "bhakti_jap_backup.json",
    mimeType: "application/json",
    ...(existingFileId ? {} : { parents: ["appDataFolder"] }),
  };

  const body = buildMultipartBody(metadata, fileContent, boundary);
  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const res = await fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Backup failed (${res.status}): ${err}`);
  }
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export async function restoreFromDrive(token: string): Promise<void> {
  const fileId = await findBackupFileId(token);
  if (!fileId) throw new Error("No backup found in Google Drive.");

  const fileRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!fileRes.ok) {
    const err = await fileRes.text();
    throw new Error(`Restore failed (${fileRes.status}): ${err}`);
  }

  const fileData = await fileRes.json();
  await saveAppData(fileData);
}
