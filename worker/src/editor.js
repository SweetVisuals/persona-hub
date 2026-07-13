const fs = require('fs');
const path = require('path');
const os = require('os');
const { createCanvas, loadImage, registerFont } = require('canvas');

try {
    const fontPath = path.join(__dirname, '../fonts/TikTokSans-Medium.ttf');
    registerFont(fontPath, { family: 'CustomTikTokFont' });
    console.log('[Editor] Registered TikTok Sans font successfully.');
} catch (e) {
    console.error('[Editor] Failed to register custom font:', e.message);
}

class EditorEngine {
    constructor(persona, strategy) {
        this.persona = persona;
        this.strategy = strategy;
        this.targetSize = this.parseAspectRatio(strategy.settings?.aspectRatio || persona.aspect_ratio || '9:16');
    }
    
    parseAspectRatio(ratioStr) {
        if (ratioStr === '1:1') return { w: 1080, h: 1080 };
        if (ratioStr === '16:9') return { w: 1920, h: 1080 };
        if (ratioStr === '4:5') return { w: 1080, h: 1350 };
        if (ratioStr === '3:4') return { w: 1080, h: 1440 };
        if (ratioStr === '4:3') return { w: 1080, h: 810 };
        return { w: 1080, h: 1920 };
    }

    async processAndBakeSlide(imageUrl, textContent, index) {
        console.log(`[Editor] Fetching image for slide ${index}: ${imageUrl}`);
        
        // Fetch image
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error("Failed to fetch image: " + res.statusText);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const image = await loadImage(buffer);
        
        const { w, h } = this.targetSize;
        const canvas = createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        // 1. Cover Crop
        const imgRatio = image.width / image.height;
        const targetRatio = w / h;
        let drawW = w, drawH = h, offsetX = 0, offsetY = 0;
        
        if (imgRatio > targetRatio) {
            drawW = h * imgRatio;
            offsetX = (w - drawW) / 2;
        } else {
            drawH = w / imgRatio;
            offsetY = (h - drawH) / 2;
        }
        
        ctx.drawImage(image, offsetX, offsetY, drawW, drawH);
        
        // 2. Bake Text
        const fontSize = this.strategy.settings?.fontSize || 64;
        ctx.font = `${fontSize}px CustomTikTokFont, sans-serif`; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Multi-line support if text contains newlines
        const lines = textContent.split('\n');
        const lineHeight = fontSize * 1.2;
        const startY = (h / 2) - ((lines.length - 1) * lineHeight / 2);

        lines.forEach((line, i) => {
            const y = startY + (i * lineHeight);
            // Stroke
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#000000';
            ctx.strokeText(line, w / 2, y);
            
            // Fill
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(line, w / 2, y);
        });
        
        // 3. Save to Temp
        const tempPath = path.join(os.tmpdir(), `baked_slide_${Date.now()}_${index}.jpg`);
        const out = fs.createWriteStream(tempPath);
        const stream = canvas.createJPEGStream({ quality: 0.95 });
        stream.pipe(out);
        
        return new Promise((resolve, reject) => {
            out.on('finish', () => resolve(tempPath));
            out.on('error', reject);
        });
    }

    async generateTikTokSlideshow(imagesArray) {
        if (!this.strategy || this.strategy.settings.type !== 'slideshow') {
            throw new Error("Invalid strategy type for slideshow generation");
        }
        
        const { slides } = this.strategy.settings;
        if (!slides || slides.length === 0) {
            throw new Error("No slides defined in strategy");
        }

        const localPaths = [];
        for (let i = 0; i < slides.length; i++) {
            const slideText = slides[i];
            const sourceImageUrl = imagesArray[i % imagesArray.length];
            const localPath = await this.processAndBakeSlide(sourceImageUrl, slideText, i + 1);
            localPaths.push(localPath);
            console.log(`[Editor] Completed slide ${i+1}/${slides.length}`);
        }
        
        return localPaths; 
    }
}

module.exports = EditorEngine;
