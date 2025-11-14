import { Slot, Stack, useSegments } from "expo-router";
import { StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux'; 
import { store } from '../redux/store';
import BottomBar from './components/BottomBar';

export default function RootLayout() {
  const segments = useSegments();
  // Hide bottom bar on auth screens (login/register)
  const hideBottomBar = segments[0] === 'auth';

  return (
    <Provider store={store}>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false }}>
          <Slot />
        </Stack>
        {!hideBottomBar && <BottomBar />}
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
