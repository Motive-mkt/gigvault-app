// Whop license verification.
//
// IMPORTANT: Whop's validate_license endpoint requires your Whop COMPANY API KEY
// in the Authorization header. That key must never be embedded in the APK — anyone
// can decompile a React Native app and extract it, giving them access to your
// Whop account. So this file calls YOUR OWN small proxy endpoint, which holds the
// real API key server-side and forwards the request to Whop.
//
// This proxy is stateless (no database), so it's free-tier friendly on
// Vercel/Cloudflare Workers — nothing like the Firestore costs you were trying
// to avoid. See /serverless/whop-verify.js in this project for the proxy code
// to deploy.

import * as Application from 'expo-application';
import { getSetting, setSetting } from '../db/database';

// TODO: replace with your deployed proxy URL once you deploy /serverless/whop-verify.js
const PROXY_URL = 'https://YOUR-PROXY-DOMAIN.vercel.app/api/verify-license';

async function getDeviceId() {
  // Stable per-install identifier used as Whop's "metadata" binding, so a
  // license key can only activate one device (see validate_license behavior:
  // 201 on first bind, 200 on matching metadata, 400 on mismatch).
  // Application.androidId is a synchronous property on Android (resets on
  // factory reset / app uninstall+reinstall, which is fine for this use case).
  // GigVault ships as an Android APK, so this is the primary path.
  try {
    const id = Application.androidId || Application.applicationId || 'unknown-device';
    return String(id);
  } catch {
    return 'unknown-device';
  }
}

/**
 * Verifies a license key against Whop, binding it to this device on first use.
 * Returns { valid: boolean, reason?: string }
 */
export async function verifyLicenseKey(licenseKey) {
  const deviceId = await getDeviceId();

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, deviceId }),
    });

    if (response.status === 200 || response.status === 201) {
      await setSetting('license_key', licenseKey);
      await setSetting('license_verified', true);
      return { valid: true };
    }

    if (response.status === 400) {
      return { valid: false, reason: 'This key is already active on another device.' };
    }

    return { valid: false, reason: 'Could not verify this license key.' };
  } catch (err) {
    // Network failure — fall back to cached verification if this device was
    // already verified before, so users aren't locked out while offline.
    const cachedValid = await getSetting('license_verified', false);
    const cachedKey = await getSetting('license_key', null);
    if (cachedValid && cachedKey === licenseKey) {
      return { valid: true, offline: true };
    }
    return { valid: false, reason: 'No internet connection to verify your key.' };
  }
}

export async function isLicensed() {
  return getSetting('license_verified', false);
}

export async function getStoredLicenseKey() {
  return getSetting('license_key', null);
}
