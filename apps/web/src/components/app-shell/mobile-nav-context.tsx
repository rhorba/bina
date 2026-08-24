"use client";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type MobileNavState = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
};

// Default no-op state so Sidebar/TopBar never crash if ever rendered outside
// the provider (e.g. a future standalone usage) — degrades to "always closed"
// rather than throwing.
const MobileNavContext = createContext<MobileNavState>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export function useMobileNav(): MobileNavState {
  return useContext(MobileNavContext);
}

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation — otherwise it stays open over the new page.
  // The effect only needs to re-run when pathname changes, not read its value.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname drives re-run timing only
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <MobileNavContext.Provider
      value={{
        isOpen,
        toggle: () => setIsOpen((v) => !v),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}
