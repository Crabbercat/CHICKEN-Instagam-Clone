import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";   // <-- Firebase config của bạn

export const addComment = async (
  postId: string,
  data: {
    userId: string;
    content: string;
    creation: any;
  }
) => {
  // 1. Add comment vào sub-collection
  await addDoc(collection(db, "posts", postId, "comments"), data);

  // 2. Tăng bộ đếm comment
  await updateDoc(doc(db, "posts", postId), {
    commentsCount: increment(1),
  });
};
