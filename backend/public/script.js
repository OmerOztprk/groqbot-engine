document.addEventListener("DOMContentLoaded", () => {
    try {
      console.log("Script yükleniyor...");
      const chatMessages = document.getElementById("chat-messages");
      const userInput = document.getElementById("user-input");
      const sendButton = document.getElementById("send-button");
  
      const promptToggle = document.getElementById("prompt-toggle");
      const promptPanel = document.getElementById("prompt-panel");
      const promptInput = document.getElementById("prompt-input");
      const promptSave = document.getElementById("prompt-save");
      const promptReset = document.getElementById("prompt-reset");
  
      const fileUploadToggle = document.getElementById("file-upload-toggle");
      const dropzonePanel = document.getElementById("dropzone-panel");
      const dropzoneClose = document.getElementById("dropzone-close");
      const dropzoneContainer = document.getElementById("dropzone-container");
      
      let sessionId = localStorage.getItem("chatSessionId");
  
      const savedPrompt = localStorage.getItem("chatbotPrompt");
      if (savedPrompt) {
        promptInput.value = savedPrompt;
      }
  
      // Dropzone yapılandırması
      let myDropzone = null;
      
      // Dropzone'u başlatan fonksiyon - tamamen yeniden yazıldı
      const initializeDropzone = () => {
        console.log("Dropzone başlatılıyor...");
        
        // Eğer önceki dropzone varsa temizle
        if (myDropzone) {
          try {
            myDropzone.destroy();
            console.log("Önceki Dropzone temizlendi");
          } catch (e) {
            console.error("Dropzone temizlenirken hata:", e);
          }
        }
        
        // Dropzone elementini kontrol et
        const dropzoneElement = document.getElementById("file-dropzone");
        if (!dropzoneElement) {
          console.error("file-dropzone elementi bulunamadı!");
          return;
        }
        
        // Yeni bir Dropzone örneği oluştur
        if (typeof Dropzone !== "undefined") {
          try {
            // Dropzone konfigürasyonu
            myDropzone = new Dropzone("#file-dropzone", {
              url: "/api/upload",
              maxFilesize: 5,
              acceptedFiles: "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt",
              addRemoveLinks: true,
              dictRemoveFile: "Kaldır",
              dictCancelUpload: "İptal",
              dictDefaultMessage: "Dosyaları buraya sürükleyin veya tıklayarak seçin",
              dictFileTooBig: "Dosya çok büyük ({{filesize}}MB). Maksimum dosya boyutu: {{maxFilesize}}MB.",
              dictInvalidFileType: "Bu dosya türü yüklenemez.",
              dictResponseError: "Sunucu {{statusCode}} hata koduyla yanıt verdi.",
              dictCancelUploadConfirmation: "Bu dosya yüklemeyi iptal etmek istediğinize emin misiniz?",
              dictRemoveFileConfirmation: null,
              autoProcessQueue: true,
              clickable: true, // Tıklanabilir olduğunu garanti et
              createImageThumbnails: true
            });
            
            console.log("Dropzone başarıyla oluşturuldu");
            
            // Olayları ekle
            myDropzone.on("addedfile", function (file) {
              console.log("Dosya eklendi:", file.name);
            });
            
            myDropzone.on("success", async function (file, response) {
              console.log("Yükleme başarılı:", response);
              
              // Dosya bilgileri alınıyor
              if (response && response.success && response.file) {
                const fileInfo = response.file;
                
                // Dosya türüne göre uygun simgeyi seç
                let fileIcon = "fa-file";
                if (file.type.includes("image")) fileIcon = "fa-file-image";
                else if (file.type.includes("pdf")) fileIcon = "fa-file-pdf";
                else if (
                  file.type.includes("word") ||
                  file.name.endsWith(".doc") ||
                  file.name.endsWith(".docx")
                )
                  fileIcon = "fa-file-word";
                else if (
                  file.type.includes("excel") ||
                  file.name.endsWith(".xls") ||
                  file.name.endsWith(".xlsx")
                )
                  fileIcon = "fa-file-excel";
                else if (file.type.includes("text") || file.name.endsWith(".txt")) fileIcon = "fa-file-lines";
                
                // Dosya boyutunu formatla
                const fileSize = formatFileSize(file.size);
                
                // Dosya mesajını sohbete ekle
                addMessageToChat(
                  `<div class="file-info">
                                <div class="file-icon"><i class="fa-solid ${fileIcon}"></i></div>
                                <div class="file-details">
                                    <div class="file-name">${file.name}</div>
                                    <div class="file-size">${fileSize}</div>
                                </div>
                            </div>`,
                  "user",
                  true,
                  "file-message"
                );
                
                // Dropzone panelini kapat
                dropzonePanel.classList.add("hidden");
                
                // Metin dosyası ise içeriğini oku
                let fileContent = null;
                if (file.type.includes("text") || file.name.endsWith(".txt")) {
                  try {
                    const textResponse = await fetch(fileInfo.url);
                    fileContent = await textResponse.text();
                    console.log("Dosya içeriği okundu, ilk 50 karakter:", fileContent.substring(0, 50) + "...");
                  } catch (error) {
                    console.error("Dosya içeriği okuma hatası:", error);
                  }
                }
                
                // Dosya bilgisini sunucuya gönder (içerik de dahil)
                sendFileInfo(file.name, fileInfo.url, fileSize, file.type, fileContent);
              }
            });
            
            myDropzone.on("error", function (file, errorMessage) {
              console.error("Yükleme hatası:", errorMessage);
              showError("Dosya yüklenirken bir hata oluştu: " + errorMessage);
              this.removeFile(file);
            });
          } catch (error) {
            console.error("Dropzone oluşturulurken hata:", error);
          }
        } else {
          console.error("Dropzone kütüphanesi yüklenemedi!");
          if (fileUploadToggle) {
            fileUploadToggle.style.display = "none";
          }
        }
      };
  
      // Dosya boyutunu formatla (KB, MB, vb.)
      const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };
  
      // Dosya bilgisini mesaj olarak gönder - İÇERİK EKLENDİ
      const sendFileInfo = async (fileName, fileUrl, fileSize, fileType, fileContent = null) => {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userMessage: `Dosya paylaştım: ${fileName} (${fileSize})`,
              sessionId: sessionId,
              customPrompt: localStorage.getItem("chatbotPrompt") || "",
              fileInfo: {
                name: fileName,
                url: fileUrl,
                size: fileSize,
                type: fileType,
                content: fileContent
              },
            }),
          });
  
          if (response.ok) {
            const data = await response.json();
  
            if (data.success) {
              if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem("chatSessionId", sessionId);
              }
  
              const botMessageId = "msg-" + Date.now();
              addEmptyBotMessage(botMessageId);
              await typeMessageGradually(botMessageId, data.response);
              saveMessages();
            }
          }
        } catch (error) {
          console.error("Dosya bilgisi gönderme hatası:", error);
          showError("Dosya bilgisi gönderilirken hata: " + error.message);
        }
      };
  
      // İlk Dropzone'u oluştur
      if (typeof Dropzone !== "undefined") {
        console.log("Sayfa yüklendiğinde ilk Dropzone başlatılıyor");
        // Kısa bir gecikme ile başlat
        setTimeout(() => {
          initializeDropzone();
        }, 300);
      }
  
      // Dosya yükleme butonu tıklaması
      if (fileUploadToggle) {
        fileUploadToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log("Dosya yükleme butonu tıklandı");
  
          if (dropzonePanel.classList.contains("hidden")) {
            dropzonePanel.classList.remove("hidden");
            console.log("Dropzone paneli açıldı");
            
            // Panel açıldıktan sonra Dropzone'u yeniden başlat
            setTimeout(() => {
              initializeDropzone();
            }, 300);
          } else {
            dropzonePanel.classList.add("hidden");
            console.log("Dropzone paneli kapatıldı");
          }
        });
      }
  
      // Dropzone kapat butonu
      if (dropzoneClose) {
        dropzoneClose.addEventListener("click", (e) => {
          e.stopPropagation();
          dropzonePanel.classList.add("hidden");
          console.log("Dropzone paneli kapat butonuyla kapatıldı");
        });
      }
  
      // Belge tıklandığında dropzone panelini kapat
      document.addEventListener("click", (e) => {
        if (
          dropzonePanel &&
          !dropzonePanel.classList.contains("hidden") &&
          !dropzonePanel.contains(e.target) &&
          e.target !== fileUploadToggle
        ) {
          dropzonePanel.classList.add("hidden");
        }
      });
  
      // Prompt panel işlevselliği
      if (promptToggle) {
        promptToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          promptPanel.classList.toggle("hidden");
        });
      }
  
      if (promptInput) {
        promptInput.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      }
  
      if (promptSave) {
        promptSave.addEventListener("click", (e) => {
          e.stopPropagation();
          const promptText = promptInput.value.trim();
          localStorage.setItem("chatbotPrompt", promptText);
          promptPanel.classList.add("hidden");
  
          showNotification("Chatbot stili kaydedildi!");
        });
      }
  
      if (promptReset) {
        promptReset.addEventListener("click", (e) => {
          e.stopPropagation();
          promptInput.value = "";
          localStorage.removeItem("chatbotPrompt");
          promptPanel.classList.add("hidden");
  
          showNotification("Chatbot stili sıfırlandı!");
        });
      }
  
      document.addEventListener("click", (e) => {
        if (
          promptPanel &&
          !promptPanel.classList.contains("hidden") &&
          !promptPanel.contains(e.target) &&
          e.target !== promptToggle
        ) {
          promptPanel.classList.add("hidden");
        }
      });
  
      const showNotification = (message) => {
        const notification = document.createElement("div");
        notification.className = "notification";
        notification.textContent = message;
        document.body.appendChild(notification);
  
        setTimeout(() => {
          notification.remove();
        }, 2000);
      };
  
      const loadSavedMessages = () => {
        const savedMessages = localStorage.getItem("chatMessages");
        if (savedMessages) {
          try {
            const messages = JSON.parse(savedMessages);
            messages.forEach((msg) => {
              addMessageToChat(msg.text, msg.sender, false);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } catch (e) {
            console.error("Mesajlar yüklenemedi:", e);
            localStorage.removeItem("chatMessages");
          }
        }
      };
  
      loadSavedMessages();
  
      const saveMessages = () => {
        const messages = [];
        document.querySelectorAll(".message").forEach((messageDiv) => {
          const text = messageDiv.querySelector("p")?.textContent || "";
          const sender = messageDiv.classList.contains("user-message")
            ? "user"
            : "bot";
          messages.push({ text, sender });
        });
  
        if (messages.length > 50) {
          messages.splice(0, messages.length - 50);
        }
  
        localStorage.setItem("chatMessages", JSON.stringify(messages));
      };
  
      userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
      });
  
      const sendMessage = async () => {
        const message = userInput.value.trim();
        if (!message) return;
  
        addMessageToChat(message, "user");
  
        userInput.value = "";
        userInput.style.height = "auto";
  
        const loadingId = showLoadingIndicator();
  
        document.querySelectorAll(".error-message").forEach((el) => el.remove());
  
        try {
          const customPrompt = localStorage.getItem("chatbotPrompt") || "";
  
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userMessage: message,
              sessionId: sessionId,
              customPrompt: customPrompt,
            }),
          });
  
          removeLoadingIndicator(loadingId);
  
          const botMessageId = "msg-" + Date.now();
          addEmptyBotMessage(botMessageId);
  
          if (response.ok) {
            const data = await response.json();
  
            if (data.success) {
              if (data.sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem("chatSessionId", sessionId);
              }
              await typeMessageGradually(botMessageId, data.response);
              saveMessages();
            } else {
              document.getElementById(botMessageId).remove();
              showError(data.message || "Yanıt alınırken bir hata oluştu.");
            }
          } else {
            document.getElementById(botMessageId).remove();
            const errorData = await response.json();
            showError(
              errorData.message ||
                "Sunucu ile iletişim kurulurken bir hata oluştu."
            );
          }
        } catch (error) {
          console.error("Error:", error);
          removeLoadingIndicator(loadingId);
          showError(
            "Bağlantı hatası, lütfen internet bağlantınızı kontrol edin."
          );
        }
      };
  
      const addEmptyBotMessage = (id) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = "message bot-message";
        messageDiv.id = id;
  
        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
  
        const paragraph = document.createElement("p");
        paragraph.textContent = "";
  
        contentDiv.appendChild(paragraph);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
  
        chatMessages.scrollTop = chatMessages.scrollHeight;
      };
  
      const typeMessageGradually = async (messageId, text) => {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;
  
        const paragraph = messageElement.querySelector("p");
        if (!paragraph) return;
  
        paragraph.textContent = "";
  
        const minDelay = 10;
        const maxDelay = 20;
  
        let currentIndex = 0;
  
        while (currentIndex < text.length) {
          const chunkSize = Math.floor(Math.random() * 3) + 1;
          const end = Math.min(currentIndex + chunkSize, text.length);
          const chunk = text.substring(currentIndex, end);
  
          paragraph.textContent += chunk;
          currentIndex = end;
  
          chatMessages.scrollTop = chatMessages.scrollHeight;
  
          const delay = Math.random() * (maxDelay - minDelay) + minDelay;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
  
        return true;
      };
  
      // HTML içerikli mesaj ekleme desteği
      const addMessageToChat = (
        text,
        sender,
        shouldSave = true,
        extraClass = ""
      ) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}-message ${extraClass}`;
        messageDiv.id = "msg-" + Date.now();
  
        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
  
        if (
          typeof text === "string" &&
          (text.includes("<div") || text.includes("<p"))
        ) {
          contentDiv.innerHTML = text;
        } else {
          const paragraph = document.createElement("p");
          paragraph.textContent = text;
          contentDiv.appendChild(paragraph);
        }
  
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
  
        chatMessages.scrollTop = chatMessages.scrollHeight;
  
        if (shouldSave) {
          saveMessages();
        }
  
        return messageDiv.id;
      };
  
      const showError = (message) => {
        const errorDiv = document.createElement("div");
        errorDiv.className = "message bot-message error-message";
  
        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content error";
  
        const paragraph = document.createElement("p");
        paragraph.textContent = `❌ Hata: ${message}`;
  
        contentDiv.appendChild(paragraph);
        errorDiv.appendChild(contentDiv);
        chatMessages.appendChild(errorDiv);
  
        chatMessages.scrollTop = chatMessages.scrollHeight;
  
        saveMessages();
      };
  
      const showLoadingIndicator = () => {
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "message bot-message loading-indicator";
  
        const contentDiv = document.createElement("div");
        contentDiv.className = "message-content";
  
        const dotsDiv = document.createElement("div");
        dotsDiv.className = "loading-dots";
  
        for (let i = 0; i < 3; i++) {
          const dot = document.createElement("div");
          dot.className = "dot";
          dotsDiv.appendChild(dot);
        }
  
        contentDiv.appendChild(dotsDiv);
        loadingDiv.appendChild(contentDiv);
        loadingDiv.id = "loading-" + Date.now();
        chatMessages.appendChild(loadingDiv);
  
        chatMessages.scrollTop = chatMessages.scrollHeight;
  
        return loadingDiv.id;
      };
  
      const removeLoadingIndicator = (id) => {
        const loadingElement = document.getElementById(id);
        if (loadingElement) {
          loadingElement.remove();
        }
      };
  
      const addClearButton = () => {
        const clearButton = document.createElement("button");
        clearButton.id = "clear-chat";
        clearButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
        clearButton.title = "Sohbeti temizle";
  
        clearButton.addEventListener("click", () => {
          if (
            confirm("Tüm sohbet geçmişini silmek istediğinizden emin misiniz?")
          ) {
            while (chatMessages.firstChild) {
              chatMessages.removeChild(chatMessages.firstChild);
            }
  
            addMessageToChat(
              "Merhaba! Ben Groq destekli bir chatbot'um. Bana bir şeyler sorabilirsin.",
              "bot"
            );
  
            localStorage.removeItem("chatMessages");
            localStorage.removeItem("chatSessionId");
            sessionId = null;
          }
        });
  
        const style = document.createElement("style");
        style.textContent = `
                  #clear-chat {
                      position: absolute;
                      top: 16px;
                      right: 16px;
                      width: 36px;
                      height: 36px;
                      border-radius: 50%;
                      background: rgba(255, 255, 255, 0.2);
                      border: none;
                      color: white;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      transition: all 0.2s;
                  }
                  #clear-chat:hover {
                      background: rgba(255, 255, 255, 0.3);
                  }
                  .chat-header {
                      position: relative;
                  }
                  .error {
                      background-color: #fff8f8 !important;
                      border-left: 3px solid #e74c3c !important;
                      color: #e74c3c !important;
                  }
              `;
  
        document.head.appendChild(style);
        document.querySelector(".chat-header").appendChild(clearButton);
      };
  
      addClearButton();
  
      sendButton.addEventListener("click", sendMessage);
  
      userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
  
      console.log("Script başarıyla yüklendi!");
    } catch (error) {
      console.error("Chatbot başlatma hatası:", error);
      alert("Chatbot yüklenirken bir hata oluştu: " + error.message);
    }
  });