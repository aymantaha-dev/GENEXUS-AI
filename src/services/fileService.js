const fs = require('fs');
const path = require('path');

// Safe UUID import fallback for different package shapes
let uuidv4;
try {
  const { v4 } = require('uuid');
  uuidv4 = v4;
} catch (e) {
  try {
    uuidv4 = require('uuid/v4');
  } catch (err) {
    console.error('Failed to import uuid:', err);
    throw new Error('UUID module not found. Please install uuid package.');
  }
}

class FileService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.tempDir = path.join(this.uploadDir, 'temp');
    
    // Ensure required directories exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(`Created directory: ${this.uploadDir}`);
    }

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      console.log(`Created directory: ${this.tempDir}`);
    }
  }

  async saveFile(file, subDir = '') {
    try {
      const uniqueName = `${uuidv4()}_${file.name}`;
      const dirPath = path.join(this.uploadDir, subDir);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const filePath = path.join(dirPath, uniqueName);
      await fs.promises.writeFile(filePath, file.data);
      
      return {
        path: filePath,
        url: `/uploads/${subDir}/${uniqueName}`,
        name: uniqueName,
        originalName: file.name,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  async saveTempFile(data, originalName = 'upload.bin') {
    const uniqueName = `${uuidv4()}_${path.basename(originalName)}`;
    const tempPath = path.join(this.tempDir, uniqueName);
    await fs.promises.writeFile(tempPath, data);
    return {
      path: tempPath,
      name: uniqueName,
      originalName
    };
  }

  async readFile(filePath) {
    return fs.promises.readFile(filePath);
  }

  async deleteFile(filePath) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

module.exports = new FileService();
