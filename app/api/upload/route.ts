import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { image } = await req.json();


    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Send the Base64 image to the external API

    //switch to http://api.shniter.com:5000/search if you arent at Julian's house
    const { data } = await axios.post("http://api.shniter.com:5000/search", { image });

    console.log("API response:", data);
    if (!data?.similar_images || !Array.isArray(data.similar_images)) {
      return NextResponse.json({ error: "Invalid API response format" }, { status: 500 });
    }

    return NextResponse.json({ similar_images: data.similar_images }, { status: 200 });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
