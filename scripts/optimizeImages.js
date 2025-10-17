import sharp from "sharp";
import fs from "fs";

const inputDir = "./public/images"; // Where the current images are kept
const outputDir = "./public/optimized"; // Optimized files will be saved here

// Making sure the output folder exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
    console.log("Created optimized folder");
}

// Going through every image in /public/images
fs.readdirSync(inputDir).forEach(file => {
    if (file.endsWith(".jpg") || file.endsWith(".png")) {
        sharp(`${inputDir}/${file}`)
          .webp({ quality: 80 })
          .toFile(`${outputDir}/${file.split(".")[0]}.webp`)
          .then(() => console.log(`optimized -> ${file}`))
          .catch(err => console.error(`error on ${file}:`, err));
    }
});