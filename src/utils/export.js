export class ExportManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.isRecording = false;
    this.chunks = [];
    this.mediaRecorder = null;
  }

  // Export as PNG
  exportPNG(filename = 'commit-canvas') {
    return new Promise((resolve, reject) => {
      try {
        const dataUrl = this.canvas.toDataURL('image/png');
        this.downloadImage(dataUrl, `${filename}.png`);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Export as high-resolution PNG
  exportHighResolutionPNG(scale = 2, filename = 'commit-canvas-hd') {
    return new Promise((resolve, reject) => {
      try {
        const width = this.canvas.width * scale;
        const height = this.canvas.height * scale;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Scale the context
        tempCtx.scale(scale, scale);
        
        // Draw the original canvas
        tempCtx.drawImage(this.canvas, 0, 0);
        
        const dataUrl = tempCanvas.toDataURL('image/png');
        this.downloadImage(dataUrl, `${filename}.png`);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Start recording video
  startRecording(framerate = 60, mimeType = 'video/webm') {
    return new Promise((resolve, reject) => {
      try {
        const stream = this.canvas.captureStream(framerate);
        this.chunks = [];
        
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: 5000000
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.chunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          this.downloadVideo(url, 'commit-canvas.webm');
          resolve(url);
        };

        this.mediaRecorder.onerror = (error) => {
          reject(error);
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Stop recording video
  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        resolve();
      };

      this.mediaRecorder.onerror = (error) => {
        this.isRecording = false;
        reject(error);
      };

      this.mediaRecorder.stop();
    });
  }

  // Export as animated GIF (using gif.js library)
  async exportGIF(frames = 30, delay = 100, filename = 'commit-canvas') {
    if (typeof GIF === 'undefined') {
      throw new Error('gif.js library not loaded');
    }

    return new Promise((resolve, reject) => {
      try {
        const gif = new GIF({
          workers: 2,
          quality: 10,
          width: this.canvas.width,
          height: this.canvas.height,
        });

        gif.on('finished', (blob) => {
          const url = URL.createObjectURL(blob);
          this.downloadGIF(url, `${filename}.gif`);
          resolve(url);
        });

        gif.on('error', (error) => {
          reject(error);
        });

        // Capture frames
        const captureFrames = async () => {
          for (let i = 0; i < frames; i++) {
            gif.addFrame(this.canvas, { delay: delay });
            await new Promise(resolve => setTimeout(resolve, Math.floor(1000 / 60))); // Wait for next frame
          }
          gif.render();
        };

        captureFrames();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper function to download images
  downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Helper function to download videos
  downloadVideo(url, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Helper function to download GIFs
  downloadGIF(url, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Copy to clipboard
  async copyToClipboard() {
    try {
      const blob = await new Promise(resolve => this.canvas.toBlob(resolve));
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Get canvas data URL with options
  getDataURL(format = 'image/png', quality = 1.0) {
    return this.canvas.toDataURL(format, quality);
  }

  // Export canvas as blob
  getBlob(format = 'image/png', quality = 1.0) {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, format, quality);
    });
  }
}

export default ExportManager;
