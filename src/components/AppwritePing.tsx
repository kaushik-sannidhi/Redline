"use client";

import { useEffect } from "react";
import { client } from "@/lib/appwrite/client";

export function AppwritePing() {
  useEffect(() => {
    void client.ping().catch(() => {
      // The ping is a setup health check; app usage should continue if Appwrite is unavailable.
    });
  }, []);

  return null;
}
