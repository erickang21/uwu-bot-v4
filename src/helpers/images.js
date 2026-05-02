const fs = require("fs/promises");
const path = require("path");

const BASE_SFW_DIR = "/home/ubuntu/uwu-bot-images/images/sfw";
const BASE_NSFW_DIR = "/home/ubuntu/uwu-bot-images/images/nsfw";

class ImageService {
    constructor() {
        this.sfwImageCache = {};
        this.nsfwImageCache = {};
    }

    async loadSFWImages() {
        try {
            const folders = await fs.readdir(BASE_SFW_DIR, { withFileTypes: true });

            for (const folder of folders) {
                if (!folder.isDirectory()) continue;

                const command = folder.name;
                const folderPath = path.join(BASE_SFW_DIR, command);

                const files = await fs.readdir(folderPath);

                const images = files
                    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
                    .map(file => path.join(folderPath, file));

                this.sfwImageCache[command] = images;

                console.log(`Loaded ${images.length} images for ${command}`);
            }

            this.isLoaded = true;
            console.log("✅ All SFW image folders loaded");

        } catch (err) {
            console.error("Failed to load SFW images:", err);
        }
    }

    async loadNSFWImages() {
        try {
            const folders = await fs.readdir(BASE_NSFW_DIR, { withFileTypes: true });

            for (const folder of folders) {
                if (!folder.isDirectory()) continue;

                const command = folder.name;
                const folderPath = path.join(BASE_NSFW_DIR, command);

                const files = await fs.readdir(folderPath);

                const images = files
                    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
                    .map(file => path.join(folderPath, file));

                this.nsfwImageCache[command] = images;

                console.log(`Loaded ${images.length} images for ${command}`);
            }

            this.isLoaded = true;
            console.log("✅ All NSFW image folders loaded");

        } catch (err) {
            console.error("Failed to load NSFW images:", err);
        }
    }

    async getRandomSFWImage(command) {
        if (!this.isLoaded) return null;

        const images = this.sfwImageCache[command];

        if (!images || images.length === 0) return null;

        const idx = Math.floor(Math.random() * images.length);
        return images[idx];
    }

    async getRandomNSFWImage(command) {
        if (!this.isLoaded) return null;

        const images = this.nsfwImageCache[command];

        if (!images || images.length === 0) return null;

        const idx = Math.floor(Math.random() * images.length);
        return images[idx];
    }

}

module.exports = new ImageService();