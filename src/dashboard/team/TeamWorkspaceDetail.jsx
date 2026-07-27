import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { 
  getWorkspaceAPI, 
  getPhaseTasksAPI, 
  updateWorkspaceTaskAPI,
  getMessagesAPI,
  sendMessageAPI
} from '../../store/api';
import { useSocket } from '../../context/SocketContext';
import { 
  X, Loader2, CheckCircle2, Clock, Activity, 
  AlertCircle, ChevronRight, Send, ExternalLink, MessageSquare,
  Film, FileCode, Image as ImageIcon, Calendar, Link as LinkIcon,
  Save, Eye, EyeOff, ChevronDown, Download, Edit3, Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

// ─── Role → Stage Permission Map ─────────────────────────────────────────────
const getEditableStage = (position) => {
  if (!position) return null;
  const p = String(position).toLowerCase().trim();
  if (p.includes('script') || p.includes('كاتب') || p.includes('سكريبت')) return 'script';
  if (p.includes('edit') || p.includes('مونت') || p.includes('فيديو')) return 'edit';
  if (p.includes('design') || p.includes('thumb') || p.includes('مصمم') || p.includes('جرافيك')) return 'thumbnail';
  if (p.includes('manager') || p.includes('مدير') || p.includes('strategist') || p.includes('استراتيجي')) return 'publish';
  return null;
};

// ─── Stage Definitions ────────────────────────────────────────────────────────
const STAGES = [
  {
    key: 'script',
    label: 'مرحلة السكريبت',
    labelEn: 'Scriptwriting',
    icon: FileCode,
    color: 'blue',
    inputLabel: 'رابط Google Docs',
    inputType: 'url',
    placeholder: 'https://docs.google.com/...',
    fieldKey: 'link',
    allowedRole: 'Scriptwriter',
  },
  {
    key: 'edit',
    label: 'مرحلة المونتاج',
    labelEn: 'Video Editing',
    icon: Film,
    color: 'purple',
    inputLabel: 'رابط Google Drive',
    inputType: 'url',
    placeholder: 'https://drive.google.com/...',
    fieldKey: 'link',
    allowedRole: 'Video Editor',
  },
  {
    key: 'thumbnail',
    label: 'مرحلة الصور المصغرة',
    labelEn: 'Thumbnails',
    icon: ImageIcon,
    color: 'amber',
    inputLabel: 'رابط التصميم',
    inputType: 'url',
    placeholder: 'https://drive.google.com/...',
    fieldKey: 'link',
    allowedRole: 'Graphic Designer',
  },
  {
    key: 'publish',
    label: 'مرحلة مواعيد النشر',
    labelEn: 'Publishing Schedule',
    icon: Calendar,
    color: 'emerald',
    inputLabel: 'تاريخ النشر',
    inputType: 'datetime-local',
    placeholder: '',
    fieldKey: 'datetime',
    allowedRole: 'Manager',
  },
];

const STAGE_COLORS = {
  blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20', icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', badge: 'bg-blue-500 text-white' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20', icon: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', badge: 'bg-purple-500 text-white' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', badge: 'bg-amber-500 text-white' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500 text-white' },
};

// ─── parseVideoMeta ───────────────────────────────────────────────────────────
const parseVideoMeta = (description) => {
  const empty = {
    script:    { link: '', visible: false, approvalStatus: 'PENDING', clientNotes: '' },
    edit:      { link: '', visible: false, approvalStatus: 'PENDING', clientNotes: '' },
    thumbnail: { link: '', visible: false, approvalStatus: 'PENDING', clientNotes: '' },
    publish:   { datetime: '', visible: false, approvalStatus: 'PENDING', clientNotes: '' },
  };
  try {
    if (!description || description === 'null' || description === 'undefined') return empty;
    const parsed = JSON.parse(description);
    if (!parsed || typeof parsed !== 'object') return empty;
    return {
      script:    { link: '', visible: false, approvalStatus: 'PENDING', clientNotes: '', ...parsed.script },
      edit:      { link: '', visible: false, approvalStatus: 'PENDING', clientNotes: '', ...parsed.edit },
      thumbnail: { link: '', visible: false, approvalStatus: 'PENDING', clientNotes: '', ...parsed.thumbnail },
      publish:   { datetime: '', visible: false, approvalStatus: 'PENDING', clientNotes: '', ...parsed.publish },
    };
  } catch (_) { return empty; }
};

