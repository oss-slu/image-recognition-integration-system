# Image Recognition Integration System (IRIS)

IRIS is an open-source framework designed to help developers build AI-powered image search applications with ease. It provides a modular, extensible architecture that handles image capture, processing, search API integration, and result display across web and mobile platforms via Capacitor.

---

## Table of Contents

- [Image Recognition Integration System (IRIS)](#image-recognition-integration-system-iris)
  - [Table of Contents](#table-of-contents)
  - [Vision](#vision)
  - [Features](#features)
  - [Getting Started](#getting-started)
  - [Capacitor Setup](#capacitor-setup)
  - [Secure Configuration (`.env.local`)](#secure-configuration-envlocal)
  - [Project Structure](#project-structure)
    - [Pages (in `/app`)](#pages-in-app)
    - [Components (in `/app/components`)](#components-in-appcomponents)
    - [Libraries \& Utils](#libraries--utils)
  - [Learn More](#learn-more)
  - [Contributing](#contributing)
  - [License](#license)

---

## Vision

The Image Recognition Integration System (IRIS) was created to streamline the development of image search applications. By abstracting common tasks—such as capturing media, communicating with AI-powered search backends, and displaying results—IRIS lets you focus on your app’s unique features instead of boilerplate.

## Features

- **Cross-Platform**: Web app with static export, wrapped for iOS and Android via Capacitor.
- **Modular Architecture**: Clear separation between pages, UI components, and backend clients.
- **Secure Environment Configuration**: Uses `.env.local` for API URLs and credentials instead of public JSON.
- **Persistent History**: Stores previous search images in IndexedDB for offline access.

---

## Getting Started

1. **Clone the repository**:

   ```sh
   git clone https://github.com/oss-slu/image-recognition-integration-system.git
   cd image-recognition-integration-system
   ```

2. **Install dependencies**:

   ```sh
   npm install
   # or
   yarn install
   ```

3. **Run in development**:

   ```sh
   npm run dev
   # or
   yarn dev
   ```

4. **Build & Export for production**:

   ```sh
   npm run build
   npm run export
   ```

---

## Capacitor Setup

To deploy IRIS as a native app on iOS or Android, follow these steps:

1. **Install Capacitor CLI** (if not already installed):

   ```sh
   npm install @capacitor/core @capacitor/cli --save
   ```

2. **Initialize Capacitor** (one-time, if not done):

   ```sh
   npx cap init
   # Use com.iris.app for App ID and "image-recognition-integration-system" for App Name
   ```

3. **Add Platforms**:

   ```sh
   npx cap add ios
   npx cap add android
   ```

4. **Configure**: The file `capacitor.config.ts` sets your `appId`, `appName`, and `webDir`. By default, `webDir` is `out` (the export directory).

5. **Build & Sync**:

   ```sh
   npm run build
   npm run export
   npx cap copy
   ```

6. **Open & Run**:

   ```sh
   npx cap open ios
   # or
   npx cap open android
   ```

---

## Secure Configuration (`.env.local`)

IRIS now uses environment-based configuration instead of a public JSON file

### Environment Variables

Create a `.env.local` file in the project root with:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5050
API_SECRET_KEY=7b5ef4e74ed218a9d77ca03a3f74e86d
ALLOWED_ORIGIN=http://localhost:3000
```

NEXT_PUBLIC_API_URL = URL of your backend (proxied through Express).
API_SECRET_KEY = Secret key required for backend authentication.
ALLOWED_ORIGIN = Domain allowed to access your backend.

---

## CI/CD Security Validation

This project includes an automated GitHub Action that blocks commits exposing
sensitive configuration (e.g., public/setup.json or API keys).

The workflow file is located at .github/workflows/security-scan.yml.

## Project Structure

### Pages (in `/app`)

- `/` (**Home**): Capture or upload images, send to API, and display search results.
- `/about`: Overview of the IRIS framework and project goals.
- `/loginscreen`: User authentication interface (stubbed for POC).
- `/imageGallery`: Interactive gallery showcasing image search examples and sample queries.
- `/previousImages`: View and manage history of previously searched images (stored in IndexedDB).
- `/profile`: User profile and settings page (for future integration).

### Components (in `/app/components`)

- **CameraButton**: Opens device camera or file picker.
- **ImageDisplay**: Renders a single image with metadata.
- **ImageGrid**: Arranges multiple `ImageDisplay` cards in a responsive grid.
- **ImageModal**: Fullscreen modal for viewing image details and search metadata.
- **NavigationBar**: Top-level navigation with links to pages.

### Libraries & Utils

- `lib/modelClient.ts`: API client for communicating with the image recognition backend.
- `utils/indexedDbHelpers.ts`: Helpers for saving/retrieving image records in IndexedDB.
- `types/config.ts`: TypeScript definitions for runtime configuration and theming.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)

---

## Contributing

Contributions are welcome! Please review `CONTRIBUTING.md` for guidelines on issue reporting, coding standards, and pull requests.

---

## License

This project is licensed under the [GNU Lesser General Public License (LGPL)](https://www.gnu.org/licenses/lgpl-3.0.html), version 3.0 or later.

You are free to use, modify, and distribute this software under the terms of the LGPL, provided that any modifications to the library itself are also shared under the same license. When used in a larger application, the rest of the application can be licensed under different terms.