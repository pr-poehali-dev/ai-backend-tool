(function(window) {
  window.initChatWidget = function(chatId) {
    var configUrl = 'https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815?id=' + chatId;
    var apiUrl = 'https://functions.poehali.dev/eac81e19-553b-4100-981e-e0202e5cb64d';
    var messages = [];
    var storageKey = 'gpt-chat-history-' + chatId;
    var cfg = null;
    var isModal = false;

    fetch(configUrl).then(function(r) { return r.json(); }).then(function(config) {
      cfg = config;
      isModal = cfg.position === 'center-modal';
      
      var positionStyles = {
        'bottom-right': 'bottom:20px;right:20px;',
        'bottom-left': 'bottom:20px;left:20px;',
        'top-right': 'top:20px;right:20px;',
        'top-left': 'top:20px;left:20px;',
        'center-modal': 'bottom:20px;right:20px;'
      };
      
      var position = cfg.position || 'bottom-right';
      var positionStyle = positionStyles[position];
      var isDark = cfg.theme === 'dark';
      var bgColor = isDark ? '#1a1a1a' : '#ffffff';
      var textColor = isDark ? '#ffffff' : '#000000';
      var messageBg = isDark ? '#2a2a2a' : '#f0f0f0';
      var borderColor = isDark ? '#333333' : '#e0e0e0';

      var css = document.createElement('style');
      css.textContent = '.gpt-widget{position:fixed;' + positionStyle + 'z-index:9999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
        '.gpt-btn{cursor:pointer;padding:14px 24px;border-radius:' + cfg.borderRadius + 'px;background:' + cfg.primaryColor + ';color:#fff;border:none;font-size:15px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px;transition:all 0.2s}' +
        '.gpt-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.2)}' +
        '.gpt-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0);z-index:9998;backdrop-filter:blur(0px);transition:background 0.3s ease,backdrop-filter 0.3s ease}' +
        '.gpt-overlay.open{display:block;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px)}' +
        '.gpt-window{display:none;width:' + cfg.width + 'px;height:' + cfg.height + 'px;background:' + bgColor + ';border-radius:' + cfg.borderRadius + 'px;box-shadow:0 8px 32px rgba(0,0,0,0.2);flex-direction:column;overflow:hidden;opacity:0;transform:scale(0.95);transition:opacity 0.3s ease,transform 0.3s ease}' +
        '.gpt-window.modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.95);z-index:9999}' +
        '.gpt-window.modal.open{transform:translate(-50%,-50%) scale(1);opacity:1}' +
        '.gpt-window.open{display:flex;opacity:1;transform:scale(1)}' +
        '.gpt-header{padding:16px 20px;background:' + cfg.primaryColor + ';color:#fff;font-weight:600;display:flex;justify-content:space-between;align-items:center;font-size:16px}' +
        '.gpt-close{cursor:pointer;background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:24px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background 0.2s}' +
        '.gpt-close:hover{background:rgba(255,255,255,0.3)}' +
        '.gpt-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}' +
        '.gpt-messages::-webkit-scrollbar{width:6px}' +
        '.gpt-messages::-webkit-scrollbar-thumb{background:' + borderColor + ';border-radius:3px}' +
        '.gpt-input-area{padding:16px;border-top:1px solid ' + borderColor + ';display:flex;gap:8px}' +
        '.gpt-input{flex:1;padding:12px 16px;border:1px solid ' + borderColor + ';border-radius:12px;font-size:14px;background:' + messageBg + ';color:' + textColor + ';outline:none}' +
        '.gpt-input:focus{border-color:' + cfg.primaryColor + '}' +
        '.gpt-send{padding:12px 20px;background:' + cfg.primaryColor + ';color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:600;transition:opacity 0.2s}' +
        '.gpt-send:hover{opacity:0.9}' +
        '.gpt-send:disabled{opacity:0.5;cursor:not-allowed}' +
        '.gpt-msg{max-width:75%;padding:10px 16px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word}' +
        '.gpt-msg.user{background:' + cfg.primaryColor + ';color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
        '.gpt-msg.bot{background:' + messageBg + ';color:' + textColor + ';align-self:flex-start;border-bottom-left-radius:4px}' +
        '.gpt-time{font-size:11px;color:' + (isDark ? '#888' : '#666') + ';margin-top:4px;padding:0 4px}' +
        '.gpt-typing{display:flex;gap:4px;padding:10px 16px;background:' + messageBg + ';border-radius:16px;width:fit-content}' +
        '.gpt-typing span{width:8px;height:8px;background:' + (isDark ? '#666' : '#999') + ';border-radius:50%;animation:typing 1.4s infinite}' +
        '.gpt-typing span:nth-child(2){animation-delay:0.2s}' +
        '.gpt-typing span:nth-child(3){animation-delay:0.4s}' +
        '@keyframes typing{0%,60%,100%{opacity:0.3}30%{opacity:1}}' +
        '.gpt-slider{position:relative;width:100%;height:150px;border-radius:8px;margin-bottom:8px;overflow:hidden;cursor:pointer}' +
        '.gpt-slider-track{display:flex;height:100%;transition:transform 0.3s ease}' +
        '.gpt-slider-slide{min-width:100%;height:100%;flex-shrink:0;background:linear-gradient(135deg,' + cfg.primaryColor + '10,' + cfg.primaryColor + '20);display:flex;align-items:center;justify-content:center}' +
        '.gpt-slider-slide img{width:100%;height:100%;object-fit:cover;background:transparent}' +
        '.gpt-slider-counter{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;z-index:1}';
      document.head.appendChild(css);

      var overlay = null;
      if (isModal) {
        overlay = document.createElement('div');
        overlay.className = 'gpt-overlay';
        overlay.id = 'gpt-overlay';
        document.body.appendChild(overlay);
      }

      var html = '<div class="gpt-window' + (isModal ? ' modal' : '') + '" id="gpt-win">' +
        '<div class="gpt-header"><span id="gpt-header-text"></span><button class="gpt-close" id="gpt-close-btn">×</button></div>' +
        '<div class="gpt-messages" id="gpt-msgs"></div>' +
        '<div class="gpt-input-area"><input type="text" class="gpt-input" id="gpt-input" placeholder="' + cfg.placeholder + '"/><button class="gpt-send" id="gpt-send-btn">Отправить</button></div>' +
        '</div>' +
        '<button class="gpt-btn" id="gpt-open-btn"><span id="gpt-btn-text"></span></button>';

      var container = document.createElement('div');
      container.className = 'gpt-widget';
      container.innerHTML = html;
      document.body.appendChild(container);

      document.getElementById('gpt-header-text').textContent = cfg.buttonIcon + ' ' + cfg.buttonText;
      document.getElementById('gpt-btn-text').textContent = cfg.buttonIcon + ' ' + cfg.buttonText;

      var win = document.getElementById('gpt-win');
      var msgsDiv = document.getElementById('gpt-msgs');
      var input = document.getElementById('gpt-input');
      var sendBtn = document.getElementById('gpt-send-btn');

      function saveHistory() {
        try {
          localStorage.setItem(storageKey, JSON.stringify(messages));
        } catch (e) {
          console.error('Failed to save history', e);
        }
      }

      function loadHistory() {
        try {
          var saved = localStorage.getItem(storageKey);
          if (saved) {
            var history = JSON.parse(saved);
            history.forEach(function(m) {
              if (m.type === 'result') {
                addResults(m.data, true);
              } else {
                renderMsg(m.text, m.isUser, true);
              }
            });
          }
        } catch (e) {
          console.error('Failed to load history', e);
        }
      }

      function renderMsg(text, isUser, skipSave) {
        var msg = document.createElement('div');
        msg.className = 'gpt-msg ' + (isUser ? 'user' : 'bot');
        msg.textContent = text;
        msgsDiv.appendChild(msg);
        if (cfg.showTimestamp) {
          var time = document.createElement('div');
          time.className = 'gpt-time';
          time.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          msgsDiv.appendChild(time);
        }
        msgsDiv.scrollTop = msgsDiv.scrollHeight;
      }

      function addMsg(text, isUser) {
        renderMsg(text, isUser, false);
        messages.push({ text: text, isUser: isUser, time: new Date(), type: 'message' });
        saveHistory();
      }

      function showTyping() {
        var typing = document.createElement('div');
        typing.className = 'gpt-typing';
        typing.id = 'gpt-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        msgsDiv.appendChild(typing);
        msgsDiv.scrollTop = msgsDiv.scrollHeight;
      }

      function hideTyping() {
        var typing = document.getElementById('gpt-typing');
        if (typing) typing.remove();
      }

      async function sendMsg() {
        var text = input.value.trim();
        if (!text) return;

        addMsg(text, true);
        input.value = '';
        sendBtn.disabled = true;
        input.disabled = true;

        showTyping();

        try {
          var contextMessages = messages.filter(function(m) { return m.type === 'message'; }).slice(-cfg.contextLength).map(function(m) {
            return { role: m.isUser ? 'user' : 'assistant', content: m.text };
          });
          contextMessages.push({ role: 'user', content: text });

          var res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assistant_id: cfg.assistantId,
              message: text,
              chat_id: chatId,
              history: contextMessages
            })
          });

          var data = await res.json();
          hideTyping();

          if (data.response) {
            if (data.mode === 'json' && Array.isArray(data.response)) {
              addResults(data.response);
            } else {
              addMsg(data.response, false);
            }
          } else {
            addMsg('Извините, произошла ошибка. Попробуйте позже.', false);
          }
        } catch (e) {
          hideTyping();
          addMsg('Ошибка соединения. Проверьте интернет.', false);
        } finally {
          sendBtn.disabled = false;
          input.disabled = false;
          input.focus();
        }
      }

      function addResults(results, skipSave) {
        var container = document.createElement('div');
        container.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin:8px 0;width:100%';

        results.forEach(function(r) {
          var card = document.createElement('div');
          card.style.cssText = 'background:' + messageBg + ';border-radius:12px;padding:12px;cursor:pointer;transition:transform 0.2s;border:1px solid ' + borderColor;
          card.onmouseenter = function() { this.style.transform = 'translateY(-2px)'; };
          card.onmouseleave = function() { this.style.transform = 'translateY(0)'; };

          var photoUrls = [];
          if (r.photos && Array.isArray(r.photos)) {
            photoUrls = r.photos.map(function(p) { return typeof p === 'string' ? p : (p.url_1280 || p.url_640 || p.url_320 || ''); }).filter(Boolean);
          } else if (r.photo) {
            photoUrls = [r.photo];
          }

          var imgGallery = '';
          if (photoUrls.length > 0) {
            var sliderId = 'slider-' + r.id;
            imgGallery = '<div class="gpt-slider" id="' + sliderId + '" data-current="0" data-total="' + photoUrls.length + '">';
            imgGallery += '<div class="gpt-slider-track" id="' + sliderId + '-track">';
            for (var j = 0; j < photoUrls.length; j++) {
              imgGallery += '<div class="gpt-slider-slide"><img src="' + photoUrls[j] + '" alt="Фото ' + j + '"></div>';
            }
            imgGallery += '</div>';
            if (photoUrls.length > 1) {
              imgGallery += '<div class="gpt-slider-counter" id="' + sliderId + '-counter">1/' + photoUrls.length + '</div>';
            }
            imgGallery += '</div>';
          } else {
            imgGallery = '<div style="width:100%;height:150px;background:linear-gradient(135deg,' + cfg.primaryColor + '20,' + cfg.primaryColor + '40);border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:48px;">🏠</div>';
          }

          var price = r.price ? '<div style="font-size:18px;font-weight:700;color:' + cfg.primaryColor + ';margin:4px 0;">от ' + r.price + ' ₽/сутки</div>' : '';
          var addr = r.full_address ? '<div style="font-size:13px;color:' + textColor + ';opacity:0.7;margin:4px 0;">' + r.full_address + '</div>' : '';
          var cat = r.category ? '<div style="font-size:12px;color:' + textColor + ';opacity:0.6;margin:4px 0;">' + r.category + '</div>' : '';
          var btnText = r.price_total ? 'Забронировать за ' + r.price_total + ' ₽' : 'Забронировать';
          card.innerHTML = imgGallery + price + addr + cat + '<div class="booking-btn" data-url="' + (r.bookingUrl || 'https://qqrenta.ru/rooms/' + r.id) + '" style="margin-top:8px;padding:8px 16px;background:' + cfg.primaryColor + ';color:#fff;border-radius:8px;text-align:center;font-weight:600;cursor:pointer;">' + btnText + '</div>';

          if (photoUrls.length > 0) {
            var images = card.querySelectorAll('.gpt-slider-slide img');
            images.forEach(function(img) {
              var originalSrc = img.src;
              img.onerror = function() {
                console.log('[ERROR] Failed to load image for object ' + r.id + ':', this.src);
                this.style.display = 'none';
                this.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;font-size:32px;color:' + cfg.primaryColor + ';"><div>🏠</div><button class="retry-img-btn" data-src="' + originalSrc + '" style="padding:8px 16px;background:' + cfg.primaryColor + ';color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity 0.2s;">Обновить фото</button></div>';
                var retryBtn = this.parentElement.querySelector('.retry-img-btn');
                if (retryBtn) {
                  retryBtn.onclick = function(e) {
                    e.stopPropagation();
                    var src = this.getAttribute('data-src');
                    this.parentElement.parentElement.innerHTML = '<img src="' + src + '?retry=' + Date.now() + '" alt="Фото" style="width:100%;height:100%;object-fit:cover;">';
                    var newImg = this.parentElement.parentElement.querySelector('img');
                    newImg.onerror = function() {
                      this.style.display = 'none';
                      this.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center;font-size:24px;color:#999;"><div>🏠</div><div style="font-size:12px;">Фото недоступно</div></div>';
                    };
                  };
                }
              };
            });
          }

          card.onclick = function(e) {
            if (e.target.classList.contains('booking-btn')) {
              e.stopPropagation();
              window.open(e.target.getAttribute('data-url'), '_blank');
            }
          };

          if (photoUrls.length > 1) {
            var sliderEl = card.querySelector('.gpt-slider');
            if (sliderEl) {
              sliderEl.onclick = function(e) {
                if (e.target.classList.contains('retry-img-btn')) {
                  return;
                }
                e.stopPropagation();
                var current = parseInt(this.getAttribute('data-current') || '0');
                var total = parseInt(this.getAttribute('data-total') || '1');
                var next = (current + 1) % total;
                this.setAttribute('data-current', next);
                var track = this.querySelector('.gpt-slider-track');
                track.style.transform = 'translateX(-' + (next * 100) + '%)';
                var counter = this.querySelector('.gpt-slider-counter');
                if (counter) counter.textContent = (next + 1) + '/' + total;
              };
            }
          }

          container.appendChild(card);
        });
        msgsDiv.appendChild(container);
        msgsDiv.scrollTop = msgsDiv.scrollHeight;
        if (!skipSave) {
          messages.push({ type: 'result', data: results, time: new Date() });
          saveHistory();
        }
      }

      function openChat() {
        if (overlay) {
          overlay.style.display = 'block';
          setTimeout(function() { overlay.classList.add('open'); }, 10);
        }
        win.style.display = isModal ? 'flex' : 'flex';
        setTimeout(function() { win.classList.add('open'); }, 10);
        input.focus();
      }

      function closeChat() {
        if (overlay) {
          overlay.classList.remove('open');
          setTimeout(function() { overlay.style.display = 'none'; }, 300);
        }
        win.classList.remove('open');
        setTimeout(function() { win.style.display = 'none'; }, 300);
      }

      document.getElementById('gpt-open-btn').onclick = openChat;
      document.getElementById('gpt-close-btn').onclick = closeChat;
      if (overlay) overlay.onclick = closeChat;
      sendBtn.onclick = sendMsg;
      input.onkeypress = function(e) { if (e.key === 'Enter') sendMsg(); };

      loadHistory();
      if (messages.length === 0 && msgsDiv.children.length === 0) {
        addMsg(cfg.welcomeMessage, false);
      }
      if (cfg.autoOpen) {
        setTimeout(openChat, cfg.autoOpenDelay);
      }
    }).catch(function(err) {
      console.error('Failed to load chat config:', err);
    });
  };
})(window);
