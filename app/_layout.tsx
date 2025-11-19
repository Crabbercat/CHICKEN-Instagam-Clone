import { Slot, Stack, useSegments } from "expo-router";
import { StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux'; 
import { store } from '../redux/store';
import BottomBar from './components/BottomBar';
import TopBar from "./components/TopBar";

export default function RootLayout() {
  const segments = useSegments();
  // Hide bottom bar on auth screens (login/register)
  const hideBottomBar = segments[0] === 'auth';
  const hideTopBar = segments[0] === 'auth';
  console.log(segments);  // Kiểm tra giá trị của segments

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
