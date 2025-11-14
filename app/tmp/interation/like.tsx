import { doc, setDoc, deleteDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../../lib/firebase";   // <-- Firebase config của bạn

export const toggleLike = async (postId: string, userId: string) => {
  const likeRef = doc(db, "posts", postId, "likes", userId);

  const docSnap = await getDoc(likeRef);

  if (docSnap.exists()) {
    // Unlike
    await deleteDoc(likeRef);
    await updateDoc(doc(db, "posts", postId), {
      likesCount: increment(-1),
    });
    return false; // unliked
  } else {
    // Like
    await setDoc(likeRef, {
      createdAt: new Date(),
    });
    await updateDoc(doc(db, "posts", postId), {
      likesCount: increment(1),
    });
    return true; // liked
  }
};
