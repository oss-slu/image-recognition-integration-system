import React from "react";
import Link from "next/link";

export default function About() {
  return (
    <div className="p-8 max-w-2xl mx-auto bg-grey rounded-xl shadow-md space-y-10">
      <h1 className="text-2xl font-bold">About This App</h1>
      <p>
        This application was developed under the Open-Source-Software Centre
        at SLU with Julian as the team lead and with Ramez, Mustafa and Megh working
        under him.
        We aim to provide a seamless and user-friendly
        experience with this framework.
      </p>
      <p>More Information coming later.</p>
      <h2 className="text-xl font-semibold">License</h2>
      <p>
        This software is licensed under the XYZ License. All rights reserved. For
        more information, please refer to our licensing terms.
      </p>

      <div className="mt-6">
        <Link href="/">
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
};

