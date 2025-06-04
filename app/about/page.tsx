import React from "react";
//import Link from "next/link";

export default function About() {
  return (
    <div className="bg-gray-800 mx-auto max-w-3xl space-y-10 rounded-xl p-8 pb-16 text-white shadow-lg">
      <h1 className="text-3xl font-bold">About IRIS</h1>

      <p>
        <strong>IRIS (Image Recognition Integration System)</strong> is an open-source framework designed to simplify the development of AI-powered image search applications.
        It was created to help developers easily integrate image recognition models into domain-specific applications across healthcare, education, and research industries.
      </p>
      <p>
        The need for such a system arose from challenges faced in various fields, such as healthcare, education, and research, where efficient image retrieval and AI-powered search functionalities are crucial.
        Current solutions often require deep expertise in machine learning and infrastructure setup, making it difficult for many developers to integrate image recognition and search functionalities into their applications.
      </p>
      <p>
        To address these challenges, IRIS was designed as an easy-to-use, scalable framework that allows developers to integrate pre-trained machine learning models and efficiently search through image datasets.
        Whether a developer wants to build a healthcare diagnostic tool, an educational image repository, or a research-oriented image retrieval system, IRIS provides the necessary components to streamline development.
      </p>

      <p>
        The project originated under the <strong>Open-Source Software Centre</strong> at SLU, led by Julian, with developers Ramez, Mustafa, Megh, and Karthik contributing to its success.
        Our goal is to provide a scalable, developer-friendly, and modular framework for building intelligent image retrieval systems.
      </p>

      <h2 className="text-2xl font-semibold">Meet the Team</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Julian Shniter</strong> – Team Lead & Developer
          <br />
          <a className="text-blue-400 hover:underline" href="https://github.com/smallrussian" target="_blank">GitHub</a> | <a className="text-blue-400 hover:underline" href="https://www.linkedin.com/in/julian-shniter-9576401a1/" target="_blank">LinkedIn</a>
        </li>
        <li>
          <strong>Ramez Mosad</strong> – Developer
          <br />
          <a className="text-blue-400 hover:underline" href="https://github.com/ramezmosad" target="_blank">GitHub</a>
        </li>
        <li>
          <strong>Mustafa Hashmi</strong> – Developer
          <br />
          <a className="text-blue-400 hover:underline" href="https://github.com/mhashm1" target="_blank">GitHub</a> | <a className="text-blue-400 hover:underline" href="https://www.linkedin.com/in/mustafa-hashmi02/" target="_blank">LinkedIn</a>
        </li>
        <li>
          <strong>Megh Patel</strong> – Developer
          <br />
          <a className="text-blue-400 hover:underline" href="https://github.com/MeghPatel6" target="_blank">GitHub</a> | <a className="text-blue-400 hover:underline" href="https://www.linkedin.com/in/megh-patel-741068233/" target="_blank">LinkedIn</a>
        </li>
        <li>
          <strong>Karthik Mangineni</strong> – UI/UX Developer
          <br />
          <a className="text-blue-400 hover:underline" href="https://github.com/rcAsironman" target="_blank">GitHub</a> | <a className="text-blue-400 hover:underline" href="https://www.linkedin.com/in/karthikfullstackdeveloper/" target="_blank">LinkedIn</a>
        </li>
      </ul>

      <h2 className="text-2xl font-semibold">Tech Stack</h2>
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Next.js</strong> – Frontend framework for server-rendered React apps.</li>
        <li><strong>React</strong> – Component-based UI library.</li>
        <li><strong>TailwindCSS</strong> – Utility-first CSS framework for styling.</li>
        <li><strong>Python</strong> – Backend development and scripting.</li>
        <li><strong>TensorFlow / PyTorch</strong> – Machine learning frameworks for model integration.</li>
        <li><strong>Docker</strong> – Containerization for consistent deployment.</li>
      </ul>

      <h2 className="text-2xl font-semibold">Features</h2>
      <ul className="list-disc list-inside space-y-2">
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
