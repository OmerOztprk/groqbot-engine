const cron = require('node-cron');
const { cleanupInactiveSessions } = require('../controllers/chatController');
const path = require('path');
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../../uploads');

// Tüm cron jobları burada başlatılır
const initCronJobs = () => {
  // Her gün gece yarısı eski oturumları temizle (00:00)
  cron.schedule('0 0 * * *', () => {
    console.log('🕒 Cron: Eski oturumlar temizleniyor...');
    cleanupInactiveSessions();
  });

  // Her hafta pazar günü eski dosyaları temizle
  cron.schedule('0 1 * * 0', () => {
    console.log('🕒 Cron: Eski yüklenen dosyalar temizleniyor...');
    cleanupOldUploadedFiles(7); // 7 günden eski dosyaları temizle
  });

  // Her 5 dakikada bir log
  cron.schedule('*/5 * * * *', () => {
    console.log(`🕒 Cron: Sistem kontrol - ${new Date().toLocaleString()}`);
  });

  console.log('✅ Cron jobs başlatıldı');
};

// Belirli bir günden eski dosyaları temizler
const cleanupOldUploadedFiles = (days) => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      return;
    }

    const now = new Date().getTime();
    const files = fs.readdirSync(uploadsDir);

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs; // Dosyanın değiştirilme tarihi ile şimdiki zaman arasındaki fark
      const daysInMs = days * 24 * 60 * 60 * 1000;
      
      if (fileAge > daysInMs) {
        fs.unlinkSync(filePath);
        console.log(`Eski dosya silindi: ${file}`);
      }
    });
  } catch (error) {
    console.error('Dosya temizleme hatası:', error);
  }
};

module.exports = { initCronJobs };