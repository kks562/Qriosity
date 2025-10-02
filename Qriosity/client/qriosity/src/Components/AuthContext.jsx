import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null
  );

  // Login user and store token
  const login = (token, userData) => {
    const userWithToken = { ...userData, token };
    localStorage.setItem("user", JSON.stringify(userWithToken));
    setUser(userWithToken);
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
