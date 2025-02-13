"use client"

import { Camera, CameraResultType } from "@capacitor/camera";
import useImageStore from "@/app/stores/imageStore";
import { useRouter } from "next/navigation";

const CameraButton = () => {

    const router = useRouter();
    const setBase64Image = useImageStore((state: any) => state.setBase64Image);
    const takePhoto = async () => {
        try {
            const photo = await Camera.getPhoto({
                quality: 100,
                resultType: CameraResultType.Uri,
                allowEditing: false,
            })

            // alert(`Photo taken: ${photo.webPath}`)
            if (photo.base64String) {
                router.push(`/gallery?image=${encodeURIComponent(photo.base64String)}`)
            } else {
                console.error("Photo base64String is undefined");
            }
            // setBase64Image(photo.base64String);
            
        } catch (error) {
            console.error("Camera error:", error);
            
        }
    };
            


    return <button className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md" onClick={takePhoto}>
    Use Camera
    </button>
}

export default CameraButton