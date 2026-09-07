import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider, EmailAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: "AIzaSyBUPVUSzEwYmkPC8hdI731ATB13YkZZ7EI",
  authDomain: "dil-e-kehkash.firebaseapp.com",
  projectId: "dil-e-kehkash",
  storageBucket: "dil-e-kehkash.firebasestorage.app",
  messagingSenderId: "545059008172",
  appId: "1:545059008172:web:5e9c7731e1adac80f53909",
  measurementId: "G-JPTCKMX0VJ"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)
export const googleProvider = new GoogleAuthProvider()
export const githubProvider = new GithubAuthProvider()
export const emailProvider = new EmailAuthProvider()
