const fs = require('fs');
const path = require('path');

// 1. Patch MessagesPage.jsx
const adminMessagesPath = path.join(__dirname, '..', 'src', 'dashboard', 'admin', 'MessagesPage.jsx');
if (fs.existsSync(adminMessagesPath)) {
  let code = fs.readFileSync(adminMessagesPath, 'utf8');

  // Add form onPaste and hidden file input
  if (!code.includes('onPaste={handlePaste}')) {
    code = code.replace(
      /<form onSubmit={handleSend} className="flex items-center gap-2 relative z-10">/,
      `<form onSubmit={handleSend} onPaste={handlePaste} className="flex items-center gap-2 relative z-10">
                   <input
                     type="file"
                     ref={fileInputRef}
                     onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                     className="hidden"
                     accept="*/*"
                   />`
    );
  }

  // Add paperclip upload button before LinkIcon if not already present
  if (!code.includes('title="إرفاق ملف أو فيديو (حتى 1 جيجابايت)"')) {
    code = code.replace(
      /<LinkIcon size={15}/,
      `<button
                           type="button"
                           onClick={() => fileInputRef.current?.click()}
                           disabled={isUploading}
                           className="p-1 text-slate-400 hover:text-brand-500 hover:opacity-100 transition-all"
                           title="إرفاق ملف أو فيديو (حتى 1 جيجابايت)"
                         >
                           <Paperclip size={16} className={isUploading ? 'animate-spin text-brand-500' : ''} />
                         </button>
                         <LinkIcon size={15}`
    );
  }

  fs.writeFileSync(adminMessagesPath, code, 'utf8');
  console.log('[+] MessagesPage.jsx patched successfully!');
}

