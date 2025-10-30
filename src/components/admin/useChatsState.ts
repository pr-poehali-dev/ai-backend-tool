import { useState } from 'react';
import { toast } from 'sonner';

export interface Chat {
  id: string;
  name: string;
  config: ChatConfig;
  code: string;
  created_at: string;
}

export interface ChatConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-modal';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  assistantId: string;
  welcomeMessage: string;
  placeholder: string;
  buttonText: string;
  buttonIcon: string;
  width: number;
  height: number;
  borderRadius: number;
  showAvatar: boolean;
  avatarUrl?: string;
  showTimestamp: boolean;
  autoOpen: boolean;
  autoOpenDelay: number;
}

export const useChatsState = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [editChatOpen, setEditChatOpen] = useState(false);
  const [deleteChatOpen, setDeleteChatOpen] = useState(false);
  const [previewChatOpen, setPreviewChatOpen] = useState(false);
  const [chatToEdit, setChatToEdit] = useState<Chat | null>(null);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [chatToPreview, setChatToPreview] = useState<Chat | null>(null);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815');
      if (!response.ok) throw new Error('Failed to load chats');
      const data = await response.json();
      
      const updatedChats = data.map((chat: Chat) => ({
        ...chat,
        code: generateEmbedCode(chat.id, chat.config)
      }));
      
      setChats(updatedChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
      toast.error('Не удалось загрузить чаты');
    } finally {
      setIsLoading(false);
    }
  };

  const saveChats = (newChats: Chat[]) => {
    setChats(newChats);
  };

  const generateEmbedCode = (chatId: string, config: ChatConfig): string => {
    const isModal = config.position === 'center-modal';
    const positionStyles: Record<string, string> = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
      'center-modal': 'bottom: 20px; right: 20px;',
    };
    
    const position = config.position || 'bottom-right';
    const positionStyle = positionStyles[position];
    const isDark = config.theme === 'dark';
    const bgColor = isDark ? '#1a1a1a' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';
    const messageBg = isDark ? '#2a2a2a' : '#f0f0f0';
    const borderColor = isDark ? '#333333' : '#e0e0e0';
    
    return `<script charset="utf-8">
(function(){
var cfg=${JSON.stringify(config).replace(/[\u007F-\uFFFF]/g, chr => '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4))};
var chatId='${chatId}';
var apiUrl='https://functions.poehali.dev/eac81e19-553b-4100-981e-e0202e5cb64d';
var messages=[];
var isModal=${isModal};
var storageKey='gpt-chat-history-'+chatId;

var css=document.createElement('style');
css.textContent=\`
.gpt-widget{position:fixed;${positionStyle}z-index:9999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.gpt-btn{cursor:pointer;padding:14px 24px;border-radius:${config.borderRadius}px;background:${config.primaryColor};color:#fff;border:none;font-size:15px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px;transition:all 0.2s}
.gpt-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.2)}
.gpt-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0);z-index:9998;backdrop-filter:blur(0px);transition:background 0.3s ease,backdrop-filter 0.3s ease}
.gpt-overlay.open{display:block;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px)}
.gpt-window{display:none;width:${config.width}px;height:${config.height}px;background:${bgColor};border-radius:${config.borderRadius}px;box-shadow:0 8px 32px rgba(0,0,0,0.2);flex-direction:column;overflow:hidden;opacity:0;transform:scale(0.95);transition:opacity 0.3s ease,transform 0.3s ease}
.gpt-window.modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.95);z-index:9999}
.gpt-window.modal.open{transform:translate(-50%,-50%) scale(1);opacity:1}
.gpt-window.open{display:flex;opacity:1;transform:scale(1)}
.gpt-header{padding:16px 20px;background:${config.primaryColor};color:#fff;font-weight:600;display:flex;justify-content:space-between;align-items:center;font-size:16px}
.gpt-close{cursor:pointer;background:rgba(255,255,255,0.2);border:none;color:#fff;font-size:24px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background 0.2s}
.gpt-close:hover{background:rgba(255,255,255,0.3)}
.gpt-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.gpt-messages::-webkit-scrollbar{width:6px}
.gpt-messages::-webkit-scrollbar-thumb{background:${borderColor};border-radius:3px}
.gpt-input-area{padding:16px;border-top:1px solid ${borderColor};display:flex;gap:8px}
.gpt-input{flex:1;padding:12px 16px;border:1px solid ${borderColor};border-radius:12px;font-size:14px;background:${messageBg};color:${textColor};outline:none}
.gpt-input:focus{border-color:${config.primaryColor}}
.gpt-send{padding:12px 20px;background:${config.primaryColor};color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:600;transition:opacity 0.2s}
.gpt-send:hover{opacity:0.9}
.gpt-send:disabled{opacity:0.5;cursor:not-allowed}
.gpt-msg{max-width:75%;padding:10px 16px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word}
.gpt-msg.user{background:${config.primaryColor};color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.gpt-msg.bot{background:${messageBg};color:${textColor};align-self:flex-start;border-bottom-left-radius:4px}
.gpt-time{font-size:11px;color:${isDark ? '#888' : '#666'};margin-top:4px;padding:0 4px}
.gpt-typing{display:flex;gap:4px;padding:10px 16px;background:${messageBg};border-radius:16px;width:fit-content}
.gpt-typing span{width:8px;height:8px;background:${isDark ? '#666' : '#999'};border-radius:50%;animation:typing 1.4s infinite}
.gpt-typing span:nth-child(2){animation-delay:0.2s}
.gpt-typing span:nth-child(3){animation-delay:0.4s}
@keyframes typing{0%,60%,100%{opacity:0.3}30%{opacity:1}}
\`;
document.head.appendChild(css);

var overlay=null;
if(isModal){
  overlay=document.createElement('div');
  overlay.className='gpt-overlay';
  overlay.id='gpt-overlay';
  document.body.appendChild(overlay);
}

var html='<div class="gpt-window'+(isModal?' modal':'')+'" id="gpt-win">'
+'<div class="gpt-header"><span id="gpt-header-text"></span><button class="gpt-close" id="gpt-close-btn">×</button></div>'
+'<div class="gpt-messages" id="gpt-msgs"></div>'
+'<div class="gpt-input-area"><input type="text" class="gpt-input" id="gpt-input" placeholder="'+cfg.placeholder+'"/><button class="gpt-send" id="gpt-send-btn">Отправить</button></div>'
+'</div>'
+'<button class="gpt-btn" id="gpt-open-btn"><span id="gpt-btn-text"></span></button>';

var container=document.createElement('div');
container.className='gpt-widget';
container.innerHTML=html;
document.body.appendChild(container);

document.getElementById('gpt-header-text').textContent=cfg.buttonIcon+' '+cfg.buttonText;
document.getElementById('gpt-btn-text').textContent=cfg.buttonIcon+' '+cfg.buttonText;

var win=document.getElementById('gpt-win');
var msgsDiv=document.getElementById('gpt-msgs');
var input=document.getElementById('gpt-input');
var sendBtn=document.getElementById('gpt-send-btn');

function saveHistory(){
  try{
    localStorage.setItem(storageKey,JSON.stringify(messages));
  }catch(e){console.error('Failed to save history',e);}
}

function loadHistory(){
  try{
    var saved=localStorage.getItem(storageKey);
    if(saved){
      var history=JSON.parse(saved);
      history.forEach(function(m){
        if(m.type==='result'){
          addResults(m.data,true);
        }else{
          renderMsg(m.text,m.isUser,true);
        }
      });
    }
  }catch(e){console.error('Failed to load history',e);}
}

function renderMsg(text,isUser,skipSave){
  var msg=document.createElement('div');
  msg.className='gpt-msg '+(isUser?'user':'bot');
  msg.textContent=text;
  msgsDiv.appendChild(msg);
  if(cfg.showTimestamp){
    var time=document.createElement('div');
    time.className='gpt-time';
    time.textContent=new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
    msgsDiv.appendChild(time);
  }
  msgsDiv.scrollTop=msgsDiv.scrollHeight;
}

function addMsg(text,isUser){
  renderMsg(text,isUser,false);
  messages.push({text:text,isUser:isUser,time:new Date(),type:'message'});
  saveHistory();
}

function showTyping(){
  var typing=document.createElement('div');
  typing.className='gpt-typing';
  typing.id='gpt-typing';
  typing.innerHTML='<span></span><span></span><span></span>';
  msgsDiv.appendChild(typing);
  msgsDiv.scrollTop=msgsDiv.scrollHeight;
}

function hideTyping(){
  var typing=document.getElementById('gpt-typing');
  if(typing)typing.remove();
}

async function sendMsg(){
  var text=input.value.trim();
  if(!text)return;
  
  addMsg(text,true);
  input.value='';
  sendBtn.disabled=true;
  input.disabled=true;
  
  showTyping();
  
  try{
    var res=await fetch(apiUrl,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        assistant_id:cfg.assistantId,
        message:text,
        chat_id:chatId
      })
    });
    
    var data=await res.json();
    hideTyping();
    
    if(data.response){
      if(data.mode==='json'&&Array.isArray(data.response)){
        addResults(data.response);
      }else{
        addMsg(data.response,false);
      }
    }else{
      addMsg('Извините, произошла ошибка. Попробуйте позже.',false);
    }
  }catch(e){
    hideTyping();
    addMsg('Ошибка соединения. Проверьте интернет.',false);
  }finally{
    sendBtn.disabled=false;
    input.disabled=false;
    input.focus();
  }
}

var messageBg='${messageBg}';
var borderColor='${borderColor}';
var textColor='${textColor}';

function addResults(results,skipSave){
  if(!results||results.length===0){
    addMsg('К сожалению, ничего не найдено. Попробуйте изменить параметры поиска.',false);
    return;
  }
  console.log('[DEBUG] addResults called with',results.length,'items');
  console.log('[DEBUG] First result:',results[0]);
  var container=document.createElement('div');
  container.style.cssText='display:flex;flex-direction:column;gap:12px;max-width:100%;';
  results.forEach(function(r){
    var card=document.createElement('div');
    card.style.cssText='background:'+messageBg+';border:1px solid '+borderColor+';border-radius:12px;padding:12px;transition:all 0.2s;';
    card.onmouseover=function(){this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';};
    card.onmouseout=function(){this.style.transform='none';this.style.boxShadow='none';};
    
    var photos=r.photos&&r.photos.length>0?r.photos:(r.photo?[r.photo]:[]);
    console.log('[DEBUG] Photos for result',r.id,':',photos);
    var imgGallery='';
    
    if(photos.length>0){
      imgGallery='<div style="width:100%;height:150px;border-radius:8px;margin-bottom:8px;overflow:hidden;">';
      imgGallery+='<img src="'+photos[0]+'" alt="Фото объекта" style="width:100%;height:100%;object-fit:cover;">';
      imgGallery+='</div>';
    }else{
      imgGallery='<div style="width:100%;height:150px;background:linear-gradient(135deg,'+cfg.primaryColor+'20,'+cfg.primaryColor+'40);border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:48px;">🏠</div>';
    }
    
    var price=r.price?'<div style="font-size:18px;font-weight:700;color:'+cfg.primaryColor+';margin:4px 0;">'+r.price+' ₽/сутки</div>':'';
    var addr=r.full_address?'<div style="font-size:13px;color:'+textColor+';opacity:0.7;margin:4px 0;">'+r.full_address+'</div>':'';
    var cat=r.category?'<div style="font-size:12px;color:'+textColor+';opacity:0.6;margin:4px 0;">'+r.category+'</div>':'';
    var btnText=r.price_total?'Забронировать за '+r.price_total+' ₽':'Забронировать';
    var btnId='btn-'+r.id;
    card.innerHTML=imgGallery+price+addr+cat+'<div class="booking-btn" data-url="'+(r.bookingUrl||'https://qqrenta.ru/rooms/'+r.id)+'" style="margin-top:8px;padding:8px 16px;background:'+cfg.primaryColor+';color:#fff;border-radius:8px;text-align:center;font-weight:600;cursor:pointer;">'+btnText+'</div>';
    
    card.onclick=function(e){
      if(e.target.classList.contains('booking-btn')){
        e.stopPropagation();
        window.open(e.target.getAttribute('data-url'),'_blank');
      }
    };
    
    container.appendChild(card);
  });
  msgsDiv.appendChild(container);
  msgsDiv.scrollTop=msgsDiv.scrollHeight;
  if(!skipSave){
    messages.push({type:'result',data:results,time:new Date()});
    saveHistory();
  }
}

function openChat(){
  if(overlay){
    overlay.style.display='block';
    setTimeout(function(){overlay.classList.add('open')},10);
  }
  win.style.display='flex';
  setTimeout(function(){
    win.classList.add('open');
    input.focus();
  },10);
}

function closeChat(){
  win.classList.remove('open');
  if(overlay)overlay.classList.remove('open');
  setTimeout(function(){
    win.style.display='none';
    if(overlay)overlay.style.display='none';
  },300);
}

document.getElementById('gpt-open-btn').onclick=openChat;
document.getElementById('gpt-close-btn').onclick=closeChat;
if(overlay)overlay.onclick=closeChat;
sendBtn.onclick=sendMsg;
input.onkeypress=function(e){if(e.key==='Enter')sendMsg()};

loadHistory();
if(messages.length===0){
  addMsg(cfg.welcomeMessage,false);
}
${config.autoOpen ? `setTimeout(openChat,${config.autoOpenDelay})` : ''};
})();
</script>`;
  };

  const createChat = async (name: string, config: ChatConfig) => {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const code = generateEmbedCode(chatId, config);
    
    const newChat = {
      id: chatId,
      name,
      config,
      code,
    };
    
    try {
      const response = await fetch('https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChat),
      });
      
      if (!response.ok) throw new Error('Failed to create chat');
      const data = await response.json();
      
      await loadChats();
      toast.success('Чат создан успешно!');
      return data;
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Не удалось создать чат');
      throw error;
    }
  };

  const updateChat = async (id: string, name: string, config: ChatConfig) => {
    const code = generateEmbedCode(id, config);
    
    const updatedChat = {
      id,
      name,
      config,
      code,
    };
    
    try {
      const response = await fetch('https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedChat),
      });
      
      if (!response.ok) throw new Error('Failed to update chat');
      const data = await response.json();
      
      await loadChats();
      toast.success('Чат обновлён успешно!');
      return data;
    } catch (error) {
      console.error('Failed to update chat:', error);
      toast.error('Не удалось обновить чат');
      throw error;
    }
  };

  const deleteChat = async (id: string) => {
    try {
      const response = await fetch('https://functions.poehali.dev/533d0cc9-ea8a-4dc2-94a2-6f0b0850b815', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) throw new Error('Failed to delete chat');
      
      await loadChats();
      toast.success('Чат удалён');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Не удалось удалить чат');
      throw error;
    }
  };

  return {
    chats,
    isLoading,
    loadChats,
    createChat,
    updateChat,
    deleteChat,
    createChatOpen,
    setCreateChatOpen,
    editChatOpen,
    setEditChatOpen,
    deleteChatOpen,
    setDeleteChatOpen,
    previewChatOpen,
    setPreviewChatOpen,
    chatToEdit,
    setChatToEdit,
    chatToDelete,
    setChatToDelete,
    chatToPreview,
    setChatToPreview,
  };
};