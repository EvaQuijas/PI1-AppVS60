import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB8wh7EtP6TfkE56cp2GUVWPbBMK9Cydmc",
  authDomain: "appsalud-3raedad.firebaseapp.com",
  projectId: "appsalud-3raedad",
  storageBucket: "appsalud-3raedad.firebasestorage.app",
  messagingSenderId: "724901866573",
  appId: "1:724901866573:web:3a4ae63c62a1581f33c004",
  measurementId: "G-9J4L3KN5V9"
};

const testConnection = async () => {
  try {
    const auth = getAuth();
    // Intentar login con credenciales incorrectas
    await signInWithEmailAndPassword(auth, "test@test.com", "wrongpassword");
  } catch (error) {
    console.log("✅ Firebase CONECTADO - Error esperado:", error.code);
  }
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios que necesitas
export const auth = getAuth(app);
export const db = getFirestore(app);