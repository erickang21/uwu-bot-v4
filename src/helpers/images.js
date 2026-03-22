const fs = require("fs/promises");
const path = require("path");

const BASE_DIR = "/home/ubuntu/uwu-bot-images/images";

class ImageService {
    constructor() {
        this.imageCache = {};
    }

    async loadImages() {
        try {
            const folders = await fs.readdir(BASE_DIR, { withFileTypes: true });

            for (const folder of folders) {
                if (!folder.isDirectory()) continue;

                const command = folder.name;
                const folderPath = path.join(BASE_DIR, command);

                const files = await fs.readdir(folderPath);

                const images = files
                    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
                    .map(file => path.join(folderPath, file));

                this.imageCache[command] = images;

                console.log(`Loaded ${images.length} images for ${command}`);
            }

            this.isLoaded = true;
            console.log("✅ All image folders loaded");

        } catch (err) {
            console.error("Failed to load images:", err);
        }
    }

    getRandomImage(command) {
        if (!this.isLoaded) return null;

        const images = this.imageCache[command];

        if (!images || images.length === 0) return null;

        const idx = Math.floor(Math.random() * images.length);
        return images[idx];
    }
}

module.exports = new ImageService();