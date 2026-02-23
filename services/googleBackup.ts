// services/googleBackup.ts
import { loadAppData, saveAppData } from "@/storage/japStorage";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";

WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID =
  "155472343207-9juf1h59peeicl49rc0n4onfq46q16so.apps.googleusercontent.com";

const IOS_CLIENT_ID =
  "155472343207-p876fsvfp8v3b4rpluoa3uvncgf9gh0d.apps.googleusercontent.com";

export function useGoogleDriveAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ["https://www.googleapis.com/auth/drive.appdata"],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const token = response.authentication?.accessToken;
      if (token) setAccessToken(token);
    }
    if (response?.type === "error") {
      console.error("Google auth error:", response.error);
    }
  }, [response]);

  const signIn = async () => {
    setAccessToken(null);
    await promptAsync();
  };

  return { accessToken, signIn, isReady: !!request };
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

// Manually build a multipart/related body.
// React Native's fetch does NOT support Blob inside FormData,
// so we construct the raw multipart string ourselves.
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
    // Only include parents on first creation, not on update
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
    console.error("Backup error response:", err);
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
    console.error("Restore error response:", err);
    throw new Error(`Restore failed (${fileRes.status}): ${err}`);
  }

  const fileData = await fileRes.json();
  await saveAppData(fileData);
}
