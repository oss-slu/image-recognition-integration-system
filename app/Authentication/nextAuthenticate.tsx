import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Replace this with your real auth API call:
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials)
        });

        const user = await res.json();

        if (res.ok && user) return user;
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET
});

export { handler as GET, handler as POST };
use client';

interface ImageModalProps {
    image: {
        id: string;
        data: string;
        timestamp: string;
    };
    onClose: () => void;
}
export default function ImageModal({ image, onClose }: ImageModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-4 max-w-md mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <img src={image.data} alt="Expanded" className="rounded-md mb-4" />
                <div className="text-sm text-gray-700">
                    <p><strong>ID:</strong> {image.id}</p>  
                    <p><strong>Timestamp:</strong> {new Date(image.timestamp).toLocaleString()}</p>
                </div>
                <button
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
}