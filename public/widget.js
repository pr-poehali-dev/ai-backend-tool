(function(window) {
  console.log('[Widget] Script loaded successfully');
  
  window.initChatWidget = function(chatId) {
    console.log('[Widget] Initializing chat widget with ID:', chatId);
    
    var apiUrl = 'https://functions.poehali.dev/eac81e19-553b-4100-981e-e0202e5cb64d';
    var configUrl = 'https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815?id=' + chatId;
    var messages = [];
    var storageKey = 'gpt-chat-history-' + chatId;
    var cfg = null;
    var isModal = false;
    var chatName = 'Чат';
    var assistantId = '';

    var defaultCfg = {
      position: 'bottom-right',
      theme: 'light',
      primaryColor: '#3b82f6',
      borderRadius: 16,
      width: 400,
      height: 600,
      buttonIcon: '💬',
      buttonText: 'Чат',
      placeholder: 'Напишите сообщение...',
      showTimestamp: true
    };

    function initWidget(config) {
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
      css.textContent = '.gpt-widget{position:fixed;' + positionStyle + 'z-index:999999!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
        '.gpt-btn{cursor:pointer;padding:14px 24px;border-radius:' + cfg.borderRadius + 'px;background:' + cfg.primaryColor + ';color:#fff;border:none;font-size:15px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px;transition:all 0.2s}' +
        '.gpt-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.2)}' +
        '.gpt-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0);z-index:999998!important;backdrop-filter:blur(0px);transition:background 0.3s ease,backdrop-filter 0.3s ease}' +
        '.gpt-overlay.open{display:block;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px)}' +
        '.gpt-window{display:none;width:' + cfg.width + 'px;height:' + cfg.height + 'px;background:' + bgColor + ';border-radius:' + cfg.borderRadius + 'px;box-shadow:0 8px 32px rgba(0,0,0,0.2);flex-direction:column;overflow:hidden;opacity:0;transform:scale(0.95);transition:opacity 0.3s ease,transform 0.3s ease}' +
        '.gpt-window.modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.95);z-index:999999!important}' +
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

      function sendMsg() {
        var text = input.value.trim();
        if (!text) return;
        
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;
        
        addMsg(text, true);
        showTyping();

        var history = messages.map(function(m) {
          return { role: m.isUser ? 'user' : 'assistant', content: m.text };
        });
        
        var requestData = { 
          message: text, 
          chatId: chatId,
          assistant_id: assistantId,
          history: history
        };
        
        console.log('[Widget] Sending request:', requestData);
        
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          console.log('[Widget] Backend response:', data);
          console.log('[Widget] Response type:', typeof data.response);
          console.log('[Widget] Is array?', Array.isArray(data.response));
          if (data.response && data.response[0]) {
            console.log('[Widget] First item type:', typeof data.response[0]);
            console.log('[Widget] First item:', data.response[0]);
          }
          hideTyping();
          input.disabled = false;
          sendBtn.disabled = false;
          input.focus();
          
          if (data.type === 'text') {
            addMsg(data.message, false);
          } else if (data.type === 'results') {
            addResults(data.results, false);
          } else if (data.mode === 'json' && data.response) {
            addResults(data.response, false);
          } else if (data.mode === 'text' && data.response) {
            addMsg(data.response, false);
          } else {
            console.warn('[Widget] Unknown response type:', data);
            addMsg('Получен неожиданный формат ответа', false);
          }
        })
        .catch(function(err) {
          hideTyping();
          input.disabled = false;
          sendBtn.disabled = false;
          addMsg('Ошибка при отправке сообщения', false);
          console.error(err);
        });
      }

      function addResults(results, skipSave) {
        if (Array.isArray(results)) {
          results.forEach(function(item) {
            addSingleResult(item);
          });
        } else {
          addSingleResult(results);
        }

        if (!skipSave) {
          messages.push({ data: results, time: new Date(), type: 'result' });
          saveHistory();
        }
      }

      function addSingleResult(result) {
        var container = document.createElement('div');
        container.className = 'gpt-msg bot';
        container.style.maxWidth = '90%';
        container.style.padding = '12px';

        var photos = result.photos || [];
        var photoUrls = photos.map(function(p) { return p.sm || p; });

        if (photoUrls.length > 0) {
          var slider = document.createElement('div');
          slider.className = 'gpt-slider';
          var track = document.createElement('div');
          track.className = 'gpt-slider-track';
          var currentSlide = 0;

          photoUrls.forEach(function(url, idx) {
            var slide = document.createElement('div');
            slide.className = 'gpt-slider-slide';
            var img = document.createElement('img');
            img.src = url;
            img.alt = 'Фото ' + (idx + 1);
            slide.appendChild(img);
            track.appendChild(slide);
          });

          var counter = document.createElement('div');
          counter.className = 'gpt-slider-counter';
          counter.textContent = '1 / ' + photoUrls.length;

          slider.appendChild(track);
          slider.appendChild(counter);
          container.appendChild(slider);

          slider.addEventListener('click', function() {
            currentSlide = (currentSlide + 1) % photoUrls.length;
            track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
            counter.textContent = (currentSlide + 1) + ' / ' + photoUrls.length;
          });
        }

        var content = document.createElement('div');
        content.style.marginTop = '8px';

        if (result.title) {
          var title = document.createElement('div');
          title.style.fontWeight = '600';
          title.style.fontSize = '14px';
          title.style.marginBottom = '4px';
          title.textContent = result.title;
          content.appendChild(title);
        }

        if (result.full_address) {
          var address = document.createElement('div');
          address.style.fontSize = '12px';
          address.style.color = '#666';
          address.style.marginBottom = '8px';
          address.textContent = result.full_address;
          content.appendChild(address);
        }

        var info = document.createElement('div');
        info.style.fontSize = '12px';
        info.style.marginBottom = '8px';
        var infoParts = [];
        if (result.guests) infoParts.push('👥 ' + result.guests + ' гостей');
        if (result.bedrooms) infoParts.push('🛏️ ' + result.bedrooms + ' спальни');
        if (result.beds) infoParts.push('🛌 ' + result.beds + ' кровати');
        if (infoParts.length > 0) {
          info.textContent = infoParts.join(' • ');
          content.appendChild(info);
        }

        if (result.price_total || result.price) {
          var price = document.createElement('div');
          price.style.fontSize = '16px';
          price.style.fontWeight = '700';
          price.style.color = cfg.primaryColor;
          price.style.marginBottom = '8px';
          price.textContent = (result.price_total || result.price) + ' ₽ за весь период';
          content.appendChild(price);
        }

        if (result.bookingUrl) {
          var btn = document.createElement('a');
          btn.href = result.bookingUrl;
          btn.target = '_blank';
          btn.style.display = 'inline-block';
          btn.style.padding = '8px 16px';
          btn.style.backgroundColor = cfg.primaryColor;
          btn.style.color = '#fff';
          btn.style.borderRadius = '6px';
          btn.style.textDecoration = 'none';
          btn.style.fontSize = '13px';
          btn.style.fontWeight = '600';
          btn.textContent = 'Забронировать';
          content.appendChild(btn);
        }

        if (result.message) {
          var text = document.createElement('div');
          text.style.marginTop = '8px';
          text.style.fontSize = '13px';
          text.textContent = result.message;
          content.appendChild(text);
        }

        container.appendChild(content);
        msgsDiv.appendChild(container);

        if (cfg.showTimestamp) {
          var time = document.createElement('div');
          time.className = 'gpt-time';
          time.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          msgsDiv.appendChild(time);
        }

        msgsDiv.scrollTop = msgsDiv.scrollHeight;
      }

      function openChat() {
        win.classList.add('open');
        if (isModal && overlay) {
          overlay.classList.add('open');
        }
        input.focus();
      }

      function closeChat() {
        win.classList.remove('open');
        if (isModal && overlay) {
          overlay.classList.remove('open');
        }
      }

      document.getElementById('gpt-open-btn').addEventListener('click', openChat);
      document.getElementById('gpt-close-btn').addEventListener('click', closeChat);
      if (overlay) {
        overlay.addEventListener('click', closeChat);
      }

      sendBtn.addEventListener('click', sendMsg);
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !input.disabled) sendMsg();
      });

      loadHistory();
    }

    fetch(configUrl)
      .then(function(r) { return r.json(); })
      .then(function(config) {
        console.log('[Widget] Chat config loaded:', config);
        
        var finalCfg = Object.assign({}, defaultCfg);
        if (config.position) finalCfg.position = config.position;
        if (config.theme) finalCfg.theme = config.theme;
        if (config.primaryColor) finalCfg.primaryColor = config.primaryColor;
        if (config.borderRadius) finalCfg.borderRadius = config.borderRadius;
        if (config.width) finalCfg.width = config.width;
        if (config.height) finalCfg.height = config.height;
        if (config.buttonIcon) finalCfg.buttonIcon = config.buttonIcon;
        if (config.buttonText) finalCfg.buttonText = config.buttonText;
        if (config.placeholder) finalCfg.placeholder = config.placeholder;
        if (config.showTimestamp !== undefined) finalCfg.showTimestamp = config.showTimestamp;
        if (config.assistantId) {
          assistantId = config.assistantId;
          console.log('[Widget] Assistant ID loaded:', assistantId);
        } else {
          console.warn('[Widget] No assistantId in config!');
        }
        
        console.log('[Widget] Final config:', finalCfg);
        initWidget(finalCfg);
        console.log('[Widget] Widget initialized successfully');
      })
      .catch(function(err) {
        console.error('[Widget] Failed to load chat config, using defaults:', err);
        initWidget(defaultCfg);
      });
  };
  
  console.log('[Widget] initChatWidget function created');
})(window);