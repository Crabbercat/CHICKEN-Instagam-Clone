import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { db } from "../firebase";
import { collection, query, orderBy, startAt, endAt, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";


type User = {
  id: string;
  name?: string;
  username?: string;
  image?: string;
};

export default function SearchScreen() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!text.trim()) {
      setUsers([]);
      return;
    }
    const delay = setTimeout(() => searchUsers(text), 500);
    return () => clearTimeout(delay);
    }, [text]);

    const searchUsers = async (searchText: string) => {
        const ref = collection(db, "users");
        const q = query(ref, orderBy("username"), startAt(searchText), endAt(searchText + "\uf8ff"));
        const querySnapshot = await getDocs(q); 
        setUsers(querySnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<User, "id">) })));
    };
    
    return (
        <View style={styles.container}>
      <TextInput
        placeholder="Search username..."
        style={styles.input}
        value={text}
        onChangeText={setText}
      />

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: User }) => (
          <TouchableOpacity
            style={styles.user}
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <View style={styles.avatar} />
            <View>
              <Text style={styles.username}>{item.username}</Text>
              <Text>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 12 },
  user: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  avatar: { width: 40, height: 40, backgroundColor: "#ccc", borderRadius: 50, marginRight: 10 },
  username: { fontWeight: "bold" }
});