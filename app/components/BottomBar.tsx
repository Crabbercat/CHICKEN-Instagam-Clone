// CHICKEN-Instagam-Clone/app/components/BottomBar.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

export default function BottomBar(): React.ReactElement {
  const router = useRouter();

  const segments = useSegments();
  // activeSegment corresponds to the second segment for /tmp/<page>
  let key = segments[segments.length - 1] ?? "";

  // nếu đang ở trang chat hoặc chat detail
  if (segments[0] === "chat") {
    key = "message";
  }

  const activeSegment = key;


  const items = useMemo(
    () => [
      { key: 'home', label: 'Home', route: '/tmp/home', activeKey: 'home', iconActive: 'home', iconInactive: 'home-outline' },
      { key: 'search', label: 'Search', route: '/search', activeKey: 'search', iconActive: 'search', iconInactive: 'search-outline' },
      { key: 'addpost', label: 'Add', route: '/tmp/addpost', activeKey: 'addpost', iconActive: 'add-circle', iconInactive: 'add-circle-outline' },
      { key: 'message', label: 'Message', route: '/chat/chatlist', activeKey: 'message', iconActive: 'chatbubble', iconInactive: 'chatbubble-outline' },
      { key: 'profile', label: 'Profile', route: '/user/profile', activeKey: 'profile', iconActive: 'person', iconInactive: 'person-outline' },
    ],
    []
  );

  // Animated values for each item (scale)
  const animRef = useRef<Map<string, Animated.Value>>(new Map());
  
  // Initialize animation values once
  useEffect(() => {
    for (const it of items) {
      if (!animRef.current.has(it.key)) {
        animRef.current.set(it.key, new Animated.Value(it.activeKey === activeSegment ? 1.15 : 1));
      }
    }
  }, [items, activeSegment]);

  // Animate active segment changes
  useEffect(() => {
    items.forEach((it) => {
      const anim = animRef.current.get(it.key);
      if (anim) {
        const isActive = it.activeKey === activeSegment;
        Animated.spring(anim, {
          toValue: isActive ? 1.15 : 1,
          useNativeDriver: true,
          friction: 8,
          tension: 80,
        }).start();
      }
    });
  }, [activeSegment, items]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.inner}>
        {items.map((it) => {
          const anim = animRef.current.get(it.key) as Animated.Value;
          const isActive = it.activeKey === activeSegment;

          return (
            <Pressable
              key={it.key}
              onPress={() => router.push(it.route)}
              style={styles.item}
            >
              <Animated.View style={{ transform: [{ scale: anim }] }}>
                <Ionicons
                  name={(isActive ? it.iconActive : it.iconInactive) as any}
                  size={22}
                  color={isActive ? '#007AFF' : '#444'}
                />
              </Animated.View>
            </Pressable>
          );
        })}
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
