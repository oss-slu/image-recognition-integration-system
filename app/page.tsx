// app/page.tsx

"use client";

import CameraButton from "@/app/components/cameraButton";
import NavigationBar from "@/app/components/navigationBar";
import { AppConfig } from "@/types/config";
import { useState, useEffect } from "react";

export default function Home() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetch(`./setup.json`)
      .then((response) => response.json())
      .then((data) => {
        setConfig(data);
      })
      .catch((error) => {
        console.error("Error loading config:", error);
      });
  }, []);

  return (
    <div className="relative flex h-screen items-center justify-center">
      {/* Bordered container around heading + button */}
      <div className="border-2 border-white p-8 rounded-xl flex flex-col items-center gap-8">
        <h1 className={`text-3xl font-semibold ${config?.textColor} text-center`}>
          Click below to upload image
        </h1>
        <div className="flex">
          <CameraButton />
        </div>
      </div>

      <NavigationBar />
    </div>
  );
}
