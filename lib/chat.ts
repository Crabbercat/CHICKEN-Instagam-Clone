
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Tạo hoặc lấy chat giữa currentUser và otherUid.
 * Trả về chatId hoặc null nếu chưa đăng nhập.
 */
export async function createOrGetChat(otherUid: string): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const currentUid = currentUser.uid;

  // 1. Tìm xem đã có chat giữa 2 người chưa
  const chatsRef = collection(db, "chats");
  const q = query(
    chatsRef,
    where("participants", "array-contains", currentUid)
  );

  const snap = await getDocs(q);

  let existingId: string | null = null;

  snap.forEach((docSnap) => {
    const data = docSnap.data() as { participants?: string[] };
    const participants = data.participants ?? [];
    if (
      participants.includes(currentUid) &&
      participants.includes(otherUid) &&
      participants.length === 2
    ) {
      existingId = docSnap.id;
    }
  });

  if (existingId) return existingId;

  // 2. Nếu chưa có thì tạo mới
  const newChat = await addDoc(chatsRef, {
    participants: [currentUid, otherUid],
    createdAt: serverTimestamp(),
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
  });

  return newChat.id;
}
