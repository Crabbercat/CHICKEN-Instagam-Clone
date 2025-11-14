import { Slot, Stack } from "expo-router";
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import BottomBar from './components/BottomBar';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false }}>
          <Slot />
        </Stack>
        <BottomBar />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
