import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBGI2rHtfd637CTlGCM_1RtI1WRByhixJg",
  authDomain: "krishisetu-ecee4.firebaseapp.com",
  projectId: "krishisetu-ecee4",
  storageBucket: "krishisetu-ecee4.firebasestorage.app",
  messagingSenderId: "285363929173",
  appId: "1:285363929173:web:df1d32f7dd40d0aed2d4dc",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;