const path = require('path');
const fs = require('fs');

// uploads klasörünü oluştur (eğer yoksa)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const handleFileUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dosya yüklenmedi' 
      });
    }

    // Dosya URL'ini oluştur
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Dosya başarıyla yüklendi',
      file: {
        name: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Dosya yüklenirken bir hata oluştu' 
    });
  }
};

module.exports = { handleFileUpload };