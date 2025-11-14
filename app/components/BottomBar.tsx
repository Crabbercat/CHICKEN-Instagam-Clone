import React from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function BottomBar(): React.ReactElement {
  const router = useRouter();

  const items = [
    { key: 'home', label: 'Home', route: '/tmp/home' },
    { key: 'search', label: 'Search', route: '/tmp/search' },
    { key: 'add', label: 'Add', route: '/tmp/addpost' },
    { key: 'message', label: 'Message', route: '/tmp/message' },
    { key: 'profile', label: 'Profile', route: '/tmp/profile' },
  ];

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.inner}>
        {items.map((it) => (
          <Pressable
            key={it.key}
            onPress={() => router.push(it.route)}
            style={styles.item}
          >
            {/* Placeholder icon/text — replace with your icons later */}
            <Text style={styles.icon}>◻️</Text>
            <Text style={styles.label}>{it.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    // allow content behind the bar to be visible when scrolled
    backgroundColor: 'transparent',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
});
