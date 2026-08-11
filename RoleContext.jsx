import { createContext, useContext, useState, useEffect } from "react";

const RoleContext = createContext({
  user: null,
  role: "admin",
  effectiveRole: "admin",
  setOverride: () => {},
  loading: false,
});

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [override, setOverride] = useState(null);

  useEffect(() => {
    base44
      .auth.me()
      .then((u) => {
        setUser(u);
        setRole(u?.role || "admin");
      })
      .catch(() => {
        setUser(null);
        setRole("admin");
      })
      .finally(() => setLoading(false));
  }, []);

  const effectiveRole = override || role;
  return (
    <RoleContext.Provider value={{ user, role, effectiveRole, setOverride, loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);