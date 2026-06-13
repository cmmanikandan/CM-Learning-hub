import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD1b3n99qix0vx-JeqkFzc4b8JPgmfuF_E",
  authDomain: "nexcm37.firebaseapp.com",
  projectId: "nexcm37",
  storageBucket: "nexcm37.firebasestorage.app",
  messagingSenderId: "355116420826",
  appId: "1:355116420826:web:4ade9c3d493e4bfc8c9fe3",
  measurementId: "G-HW3HZ2423D"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
