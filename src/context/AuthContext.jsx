import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    const token = currentUser ? await currentUser.getIdTokenResult() : null
    setUser(currentUser)
    setIsAdmin(token?.claims?.admin === true)
    setLoading(false)
  })
  return unsubscribe
}, [])

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
