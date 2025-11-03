import React from "react";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 rounded-xl bg-gray-800 p-8 pb-16 text-white shadow-lg">
      <h1 className="text-3xl font-bold">About IRIS</h1>

      <p>
        <strong>IRIS (Image Recognition Integration System)</strong> is an
        open-source framework designed to simplify the development of AI-powered
        image search applications. It helps developers integrate image
        recognition models into domain-specific applications across healthcare,
        education, and research.
      </p>

      <h2 className="text-2xl font-semibold">Meet the Team</h2>
      <ul className="list-inside list-disc space-y-2">
        <li>
          <strong>Julian Shniter</strong> – Team Lead & Developer —
          <a className="ml-1 text-blue-400 hover:underline" href="https://github.com/smallrussian" target="_blank" rel="noreferrer">GitHub</a>
        </li>
        <li>
          <strong>Ramez Mosad</strong> – Developer —
          <a className="ml-1 text-blue-400 hover:underline" href="https://github.com/ramezmosad" target="_blank" rel="noreferrer">GitHub</a>
        </li>
        <li>
          <strong>Mustafa Hashmi</strong> – Developer —
          <a className="ml-1 text-blue-400 hover:underline" href="https://github.com/mhashm1" target="_blank" rel="noreferrer">GitHub</a>
        </li>
        <li>
          <strong>Megh Patel</strong> – Developer —
          <a className="ml-1 text-blue-400 hover:underline" href="https://github.com/MeghPatel6" target="_blank" rel="noreferrer">GitHub</a>
        </li>
        <li>
          <strong>Karthik Mangineni</strong> – UI/UX Developer —
          <a className="ml-1 text-blue-400 hover:underline" href="https://github.com/rcAsironman" target="_blank" rel="noreferrer">GitHub</a>
        </li>
      </ul>

      <h2 className="text-2xl font-semibold">Tech Stack</h2>
      <ul className="list-inside list-disc space-y-2">
        <li><strong>Next.js</strong> – Frontend framework for server-rendered React apps.</li>
        <li><strong>React</strong> – Component-based UI library.</li>
        <li><strong>TailwindCSS</strong> – Utility-first CSS framework for styling.</li>
        <li><strong>Python</strong> – Backend development and scripting.</li>
        <li><strong>TensorFlow / PyTorch</strong> – Machine learning frameworks for model integration.</li>
        <li><strong>Docker</strong> – Containerization for consistent deployment.</li>
      </ul>

      <h2 className="text-2xl font-semibold">Features</h2>
      <ul className="list-inside list-disc space-y-2">
        <li>Modular architecture for easy customization.</li>
        <li>Integration of pre-trained machine learning models.</li>
        <li>Efficient image indexing and high-speed search capabilities.</li>
        <li>Designed for scalability from small to large datasets.</li>
        <li>Clear documentation and a developer-friendly codebase.</li>
      </ul>

      <h2 className="text-2xl font-semibold">License</h2>
      <p>
        This software is licensed under the <strong>XYZ License</strong>. All rights reserved.
      </p>
    </div>
  );
}
