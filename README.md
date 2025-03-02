# Image Recognition Integration System (IRIS)

IRIS is an open-source framework designed to help developers build AI-powered image search applications with ease.

## The Vision Behind IRIS

The Image Recognition Integration System (IRIS) was created to simplify the development of domain-specific image search applications by providing a structured and modular framework.

The need for such a system arose from challenges faced in various fields, such as healthcare, education, and research, where efficient image retrieval and AI-powered search functionalities are crucial. Current solutions often require deep expertise in machine learning and infrastructure setup, making it difficult for many developers to integrate image recognition and search functionalities into their applications.

To address these challenges, IRIS was designed as an easy-to-use, scalable framework that allows developers to integrate pre-trained machine learning models and efficiently search through image datasets. Whether a developer wants to build a healthcare diagnostic tool, an educational image repository, or a research-oriented image retrieval system, IRIS provides the necessary components to streamline development.

One of the initial proof-of-concept applications is a system for identifying proprietary surgical screws, demonstrating the framework’s capabilities in a real-world medical use case. While not intended for immediate production deployment, this prototype showcases how IRIS can be adapted to specific industry needs and highlights areas for further improvement.

--

## Tech Stack

IRIS is built using the following technologies:

- **Next.js** – Frontend framework for building user interfaces.
- **React** – Component-based UI library.
- **TailwindCSS** – utility-first CSS framework.
- **Python** – Core programming language for backend development.
- **TensorFlow / PyTorch** – For integrating pre-trained image recognition models.
- **Docker** – Containerization for deployment consistency.

---

## Features

- **Modular Architecture** – Easily plug in different machine learning models.
- **Pre-trained Model Integration** – Supports various AI models for image recognition.
- **Efficient Image Indexing** – Perform high-speed searches.
- **Scalability** – Designed to scale from small to large datasets.
- **Developer-Friendly** – Clear documentation and well-structured codebase.

---

## Getting Started

Clone the repository:

```sh
git clone https://github.com/oss-slu/image-recognition-integration-system.git
cd image-recognition-integration-system
```

Install dependencies:

```sh
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Run the development server:

```sh
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

---

## Contributing

Contributions are welcome! Please check out the `CONTRIBUTING.md` for guidelines on how to get started.
