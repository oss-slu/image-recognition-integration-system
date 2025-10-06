import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.iris.app",
  appName: "image-recognition-integration-system",
  webDir: "out",

  plugins: {
    StatusBar: {
      backgroundColor: "#111827", // This should match your app's background color
    },
  },
};

export default config;