// ─── Team Stage Panel ─────────────────────────────────────────────────────────
const TeamStagePanel = ({ stage, meta, taskId, phaseId, userPosition, onMetaChange }) => {
  const c = STAGE_COLORS[stage.color];
  const Icon = stage.icon;
  const stageMeta = meta[stage.key] || {};
  const isVisible = !!stageMeta.visible;
  const value = stageMeta[stage.fieldKey] || '';
  const [localValue, setLocalValue] = useState(value);
  const [saving, setSaving] = useState(false);

  // This panel is editable ONLY if this stage's allowedRole matches user's position
  const myEditableStage = getEditableStage(userPosition);
  const canEdit = stage.key === myEditableStage;

  const approvalStatus = stageMeta.approvalStatus || 'PENDING';
  const clientNotes = stageMeta.clientNotes || '';

  useEffect(() => {
    setLocalValue(stageMeta[stage.fieldKey] || '');
  }, [stageMeta[stage.fieldKey]]);

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const newMeta = { ...meta, [stage.key]: { ...stageMeta, [stage.fieldKey]: localValue } };
      await updateWorkspaceTaskAPI(taskId, { description: JSON.stringify(newMeta) });
      onMetaChange(taskId, phaseId, newMeta);
      toast.success('تم رفع الرابط بنجاح ✓');
    } catch (_) {
      toast.error('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-all duration-300 ${c.bg} ${c.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
            <Icon size={16} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
              {stage.label}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stage.labelEn}</p>
          </div>
        </div>

        {/* Status badges row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Client Approval Status */}
          {approvalStatus === 'APPROVED' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 size={8} /> تم الاعتماد
            </span>
          )}
          {approvalStatus === 'REVISION_REQUESTED' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">
              <Edit3 size={8} /> مطلوب تعديل
            </span>
          )}

          {/* Visibility Status */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
            isVisible
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'
          }`}>
            {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
            {isVisible ? 'مرئي للعميل' : 'بانتظار الإدارة'}
          </div>
        </div>
      </div>

      {/* Client Revision Notes (always visible if REVISION_REQUESTED) */}
      {approvalStatus === 'REVISION_REQUESTED' && clientNotes && (
        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">⚠️ ملاحظات التعديل من العميل:</p>
          <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 leading-relaxed">{clientNotes}</p>
        </div>
      )}

      {/* Input — only editable if role matches this stage */}
      <div className="flex items-center gap-2">
        {stage.inputType === 'datetime-local' ? (
          <input
            type="datetime-local"
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canEdit}
            className={`flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        ) : (
          <div className="relative flex-1">
            {canEdit ? (
              <LinkIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
            ) : (
              <Lock size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
            )}
            <input
              type={stage.inputType}
              value={localValue}
              onChange={e => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={canEdit ? stage.placeholder : (value || 'مخصص لقسم آخر')}
              disabled={!canEdit}
              className={`w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:opacity-30 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
        )}

        {/* Save — only if this stage is mine */}
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={saving || localValue === (stageMeta[stage.fieldKey] || '')}
            className={`p-2.5 rounded-xl transition-all active:scale-95 border flex-shrink-0 ${
              localValue !== (stageMeta[stage.fieldKey] || '')
                ? `${c.badge} border-transparent shadow-md`
                : 'bg-white dark:bg-white/5 text-slate-300 border-slate-200 dark:border-white/10 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          </button>
        )}

        {/* External link opener */}
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white dark:bg-white/5 text-slate-400 hover:text-amber-500 border border-slate-200 dark:border-white/10 transition-all flex-shrink-0"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* My task badge */}
      {canEdit && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          مهمتي — أرفع الرابط هنا
        </div>
      )}
    </div>
  );
};

