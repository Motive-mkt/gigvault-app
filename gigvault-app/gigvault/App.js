import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Modal, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts as useSoraFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
} from '@expo-google-fonts/sora';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

import DashboardScreen from './src/screens/DashboardScreen';
import LogEntryScreen from './src/screens/LogEntryScreen';
import ChartsScreen from './src/screens/ChartsScreen';
import TaxScreen from './src/screens/TaxScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LicenseScreen from './src/screens/LicenseScreen';
import OnboardingFlow from './src/screens/OnboardingFlow';
import BottomNav from './src/components/BottomNav';
import { colors } from './src/theme/theme';
import { initDatabase, isOnboardingComplete } from './src/db/database';
import { isLicensed } from './src/services/whopLicense';

SplashScreen.preventAutoHideAsync().catch(() => {});

const SCREENS = {
  Dashboard: DashboardScreen,
  Charts: ChartsScreen,
  Tax: TaxScreen,
  Settings: SettingsScreen,
};

// App boot sequence:
// 1. Load fonts (Sora + IBM Plex Mono)
// 2. Initialize SQLite (creates tables on first run)
// 3. Check Whop license — if not verified, show LicenseScreen
// 4. Check onboarding completion — if not done, show OnboardingFlow
// 5. Show the main tab shell
export default function App() {
  const [fontsLoaded] = useSoraFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const [dbReady, setDbReady] = useState(false);
  const [licensed, setLicensed] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [checkingState, setCheckingState] = useState(true);

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [logOpen, setLogOpen] = useState(false);
  const [dashboardKey, setDashboardKey] = useState(0);

  useEffect(() => {
    (async () => {
      await initDatabase();
      setDbReady(true);
      const [licenseOk, onboardOk] = await Promise.all([isLicensed(), isOnboardingComplete()]);
      setLicensed(licenseOk);
      setOnboarded(onboardOk);
      setCheckingState(false);
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady && !checkingState) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, dbReady, checkingState]);

  const handleSelect = (key) => {
    if (key === 'Log') {
      setLogOpen(true);
      return;
    }
    setActiveTab(key);
  };

  const handleSaveEntry = () => {
    setLogOpen(false);
    // Dashboard and Charts reload data on mount — remounting Dashboard via
    // its key forces a fresh read so the new entry shows up immediately.
    setDashboardKey((k) => k + 1);
    setActiveTab('Dashboard');
  };

  if (!fontsLoaded || !dbReady || checkingState) {
    return (
      <View style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!licensed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LicenseScreen onVerified={() => setLicensed(true)} />
      </SafeAreaView>
    );
  }

  if (!onboarded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <OnboardingFlow onComplete={() => setOnboarded(true)} />
      </SafeAreaView>
    );
  }

  const ActiveScreen = SCREENS[activeTab];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.body}>
        <ActiveScreen key={activeTab === 'Dashboard' ? dashboardKey : activeTab} />
      </View>
      <BottomNav active={activeTab} onSelect={handleSelect} />

      <Modal visible={logOpen} animationType="slide" presentationStyle="pageSheet">
        <LogEntryScreen onSave={handleSaveEntry} onClose={() => setLogOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgDeep },
  centered: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
});
