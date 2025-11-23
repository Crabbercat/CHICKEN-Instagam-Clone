import { useRouter } from "expo-router";
import { collection, endAt, getDocs, orderBy, query, startAt } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db, auth } from "../lib/firebase";

type User = {
  uid: string;
  name?: string;
  username?: string;
  image?: string;
};

export default function SearchScreen() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

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

    const q = query(
      ref,
      orderBy("username"),
      startAt(searchText),
      endAt(searchText + "\uf8ff")
    );

    const querySnapshot = await getDocs(q);

    const mapped = querySnapshot.docs.map((d) => ({
      uid: d.id,
      ...(d.data() as Omit<User, "uid">),
    }));

    setUsers(mapped);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search name or username..."
        style={styles.input}
        value={text}
        onChangeText={setText}
      />

      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.user}
            onPress={() => router.push(`/chat/${item.uid}`)}
          >
            <Image
              source={{
                uri: item.image || "https://i.imgur.com/7yUvePI.png",
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.username}>
                {item.uid === currentUid ? "You" : item.username}
              </Text>
              <Text style={{ color: "#777" }}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: "white" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: "#ccc",
    borderRadius: 30,
  },
  username: {
    fontWeight: "700",
    fontSize: 16,
  },
});
