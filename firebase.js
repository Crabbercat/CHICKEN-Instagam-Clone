// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { get } from "http";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjmc6-iMtWpi-rbEHtpiujzQlZJaaufmg",
  authDomain: "chicken-instagram-clone.firebaseapp.com",
  projectId: "chicken-instagram-clone",
  storageBucket: "chicken-instagram-clone.firebasestorage.app",
  messagingSenderId: "362195173969",
  appId: "1:362195173969:web:7912ffa40f0d1855e7ae70",
  measurementId: "G-P9BJ548SW4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);