import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TmpMessage(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Message (tmp)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  title: { fontSize: 18, fontWeight: '600' },
});     
