import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#110d1d",
          border: "1px solid #1e1832",
          color: "#e2e0ea",
        },
      }}
    />
  );
}
