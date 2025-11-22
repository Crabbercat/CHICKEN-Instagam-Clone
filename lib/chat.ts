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
 * Cho phép chat với chính mình: participants = [uid]
 */
export async function createOrGetChat(otherUid: string): Promise<string | null> {
  const current = auth.currentUser;
  if (!current) return null;

  const currentUid = current.uid;

  // Self-chat => participants chỉ có 1 uid
  const participants =
    currentUid === otherUid
      ? [currentUid]
      : [currentUid, otherUid].sort();

  // Kiểm tra đã có chat chưa
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participants", "==", participants));
  const snap = await getDocs(q);

  if (!snap.empty) return snap.docs[0].id;

  // Chưa có → tạo mới
  const newChat = await addDoc(chatsRef, {
    participants,
    createdAt: serverTimestamp(),
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
  });

  return newChat.id;
}