// ─── Team Video Card ──────────────────────────────────────────────────────────
const TeamVideoCard = ({ task, index, phaseId, userId, userPosition, onMetaChange }) => {
  const [expanded, setExpanded] = useState(true);
  const meta = parseVideoMeta(task.description);
  const isAssignedToMe = task.assignedTo?.user?.id === userId;

  // Check if any stage has client revision request
  const hasRevisionRequest = ['script', 'edit', 'thumbnail', 'publish'].some(k => meta[k]?.approvalStatus === 'REVISION_REQUESTED');

  return (
    <div className={`bg-white dark:bg-[#0a0a0c]/80 border rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
      hasRevisionRequest ? 'border-rose-400/40 dark:border-rose-500/30' :
      isAssignedToMe ? 'border-amber-500/30 dark:border-amber-500/20' : 'border-slate-100 dark:border-white/5'
    }`}>
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-lg ${
          hasRevisionRequest ? 'bg-rose-500 text-white shadow-rose-500/30' :
          isAssignedToMe ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-slate-700 text-white shadow-slate-900/20'
        }`}>
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black text-slate-800 dark:text-white text-sm truncate">{task.title}</p>
            {isAssignedToMe && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[7px] font-black rounded-full uppercase tracking-widest flex-shrink-0">
                تاسكي
              </span>
            )}
            {hasRevisionRequest && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[7px] font-black rounded-full uppercase tracking-widest flex-shrink-0 animate-pulse">
                ⚠️ تعديل مطلوب
              </span>
            )}
          </div>
          {task.deadline && (
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1 ${
              new Date().toDateString() === new Date(task.deadline).toDateString()
                ? 'text-rose-500 animate-pulse' : 'text-slate-400'
            }`}>
              <Clock size={10} />
              {new Date(task.deadline).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
              {new Date().toDateString() === new Date(task.deadline).toDateString() && ' — اليوم!'}
            </p>
          )}
        </div>

        {/* Stage dots */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {STAGES.map(s => {
            const stMeta = meta[s.key] || {};
            const isVis = !!stMeta.visible;
            const approval = stMeta.approvalStatus;
            const dotColor = !isVis ? 'bg-slate-200 dark:bg-white/10' :
              approval === 'APPROVED' ? 'bg-emerald-500' :
              approval === 'REVISION_REQUESTED' ? 'bg-rose-500' : 'bg-amber-400';
            return <div key={s.key} title={`${s.label}: ${isVis ? (approval || 'بانتظار') : 'مخفي'}`}
              className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />;
          })}
        </div>

        <ChevronDown
          size={18}
          className={`text-slate-300 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Stage Panels */}
      {expanded && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
          {STAGES.map(stage => (
            <TeamStagePanel
              key={stage.key}
              stage={stage}
              meta={meta}
              taskId={task.id}
              phaseId={phaseId}
              userPosition={userPosition}
              onMetaChange={onMetaChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TeamWorkspaceDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Get user's job position for role-based stage permissions
  const userPosition = user?.teamMemberInfo?.position || user?.position || '';

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhaseId, setActivePhaseId] = useState(null);
  const [phaseTasks, setPhaseTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});

  // Mini-chat
  const [showMiniChat, setShowMiniChat] = useState(false);
  const [miniMessages, setMiniMessages] = useState([]);
  const [newMiniMsg, setNewMiniMsg] = useState('');
  const [isSendingMini, setIsSendingMini] = useState(false);
  const socket = useSocket();
  const miniChatRef = useRef(null);

  // ── Chat ──
  const fetchMiniMessages = useCallback(async () => {
    try {
      const { data } = await getMessagesAPI(id);
      setMiniMessages(data || []);
    } catch (_) {}
  }, [id]);

  useEffect(() => {
    if (showMiniChat) {
      fetchMiniMessages();
      if (socket) {
        socket.emit('join_rooms', { userId: user.id, projectIds: [id], role: user.role });
        const handleNewMsg = (msg) => {
          if (msg.threadId !== id) return;
          if (msg.senderSocketId === socket?.id) return;
          setMiniMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg].slice(-50);
          });
          setTimeout(() => { if (miniChatRef.current) miniChatRef.current.scrollTop = miniChatRef.current.scrollHeight; }, 100);
        };
        socket.on('receive_message', handleNewMsg);
        return () => socket.off('receive_message', handleNewMsg);
      }
    }
  }, [showMiniChat, id, socket, user, fetchMiniMessages]);

  const handleSendMini = async (e) => {
    if (e) e.preventDefault();
    if (!newMiniMsg.trim() || isSendingMini) return;
    setIsSendingMini(true);
    try {
      const { data } = await sendMessageAPI({ content: newMiniMsg, threadId: id, type: 'GROUP' });
      if (socket) socket.emit('send_message', { ...data, threadId: id, type: 'GROUP', senderSocketId: socket.id });
      setMiniMessages(prev => [...prev, { ...data, sender: user }]);
      setNewMiniMsg('');
      setTimeout(() => { if (miniChatRef.current) miniChatRef.current.scrollTop = miniChatRef.current.scrollHeight; }, 100);
    } catch (_) { toast.error('فشل إرسال الرسالة'); }
    finally { setIsSendingMini(false); }
  };

  // ── Data Loading ──
  const loadPhaseTasksFor = useCallback(async (phaseId) => {
    setLoadingTasks(prev => ({ ...prev, [phaseId]: true }));
    try {
      const res = await getPhaseTasksAPI(phaseId);
      setPhaseTasks(prev => ({ ...prev, [phaseId]: res.data?.data || res.data || [] }));
    } catch (_) { toast.error(t('failed_load_tasks')); }
    finally { setLoadingTasks(prev => ({ ...prev, [phaseId]: false })); }
  }, [t]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWorkspaceAPI(id);
      const data = res.data?.data || res.data;
      setWorkspace(data);
      if (data?.phases?.length > 0) {
        const sorted = [...data.phases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestId = sorted[0]?.id;
        setActivePhaseId(latestId);
        loadPhaseTasksFor(latestId);
      }
    } catch (_) { toast.error(t('loading')); }
    finally { setLoading(false); }
  }, [id, t, loadPhaseTasksFor]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectPhase = (phaseId) => {
    setActivePhaseId(phaseId);
    if (!phaseTasks[phaseId]) loadPhaseTasksFor(phaseId);
  };

  const handleMetaChange = (taskId, phaseId, newMeta) => {
    setPhaseTasks(prev => ({
      ...prev,
      [phaseId]: (prev[phaseId] || []).map(t =>
        t.id === taskId ? { ...t, description: JSON.stringify(newMeta) } : t
      )
    }));
  };

  // ── Render States ──
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-48">
      <Loader2 size={64} className="animate-spin text-amber-500 mb-8 opacity-20" />
      <p className="font-black tracking-[0.2em] uppercase text-[10px] text-slate-400 animate-pulse">
        {t('syncing_workspace')}
      </p>
    </div>
  );

  if (!workspace) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <AlertCircle size={48} className="text-rose-500 mb-8" />
      <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">
        {t('project_not_found', 'المشروع غير موجود')}
      </h2>
      <Link to="/team/projects" className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
        {t('back_to_projects', 'العودة للمشاريع')}
      </Link>
    </div>
  );

  const sortedPhases = [...(workspace.phases || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const activePhase = sortedPhases.find(p => p.id === activePhaseId);

  // Role permission info
  const myEditableStage = getEditableStage(userPosition);
  const myEditableStageDef = myEditableStage ? STAGES.find(s => s.key === myEditableStage) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-100 font-sans pb-20">

      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-[50] bg-white/90 dark:bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 h-16 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link to="/team/projects" className="p-2 sm:p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all text-slate-400 hover:text-amber-500 border border-slate-100 dark:border-white/10 shadow-sm flex-shrink-0">
              <ChevronRight className="rotate-180 size-5 sm:size-6" />
            </Link>
            <div className="min-w-0 overflow-hidden">
              <h1 className="text-sm sm:text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase leading-none truncate">
                {workspace.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-[#FFD700] text-[6px] sm:text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 flex-shrink-0">
                  SUPREME
                </div>
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                  {t('monitored_workspace', 'بوابة الموظف')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Role badge */}
            {myEditableStageDef && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <myEditableStageDef.icon size={14} className="text-amber-500" />
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{myEditableStageDef.label}</span>
              </div>
            )}
            {workspace.clientChannelLink && (
              <a href={workspace.clientChannelLink} target="_blank" rel="noopener noreferrer"
                className="p-3 sm:px-6 sm:py-4 bg-white dark:bg-white/5 text-slate-500 hover:text-amber-500 rounded-xl sm:rounded-[1.5rem] transition-all border border-slate-200 dark:border-white/10 shadow-sm active:scale-95 group">
                <Activity size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline ml-2">{t('channel_link', 'رابط القناة')}</span>
              </a>
            )}
            {workspace.driveUrl && (
              <a href={workspace.driveUrl} target="_blank" rel="noopener noreferrer"
                className="p-3 sm:px-6 sm:py-4 bg-white dark:bg-white/5 text-slate-500 hover:text-amber-600 rounded-xl sm:rounded-[1.5rem] transition-all border border-slate-200 dark:border-white/10 shadow-sm active:scale-95 group">
                <Download size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline ml-2">{t('drive_link_folder', 'ملفات الدرايف')}</span>
              </a>
            )}
            <div className="hidden sm:flex items-center gap-2 px-6 py-4 bg-amber-500/10 dark:bg-[#FFD700]/10 border border-amber-500/20 dark:border-[#FFD700]/30 rounded-2xl">
              <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-[#FFD700] animate-pulse" />
              <span className="text-[9px] font-black text-amber-600 dark:text-[#FFD700] uppercase tracking-widest">Live Engine</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-10 md:p-12">

        {/* ── Page Title & Role Banner ── */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-4">
              <Activity size={28} className="text-amber-500" />
              نظام سير العمل الشهري
            </h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60">
              Monthly Video Production Workflow — Team View
            </p>
          </div>
          {/* Role permission notice */}
          <div className="hidden md:flex flex-col items-end gap-1 text-right flex-shrink-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">دورك</span>
            <span className="px-3 py-1.5 bg-brand-500/10 text-brand-500 rounded-xl text-[10px] font-black border border-brand-500/20">
              {userPosition || 'Team Member'}
            </span>
            {myEditableStageDef ? (
              <span className="text-[9px] font-black text-amber-600 mt-0.5">✏️ تعديل: {myEditableStageDef.label}</span>
            ) : (
              <span className="text-[9px] font-black text-slate-400 mt-0.5">👁️ عرض فقط</span>
            )}
          </div>
        </div>

        {/* ── Monthly Tab Bar ── */}
        {sortedPhases.length > 0 ? (
          <>
            <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-8 scrollbar-none">
              {sortedPhases.map((phase, idx) => {
                const isActive = phase.id === activePhaseId;
                const taskCount = (phaseTasks[phase.id] || []).length;
                // Count revision requests in this phase
                const revisionCount = (phaseTasks[phase.id] || []).filter(t => {
                  try {
                    const m = JSON.parse(t.description || '{}');
                    return ['script', 'edit', 'thumbnail', 'publish'].some(k => m[k]?.approvalStatus === 'REVISION_REQUESTED');
                  } catch (_) { return false; }
                }).length;

                return (
                  <button
                    key={phase.id}
                    onClick={() => selectPhase(phase.id)}
                    className={`group relative flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? 'bg-amber-500 dark:bg-[#FFD700] text-white dark:text-[#0A0A0A] shadow-xl shadow-amber-500/30 scale-105'
                        : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-amber-400 hover:text-amber-600'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10'}`}>
                      {sortedPhases.length - idx}
                    </span>
                    <span className="text-xs">{phase.name}</span>
                    {taskCount > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white/20' : 'bg-amber-500/10 text-amber-600'}`}>
                        {taskCount}
                      </span>
                    )}
                    {revisionCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                        {revisionCount} ⚠️
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Active Month Content ── */}
            {activePhase && (
              <div className="space-y-4">
                {/* Month Header */}
                <div className="flex items-center justify-between mb-6 p-5 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-amber-500/30">
                      {new Date(activePhase.createdAt).getMonth() + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {activePhase.name}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {(phaseTasks[activePhaseId] || []).length} فيديو •{' '}
                        {(phaseTasks[activePhaseId] || []).filter(t => t.assignedTo?.user?.id === user.id).length} مسند إليّ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Cards */}
                {loadingTasks[activePhaseId] ? (
                  <div className="py-24 flex flex-col items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-amber-500 opacity-30" />
                  </div>
                ) : (phaseTasks[activePhaseId] || []).length === 0 ? (
                  <div className="py-24 text-center bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Film size={28} className="text-slate-200 dark:text-slate-700" />
                    </div>
                    <p className="font-black text-slate-400 uppercase text-[11px] tracking-widest">
                      لا توجد فيديوهات في هذا الشهر بعد
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(phaseTasks[activePhaseId] || []).map((task, idx) => (
                      <TeamVideoCard
                        key={task.id}
                        task={task}
                        index={idx}
                        phaseId={activePhaseId}
                        userId={user?.id}
                        userPosition={userPosition}
                        onMetaChange={handleMetaChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-32 text-center bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
            <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Calendar size={36} className="text-slate-200 dark:text-slate-700" />
            </div>
            <h3 className="text-xl font-black text-slate-700 dark:text-white uppercase tracking-tight mb-3">
              لا توجد أشهر بعد
            </h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              انتظر الإدارة لإضافة الأشهر وتوزيع المهام
            </p>
          </div>
        )}
      </div>

      {/* ── Floating Mini Chat ── */}
      <div className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 z-[100] flex flex-col items-end gap-4 sm:gap-6">
        {showMiniChat && (
          <div className="w-[calc(100vw-2rem)] sm:w-[400px] h-[min(550px,70dvh)] bg-white dark:bg-[#0d0d10] border-2 border-slate-100 dark:border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="p-3 sm:p-6 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tighter">دردشة المشروع</h4>
                  <p className="text-[10px] font-bold text-amber-200/60 uppercase tracking-widest">Team Sync Mode</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/team/messages" className="p-2 hover:bg-white/10 rounded-lg text-amber-200 transition-all">
                  <ExternalLink size={16} />
                </Link>
                <button onClick={() => setShowMiniChat(false)} className="p-2 hover:bg-white/10 rounded-lg text-amber-200 transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div ref={miniChatRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-black/20">
              {miniMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                  <MessageSquare size={40} className="mb-4 text-amber-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">لا توجد رسائل بعد</p>
                </div>
              ) : miniMessages.map((m, idx) => {
                const isMe = m.senderId === user.id;
                return (
                  <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-bold leading-relaxed ${isMe ? 'bg-amber-600 text-white rounded-tr-none' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-tl-none'}`}>
                      {!isMe && <p className="text-[8px] font-black text-amber-500 uppercase mb-1">{m.sender?.firstName || 'User'}</p>}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleSendMini} className="p-4 bg-white dark:bg-[#0a0a0c] border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
              <input
                value={newMiniMsg}
                onChange={e => setNewMiniMsg(e.target.value)}
                placeholder="اكتب..."
                className="flex-1 min-w-0 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              <button disabled={isSendingMini} className="p-3 bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-600/30 hover:scale-110 active:scale-95 transition-all flex-shrink-0">
                {isSendingMini ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        )}
        <button
          onClick={() => setShowMiniChat(!showMiniChat)}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all active:scale-95 group ${showMiniChat ? 'bg-slate-900 border-2 border-amber-500 text-white rotate-90 scale-110' : 'bg-amber-600 text-white hover:scale-110 hover:shadow-amber-600/40'}`}
        >
          {showMiniChat ? <X size={32} /> : (
            <div className="relative">
              <MessageSquare size={32} className="group-hover:animate-bounce" />
              <div className="absolute -top-4 -right-4 w-6 h-6 bg-rose-500 rounded-full border-4 border-white dark:border-[#0a0a0c] animate-pulse" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default TeamWorkspaceDetail;