// 2. Patch ClientMessages.jsx
const clientMessagesPath = path.join(__dirname, '..', 'src', 'dashboard', 'client', 'ClientMessages.jsx');
if (fs.existsSync(clientMessagesPath)) {
  let code = fs.readFileSync(clientMessagesPath, 'utf8');

  // Add Copy, Paperclip, FileText, Download, ImageIcon, VideoIcon imports if missing
  if (!code.includes('Copy,')) {
    code = code.replace(
      /from 'lucide-react';/,
      `Copy, Paperclip, FileText, Download, Video as VideoIcon, Image as ImageIcon\n} from 'lucide-react';`
    );
  }

  // Add upload state & handlers to ClientMessages
  if (!code.includes('handleFileUpload')) {
    const stateHook = `const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file || !activeThread) return;
    if (file.size > 1024 * 1024 * 1024) {
      rToast.error("حجم الملف كبير جداً، الحد الأقصى 1 جيجابايت");
      return;
    }
    setIsUploading(true);
    const toastId = rToast.loading("جاري رفع الملف...");
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: up } = await axios.post(\`\${API_URL}/upload/file\`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: \`Bearer \${localStorage.getItem('token')}\`
        }
      });
      const fileUrl = up.url || up.fileUrl;
      const mime = file.type || '';
      let msgContent = \`[FILE]\${fileUrl}\\n\${file.name}\`;
      if (mime.startsWith('image/') || /\\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) {
        msgContent = \`[IMAGE]\${fileUrl}\`;
      } else if (mime.startsWith('video/') || /\\.(mp4|webm|mov|mkv)$/i.test(file.name)) {
        msgContent = \`[VIDEO]\${fileUrl}\`;
      }

      const { data } = await sendMessageAPI({
        content: msgContent,
        type: 'PRIVATE',
        receiverId: activeThread.userId
      });
      socket.emit('send_message', { ...data, type: 'PRIVATE', senderSocketId: socket.id });
      setMessages(p => [...p, { ...data, sender: user }]);
      rToast.update(toastId, { render: "تم إرسال الملف بنجاح", type: "success", isLoading: false, autoClose: 3000 });
    } catch(err) {
      rToast.update(toastId, { render: "فشل الرفع", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          rToast.info("جاري إرسال الصورة المنسوخة...");
          await handleFileUpload(file);
          return;
        }
      }
    }
  };
`;
    code = code.replace(/const activeThreadRef = useRef\(activeThread\);/, `const activeThreadRef = useRef(activeThread);\n  ${stateHook}`);
  }

  // Update renderMessage in ClientMessages for rich image/video/copy
  if (!code.includes('navigator.clipboard.writeText')) {
    code = code.replace(
      /<p className="whitespace-pre-wrap">\{cleanVal\}<\/p>/,
      `{cleanVal.startsWith('[IMAGE]') || /\\.(jpg|jpeg|png|webp|gif)(\\?.*)?$/i.test(cleanVal) ? (
                  <div className="space-y-1">
                    <img src={resolveVoiceUrl(cleanVal.replace('[IMAGE]', '').trim())} alt="Attachment" className="max-w-[260px] sm:max-w-xs max-h-[300px] object-cover rounded-xl cursor-pointer" onClick={() => window.open(resolveVoiceUrl(cleanVal.replace('[IMAGE]', '').trim()), '_blank')} />
                    <span className="text-[8px] opacity-60 block text-left">صورة مرفقة (48h retention)</span>
                  </div>
                ) : cleanVal.startsWith('[VIDEO]') || /\\.(mp4|webm|mov|mkv)(\\?.*)?$/i.test(cleanVal) ? (
                  <div className="space-y-1">
                    <video controls src={resolveVoiceUrl(cleanVal.replace('[VIDEO]', '').trim())} className="max-w-[260px] sm:max-w-sm rounded-xl max-h-[320px] bg-black" />
                    <span className="text-[8px] opacity-60 block text-left">فيديو مرفق (48h retention)</span>
                  </div>
                ) : cleanVal.startsWith('[FILE]') ? (
                  <a href={resolveVoiceUrl(cleanVal.split('\\n')[0].replace('[FILE]', '').trim())} target="_blank" rel="noreferrer" download className="flex items-center gap-2 p-2 bg-black/10 rounded-xl hover:bg-black/20 transition-all">
                    <FileText size={16} className="text-brand-400" />
                    <div className="overflow-hidden text-right">
                      <p className="text-xs font-bold truncate max-w-[150px]">{cleanVal.split('\\n')[1] || 'ملف مرفق'}</p>
                      <span className="text-[8px] opacity-60">اضغط للتحميل</span>
                    </div>
                  </a>
                ) : (
                  <p className="whitespace-pre-wrap select-text">{cleanVal}</p>
                )}`
    );
  }

  // Add Copy button in ClientMessages options
  if (!code.includes('title="نسخ الرسالة"')) {
    code = code.replace(
      /<button onClick=\{\(\) => setReplyingTo\(m\)\}/,
      `<button onClick={() => { navigator.clipboard.writeText(cleanVal); rToast.success("تم نسخ الرسالة"); }} className="p-1.5 rounded-full hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 transition-colors" title="نسخ الرسالة"><Copy size={12}/></button>\n              <button onClick={() => setReplyingTo(m)}`
    );
  }

  // Add onPaste and paperclip in ClientMessages input form
  if (!code.includes('onPaste={handlePaste}')) {
    code = code.replace(
      /<form onSubmit=\{handleSend\} className="flex items-center gap-2 relative z-10">/,
      `<form onSubmit={handleSend} onPaste={handlePaste} className="flex items-center gap-2 relative z-10">
                   <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" accept="*/*" />`
    );
    code = code.replace(
      /<LinkIcon size=\{15\}/,
      `<button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-1 text-slate-400 hover:text-brand-500 transition-all" title="إرفاق ملف"><Paperclip size={16} className={isUploading ? 'animate-spin text-brand-500' : ''} /></button>\n                         <LinkIcon size={15}`
    );
  }

  fs.writeFileSync(clientMessagesPath, code, 'utf8');
  console.log('[+] ClientMessages.jsx patched successfully!');
}
