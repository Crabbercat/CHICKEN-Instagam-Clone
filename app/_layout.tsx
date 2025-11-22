import { Slot, Stack, usePathname } from "expo-router";
import { StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import BottomBar from './components/BottomBar';
import TopBar from "./components/TopBar";

export default function RootLayout() {
  const pathname = usePathname();

  const hideTopBar = pathname.startsWith("/auth");

  const hideBottomBar =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/tmp/comments") ||
    pathname.startsWith("/tmp/post");

  return (
    <Provider store={store}>
      <View style={styles.container}>
        {!hideTopBar && <TopBar />}
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
