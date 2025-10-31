import { Slot, Stack } from "expo-router";

export default function RootLayout() {
  // Ensure the navigator renders the Slot (child routes) on first render.
  // Previously returning only <Stack /> caused navigation attempts before
  // the navigator was mounted which produced the runtime error.
  return (
    <Stack>
      <Slot />
    </Stack>
  );
}
