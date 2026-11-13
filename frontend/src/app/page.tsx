"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/constants";
import { App } from "@/components/App";

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
