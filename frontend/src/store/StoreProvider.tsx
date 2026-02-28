"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { fetchMeThunk } from "@/store/slices/authSlice";

function SessionRestorer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      store.dispatch(fetchMeThunk());
    }
  }, []);

  return null;
}

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <SessionRestorer />
      {children}
    </Provider>
  );
}
