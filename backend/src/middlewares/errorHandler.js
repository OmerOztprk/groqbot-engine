const errorHandler = (err, req, res, next) => {
    console.error('❌ Hata:', err.message);
  
    res.status(500).json({
      success: false,
      message: 'Sunucuda bir hata oluştu',
      error: err.message
    });
  };
  
  module.exports = errorHandler;
  