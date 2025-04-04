const express = require('express');
const path = require('path');
const chatRoutes = require('./routes/chatRoutes');
const errorHandler = require('./middlewares/errorHandler');
const multer = require('multer');
const { handleFileUpload } = require('./controllers/uploadController');
const { initCronJobs } = require('./services/cronService');

const app = express();

app.use(express.json());

// Cron jobları başlat
initCronJobs();

// Dosya yükleme için storage ayarı
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Statik dosyalar için klasörleri tanımla
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Uploads klasörünü erişilebilir yap

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Chat API rotaları
app.use('/api', chatRoutes);

// Dosya yükleme rotası
app.post('/api/upload', upload.single('file'), handleFileUpload);

app.use(errorHandler);

module.exports = app;