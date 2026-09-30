import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { 
  getWorkspaceAPI, 
  getUsersAPI, 
  getPhaseTasksAPI, 
  updateWorkspaceTaskAPI, 
  createPhaseAPI, 
  deletePhaseAPI, 
  createWorkspaceTaskAPI, 
  deleteWorkspaceTaskAPI,
  toggleStageVisibilityAPI,
  getMessagesAPI,
  sendMessageAPI,
  updateClientAPI
} from '../../store/api';
import { useSocket } from '../../context/SocketContext';
import { 
  Plus, X, Trash2, Layout, Loader2, CheckCircle2, Clock, FileText, ExternalLink, 
  ChevronRight, Activity, ShieldCheck, MessageSquare, AlertCircle,
  Eye, EyeOff, FileCode, Film, Image as ImageIcon, Calendar, Link as LinkIcon,
  Save, Send, Minimize2, ChevronDown, Sliders, Youtube, Sparkles
} from 'lucide-react';
import PublishingScheduleSection from '../../components/PublishingScheduleSection';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

// ─── Constants ──────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin.mark@creziax.com';

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
  },
];

const STAGE_COLORS = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-100 dark:border-blue-500/20',
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500 text-white',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    border: 'border-purple-100 dark:border-purple-500/20',
    icon: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500 text-white',
    accent: 'text-purple-600 dark:text-purple-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-100 dark:border-amber-500/20',
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500 text-white',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-100 dark:border-emerald-500/20',
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500 text-white',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
};

// ─── Stage Metadata Parser ───────────────────────────────────────────────────
const parseVideoMeta = (description) => {
  const emptyStage = {
    link: '',
    datetime: '',
    visible: false,
    approvalStatus: 'PENDING', // PENDING | APPROVED | AUTO_APPROVED | REVISION_REQUESTED | REVISION_DONE
    clientNotes: '',
    teamDeadlineHours: 24,
    teamDeadlineStartedAt: null,
    teamDeadlineExpired: false,
    penaltyApplied: false,
    clientReviewHours: 12,
    clientTimerStartedAt: null,
  };
  const empty = {
    script:    { ...emptyStage },
    edit:      { ...emptyStage },
    thumbnail: { ...emptyStage },
    publish:   { ...emptyStage },
  };
  try {
    if (!description || description === 'null' || description === 'undefined') return empty;
    const parsed = JSON.parse(description);
    if (!parsed || typeof parsed !== 'object') return empty;
    return {
      script:    { ...emptyStage, ...parsed.script },
      edit:      { ...emptyStage, ...parsed.edit },
      thumbnail: { ...emptyStage, ...parsed.thumbnail },
      publish:   { ...emptyStage, ...parsed.publish },
    };
  } catch (_) { return empty; }
};

const getFormattedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

// ─── Stage Panel Component ───────────────────────────────────────────────────
const StagePanel = ({ stage, meta, taskId, phaseId, isAdmin, onMetaChange, onVisibilityToggle, togglingVisibility }) => {
  const c = STAGE_COLORS[stage.color];
  const Icon = stage.icon;
  const stageMeta = meta[stage.key] || {};
  const isVisible = !!stageMeta.visible;
  const value = stageMeta[stage.fieldKey] || '';
  const [localValue, setLocalValue] = useState(value);
  const [saving, setSaving] = useState(false);

  // Timer configuration states for Admin
  const [showConfig, setShowConfig] = useState(false);
  const [teamHours, setTeamHours] = useState(stageMeta.teamDeadlineHours || 24);
  const [clientHours, setClientHours] = useState(stageMeta.clientReviewHours || 12);

  const teamExpired = !!stageMeta.teamDeadlineExpired;
  const approvalStatus = stageMeta.approvalStatus || 'PENDING';

  // Sync local values when meta changes externally
  useEffect(() => {
    setLocalValue(stageMeta[stage.fieldKey] || '');
    setTeamHours(stageMeta.teamDeadlineHours || 24);
    setClientHours(stageMeta.clientReviewHours || 12);
  }, [stageMeta]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const newMeta = { 
        ...meta, 
        [stage.key]: { 
          ...stageMeta, 
          [stage.fieldKey]: localValue,
          teamDeadlineHours: Number(teamHours) || 24,
          clientReviewHours: Number(clientHours) || 12,
        } 
      };
      await updateWorkspaceTaskAPI(taskId, { description: JSON.stringify(newMeta) });
      onMetaChange(taskId, phaseId, newMeta);
      toast.success('تم الحفظ');
    } catch (_) {
      toast.error('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminUnlock = async () => {
    setSaving(true);
    try {
      const newMeta = {
        ...meta,
        [stage.key]: {
          ...stageMeta,
          teamDeadlineExpired: false,
          teamDeadlineStartedAt: new Date().toISOString()
        }
      };
      await updateWorkspaceTaskAPI(taskId, { description: JSON.stringify(newMeta) });
      onMetaChange(taskId, phaseId, newMeta);
      toast.success('تم إلغاء القفل وتمديد المهلة بنجاح ✓');
    } catch (_) {
      toast.error('فشل إلغاء القفل');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
  };

  const isTogglingThis = togglingVisibility === `${taskId}-${stage.key}`;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-all duration-300 ${c.bg} ${c.border}`}>
      {/* Stage Header */}
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

        {/* Action badges & Visibility Toggle */}
        <div className="flex items-center gap-2">
          {/* Status Badges */}
          {approvalStatus === 'AUTO_APPROVED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
              ⚡ تم الاعتماد تلقائياً
            </span>
          )}
          {approvalStatus === 'APPROVED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
              <CheckCircle2 size={9} /> تم الاعتماد
            </span>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowConfig(v => !v)}
              className="p-1.5 rounded-xl bg-white dark:bg-white/5 text-slate-400 hover:text-brand-500 border border-slate-200 dark:border-white/10 text-[9px] font-black transition-all"
              title="إعدادات المهل والتوقيتات"
            >
              ⏱️ المهل
            </button>
          )}

          {/* Visibility Toggle — Admin Email Guard */}
          {isAdmin && (
            <button
              onClick={() => onVisibilityToggle(taskId, phaseId, stage.key, !isVisible)}
              disabled={isTogglingThis}
              title={isVisible ? 'إخفاء من لوحة العميل' : 'إظهار إلى لوحة العميل'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border active:scale-95 ${
                isVisible
                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 hover:border-emerald-400 hover:text-emerald-500'
              } ${isTogglingThis ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isTogglingThis ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isVisible ? (
                <><Eye size={12} />مرئي للعميل</>
              ) : (
                <><EyeOff size={12} />إظهار للعميل</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Admin Timer Control Panel */}
      {isAdmin && showConfig && (
        <div className="p-3 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl space-y-2 text-[10px] font-bold">
          <div className="flex items-center justify-between gap-4">
            <label className="text-slate-600 dark:text-slate-300">مهلة الفريق (ساعة):</label>
            <input
              type="number"
              value={teamHours}
              onChange={e => setTeamHours(e.target.value)}
              className="w-20 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-center font-bold"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-slate-600 dark:text-slate-300">مهلة العميل للاعتماد (ساعة):</label>
            <input
              type="number"
              value={clientHours}
              onChange={e => setClientHours(e.target.value)}
              className="w-20 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-center font-bold"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 bg-brand-600 text-white rounded-lg text-[9px] font-black uppercase"
            >
              حفظ التوقيتات
            </button>
          </div>
        </div>
      )}

      {/* Penalty Warning Banner if Team Deadline Expired */}
      {teamExpired && (
        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[10px] font-black">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>تحذير: تم تجاوز الوقت المحدد - خصم 3% من الميزانية</span>
          </div>
          {isAdmin && (
            <button
              onClick={handleAdminUnlock}
              disabled={saving}
              className="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[9px] font-black shadow-sm active:scale-95 flex-shrink-0"
            >
              إلغاء القفل
            </button>
          )}
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-center gap-2">
        {stage.inputType === 'datetime-local' ? (
          <input
            type="datetime-local"
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        ) : (
          <div className="relative flex-1">
            <LinkIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type={stage.inputType}
              value={localValue}
              onChange={e => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={stage.placeholder}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:opacity-30"
            />
          </div>
        )}

        {/* Save Button */}
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

        {/* External link opener */}
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white dark:bg-white/5 text-slate-400 hover:text-brand-500 border border-slate-200 dark:border-white/10 transition-all flex-shrink-0"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Visibility Status Badge (read-only indicator) */}
      {!isAdmin && (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
          isVisible ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
        }`}>
          {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
          {isVisible ? 'مرئي للعميل' : 'غير مرئي للعميل'}
        </div>
      )}

      {/* Client Feedback & Approval Status Display */}
      {stageMeta.approvalStatus && (
        <div className={`p-3 rounded-xl border text-[11px] font-bold ${
          stageMeta.approvalStatus === 'APPROVED' 
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
            : stageMeta.approvalStatus === 'REVISION_REQUESTED' 
            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span>حالة الموافقة: {
              stageMeta.approvalStatus === 'APPROVED' ? 'تم الاعتماد واستلام العمل ✓' : 
              stageMeta.approvalStatus === 'REVISION_REQUESTED' ? 'مطلوب تعديلات إضافية ✏️' : 'بانتظار مراجعة العميل ⏳'
            }</span>
          </div>
          {stageMeta.clientNotes && (
            <div className="mt-1 p-2 bg-white dark:bg-black/35 rounded-lg border border-slate-100 dark:border-white/5 text-[10.5px] leading-relaxed text-slate-600 dark:text-slate-300">
              <strong className="block text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">ملاحظات العميل:</strong>
              {stageMeta.clientNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Video Card Component ────────────────────────────────────────────────────
const VideoCard = ({ task, index, phaseId, isAdmin, teamMembers, onMetaChange, onDelete, onVisibilityToggle, togglingVisibility }) => {
  const [expanded, setExpanded] = useState(true);
  const meta = parseVideoMeta(task.description);

  return (
    <div className="bg-white dark:bg-[#0a0a0c]/80 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Card Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Video Number */}
        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-lg shadow-brand-600/30">
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-800 dark:text-white text-sm truncate">{task.title}</p>
          {task.deadline && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              <Clock size={10} className="inline mr-1" />
              {new Date(task.deadline).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>

        {/* Stage Summary Dots (visibility + approval status) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {STAGES.map(s => {
            const stageMeta = meta[s.key] || {};
            const isVis = !!stageMeta.visible;
            const approval = stageMeta.approvalStatus;
            const dotColor = !isVis ? 'bg-slate-200 dark:bg-white/10' :
              approval === 'APPROVED' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
              approval === 'REVISION_REQUESTED' ? 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse' :
              'bg-amber-400';
            return (
              <div
                key={s.key}
                title={`${s.label}: ${!isVis ? 'مخفي' : approval === 'APPROVED' ? 'معتمد ✓' : approval === 'REVISION_REQUESTED' ? 'مطلوب تعديل ⚠️' : 'بانتظار العميل'}`}
                className={`w-2.5 h-2.5 rounded-full transition-all ${dotColor}`}
              />
            );
          })}
        </div>

        {/* Admin Delete */}
        {isAdmin && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id, phaseId); }}
            className="p-2 text-slate-300 hover:text-rose-500 transition-all rounded-lg flex-shrink-0"
          >
            <Trash2 size={15} />
          </button>
        )}

        <ChevronDown
          size={18}
          className={`text-slate-300 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* 4-Stage Panels */}
      {expanded && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
          {STAGES.map(stage => (
            <StagePanel
              key={stage.key}
              stage={stage}
              meta={meta}
              taskId={task.id}
              phaseId={phaseId}
              isAdmin={isAdmin}
              onMetaChange={onMetaChange}
              onVisibilityToggle={onVisibilityToggle}
              togglingVisibility={togglingVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const WorkspaceDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Admin Email Guard — visibility toggles and controls for all Admin/Owner users
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'OWNER'; // can see all data

  const [workspace, setWorkspace] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState(null);

  // Phase handling
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ name: '' });
  const [phaseTasks, setPhaseTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});

  // Task handling
  const [showAddTask, setShowAddTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', deadline: '', assignedToId: '' });

  // Custom Production Pipeline Stages State (Requirement 4)
  const [showStageConfigModal, setShowStageConfigModal] = useState(false);
  const [customStages, setCustomStages] = useState([]);
  const [stageInput, setStageInput] = useState('');
  const [savingStages, setSavingStages] = useState(false);

  // Month Accordion Collapse State
  const [collapsedMonths, setCollapsedMonths] = useState({});
  const isMonthCollapsed = !!collapsedMonths[activePhaseId];
  const toggleMonthCollapse = () => setCollapsedMonths(prev => ({ ...prev, [activePhaseId]: !prev[activePhaseId] }));

  // Visibility toggling state
  const [togglingVisibility, setTogglingVisibility] = useState(null);

  // Mini-chat
  const [showMiniChat, setShowMiniChat] = useState(false);
  const [miniMessages, setMiniMessages] = useState([]);
  const [newMiniMsg, setNewMiniMsg] = useState('');
  const [isSendingMini, setIsSendingMini] = useState(false);
  const socket = useSocket();
  const miniChatRef = useRef(null);

  const handleSaveCustomStages = async () => {
    const clientId = workspace?.client?.id || workspace?.clientId;
    if (!clientId) {
      toast.error('لم يتم العثور على معرّف العميل');
      return;
    }
    setSavingStages(true);
    try {
      await updateClientAPI(clientId, { productionStages: customStages });
      toast.success('تم حفظ مراحل الإنتاج المخصصة للعميل بنجاح');
      setShowStageConfigModal(false);
      fetchData();
    } catch (err) {
      toast.error('فشل حفظ مراحل الإنتاج');
    } finally {
      setSavingStages(false);
    }
  };

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
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [getWorkspaceAPI(id)];
      if (isStaff) calls.push(getUsersAPI());
      const results = await Promise.all(calls);
      const wData = results[0].data?.data || results[0].data;
      setWorkspace(wData);
      if (wData?.client?.productionStages) {
        setCustomStages(wData.client.productionStages);
      }
      if (isStaff && results[1]) {
        setTeamMembers((results[1].data?.data || results[1].data || []).filter(u => u.role === 'TEAM'));
      }
      // Auto-select newest phase
      if (wData?.phases?.length > 0) {
        const sorted = [...wData.phases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestId = sorted[0]?.id;
        setActivePhaseId(latestId);
        loadPhaseTasksFor(latestId);
      }
    } catch (_) { toast.error(t('loading')); }
    finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadPhaseTasksFor = useCallback(async (phaseId) => {
    setLoadingTasks(prev => ({ ...prev, [phaseId]: true }));
    try {
      const res = await getPhaseTasksAPI(phaseId);
      setPhaseTasks(prev => ({ ...prev, [phaseId]: res.data?.data || res.data || [] }));
    } catch (_) { toast.error(t('failed_load_tasks')); }
    finally { setLoadingTasks(prev => ({ ...prev, [phaseId]: false })); }
  }, [t]);

  const selectPhase = (phaseId) => {
    setActivePhaseId(phaseId);
    if (!phaseTasks[phaseId]) loadPhaseTasksFor(phaseId);
  };

  // ── Phase Actions ──
  const handleAddPhase = async (e) => {
    e.preventDefault();
    if (!phaseForm.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await createPhaseAPI(id, { name: phaseForm.name });
      const newPhase = res.data?.data || res.data;
      toast.success(t('saved_successfully'));
      setShowAddPhase(false);
      setPhaseForm({ name: '' });
      setWorkspace(prev => ({ ...prev, phases: [newPhase, ...(prev.phases || [])] }));
      setActivePhaseId(newPhase.id);
      setPhaseTasks(prev => ({ ...prev, [newPhase.id]: [] }));
    } catch (_) { toast.error(t('error_general')); }
    finally { setSubmitting(false); }
  };

  const handleDeletePhase = async (phaseId) => {
    if (!confirm(t('confirm_delete_phase', 'هل أنت متأكد من حذف هذا الشهر؟'))) return;
    try {
      await deletePhaseAPI(phaseId);
      toast.success(t('phase_deleted', 'تم حذف الشهر'));
      const remaining = (workspace.phases || []).filter(p => p.id !== phaseId);
      setWorkspace(prev => ({ ...prev, phases: remaining }));
      if (activePhaseId === phaseId) {
        const next = remaining[0]?.id || null;
        setActivePhaseId(next);
        if (next && !phaseTasks[next]) loadPhaseTasksFor(next);
      }
    } catch (_) { toast.error(t('error_general')); }
  };

  // ── Task Actions ──
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setSubmitting(true);
    try {
      const initialMeta = JSON.stringify({
        script: { link: '', status: 'NOT_STARTED', visible: false },
        edit: { link: '', status: 'NOT_STARTED', visible: false },
        thumbnail: { link: '', status: 'NOT_STARTED', visible: false },
        publish: { datetime: '', status: 'NOT_STARTED', visible: false },
      });
      await createWorkspaceTaskAPI(showAddTask, { ...taskForm, description: initialMeta });
      toast.success(t('saved_successfully'));
      loadPhaseTasksFor(showAddTask);
      setShowAddTask(null);
      setTaskForm({ title: '', deadline: '', assignedToId: '' });
    } catch (_) { toast.error(t('error_general')); }
    finally { setSubmitting(false); }
  };

  const handleDeleteTask = async (taskId, phaseId) => {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await deleteWorkspaceTaskAPI(taskId);
      toast.success(t('saved_successfully'));
      setPhaseTasks(prev => ({
        ...prev,
        [phaseId]: (prev[phaseId] || []).filter(t => t.id !== taskId)
      }));
    } catch (_) { toast.error(t('error_general')); }
  };

  // ── Meta Update (from Stage Save) ──
  const handleMetaChange = (taskId, phaseId, newMeta) => {
    setPhaseTasks(prev => ({
      ...prev,
      [phaseId]: (prev[phaseId] || []).map(t =>
        t.id === taskId ? { ...t, description: JSON.stringify(newMeta) } : t
      )
    }));
  };

  // ── Visibility Toggle (Admin Only) ──
  const handleVisibilityToggle = async (taskId, phaseId, stage, visible) => {
    const key = `${taskId}-${stage}`;
    setTogglingVisibility(key);
    try {
      const res = await toggleStageVisibilityAPI(taskId, { stage, visible });
      const updated = res.data?.data || res.data;
      if (updated) {
        setPhaseTasks(prev => ({
          ...prev,
          [phaseId]: (prev[phaseId] || []).map(t => t.id === taskId ? updated : t)
        }));
      }
      toast.success(visible ? '✅ مرئي الآن للعميل' : '🔒 تم إخفاؤه من العميل');
    } catch (_) {
      toast.error('فشل تغيير الظهور');
    } finally {
      setTogglingVisibility(null);
    }
  };

  // ── Render States ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <Loader2 size={64} className="animate-spin text-brand-500 mb-8 opacity-20" />
        <p className="font-black tracking-[0.2em] uppercase text-[10px] text-slate-400 animate-pulse">
          {t('syncing_workspace')}
        </p>
      </div>
    );
  }

  if (!workspace) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <AlertCircle size={48} className="text-rose-500 mb-8" />
      <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">
        {t('project_not_found', 'المشروع غير موجود')}
      </h2>
      <Link to={isStaff ? '/admin/projects' : '/team/projects'} className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
        {t('back_to_projects', 'العودة للمشاريع')}
      </Link>
    </div>
  );

  const sortedPhases = [...(workspace.phases || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const activePhase = sortedPhases.find(p => p.id === activePhaseId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-100 font-sans pb-20">

      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-[50] bg-white/90 dark:bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 h-16 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <Link to="/admin/projects" className="p-2 sm:p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all text-slate-400 hover:text-brand-500 border border-slate-100 dark:border-white/10 shadow-sm flex-shrink-0">
              <ChevronRight className="rotate-180 size-5 sm:size-6" />
            </Link>
            <div className="min-w-0 overflow-hidden">
              <h1 className="text-sm sm:text-2xl font-black tracking-tighter text-slate-800 dark:text-white uppercase leading-none truncate">
                {workspace.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-0.5 bg-brand-500/10 text-brand-500 text-[6px] sm:text-[8px] font-black uppercase tracking-widest rounded-full border border-brand-500/20 flex-shrink-0">
                  مركز القيادة v21
                </div>
                {isAdmin && (
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[6px] sm:text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 flex-shrink-0">
                    <ShieldCheck size={10} className="inline mr-1" />System Admin
                  </div>
                )}
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                  {workspace.client?.user?.firstName} {workspace.client?.user?.lastName}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 flex-wrap">
            {/* Channel Link */}
            {(workspace.client?.channelLink || workspace.clientChannelLink) && (
              <a 
                href={(workspace.client?.channelLink || workspace.clientChannelLink).startsWith('http') 
                  ? (workspace.client?.channelLink || workspace.clientChannelLink) 
                  : `https://${workspace.client?.channelLink || workspace.clientChannelLink}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-600/20 active:scale-95"
              >
                <Youtube size={16} />
                <span>القناة</span>
              </a>
            )}

            {/* Custom Production Pipeline Settings Button (Requirement 4) */}
            {isAdmin && (
              <button
                onClick={() => setShowStageConfigModal(true)}
                className="flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 bg-amber-500 hover:bg-amber-400 text-white rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                title="تخصيص مراحل الإنتاج للعميل"
              >
                <Sliders size={16} />
                <span>تخصيص المراحل</span>
              </button>
            )}

            {workspace.notionUrl && (
              <a href={workspace.notionUrl} target="_blank" rel="noopener noreferrer"
                className="p-3 sm:px-6 sm:py-4 bg-white dark:bg-white/5 text-slate-500 hover:text-brand-500 rounded-xl sm:rounded-[1.5rem] transition-all border border-slate-200 dark:border-white/10 shadow-sm active:scale-95 group"
              >
                <FileText size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline ml-2">{t('notion_btn', 'نوشن')}</span>
              </a>
            )}
            {isStaff && (
              <a href={workspace.clientChannelLink || '#'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 sm:px-8 sm:py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 active:scale-95"
              >
                <Activity size={16} />
                <span className="hidden sm:inline">{t('communication_channel', 'قناة التواصل')}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 sm:p-10 md:p-12">

        {/* ── Page Title ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-4">
              <Activity size={28} className="text-brand-500" />
              نظام سير العمل الشهري
            </h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60">
              Monthly Video Production Workflow — v21
            </p>
          </div>
          {isStaff && (
            <button
              onClick={() => setShowAddPhase(true)}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95 flex-shrink-0"
            >
              <Plus size={20} />
              إضافة شهر جديد
            </button>
          )}
        </div>

        {/* ── Monthly Tab Bar ── */}
        {sortedPhases.length > 0 ? (
          <>
            <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-8 scrollbar-none">
              {sortedPhases.map((phase, idx) => {
                const isActive = phase.id === activePhaseId;
                const taskCount = (phaseTasks[phase.id] || []).length;
                return (
                  <div key={phase.id} className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => selectPhase(phase.id)}
                      className={`group relative flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/30 scale-105'
                          : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-brand-500/40 hover:text-brand-600'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10'}`}>
                        {sortedPhases.length - idx}
                      </span>
                      <span className="text-xs">{phase.name}</span>
                      {taskCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white/20' : 'bg-brand-500/10 text-brand-600'}`}>
                          {taskCount}
                        </span>
                      )}
                    </button>
                    {isStaff && (
                      <button
                        onClick={() => handleDeletePhase(phase.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 hover:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Active Month Content ── */}
            {activePhase && (
              <div className="space-y-4">
                {/* Month Header */}
                <div className="flex items-center justify-between mb-6 p-5 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                  <div 
                    onClick={toggleMonthCollapse}
                    className="flex items-center gap-4 cursor-pointer select-none group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-brand-600/30 group-hover:scale-105 transition-transform">
                      {new Date(activePhase.createdAt).getMonth() + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-brand-500 transition-colors">
                          {activePhase.name}
                        </h3>
                        <ChevronDown 
                          size={18} 
                          className={`text-slate-400 transition-transform duration-300 ${isMonthCollapsed ? '-rotate-90' : 'rotate-0'}`} 
                        />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        {(phaseTasks[activePhaseId] || []).length} فيديو •{' '}
                        {(phaseTasks[activePhaseId] || []).filter(t => {
                          const m = parseVideoMeta(t.description);
                          return STAGES.some(s => m[s.key]?.visible);
                        }).length} مرئي للعميل
                        {isMonthCollapsed && (
                          <span className="text-brand-500 mr-2 font-bold">(مطوي - انقر للفتح)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMonthCollapse}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
                      title={isMonthCollapsed ? 'فتح الشهر' : 'طي الشهر'}
                    >
                      <span>{isMonthCollapsed ? 'عرض الفيديوهات' : 'طي الفيديوهات'}</span>
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isMonthCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                    </button>
                    {isStaff && (
                      <button
                        onClick={() => setShowAddTask(activePhaseId)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 hover:border-emerald-500 active:scale-95"
                      >
                        <Plus size={16} />
                        إضافة فيديو
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Cards (Collapsible) */}
                {!isMonthCollapsed && (
                  <>
                    {loadingTasks[activePhaseId] ? (
                      <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <Loader2 size={40} className="animate-spin text-brand-500 opacity-30" />
                      </div>
                    ) : (phaseTasks[activePhaseId] || []).length === 0 ? (
                      <div className="py-24 text-center bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Film size={28} className="text-slate-200 dark:text-slate-700" />
                        </div>
                        <p className="font-black text-slate-400 uppercase text-[11px] tracking-widest">
                          لا توجد فيديوهات في هذا الشهر
                        </p>
                        {isStaff && (
                          <button
                            onClick={() => setShowAddTask(activePhaseId)}
                            className="mt-6 flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest mx-auto hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 active:scale-95"
                          >
                            <Plus size={16} /> أضف أول فيديو
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in-50 duration-300">
                        {(phaseTasks[activePhaseId] || []).map((task, idx) => (
                          <VideoCard
                            key={task.id}
                            task={task}
                            index={idx}
                            phaseId={activePhaseId}
                            isAdmin={isAdmin}
                            teamMembers={teamMembers}
                            onMetaChange={handleMetaChange}
                            onDelete={handleDeleteTask}
                            onVisibilityToggle={handleVisibilityToggle}
                            togglingVisibility={togglingVisibility}
                          />
                        ))}
                      </div>
                    )}
                  </>
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
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">
              أضف أول شهر لبدء تنظيم سير العمل
            </p>
            {isStaff && (
              <button
                onClick={() => setShowAddPhase(true)}
                className="flex items-center gap-3 px-10 py-5 bg-brand-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest mx-auto hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/20 active:scale-95"
              >
                <Plus size={20} /> إضافة شهر جديد
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Modal: Add Phase ── */}
      {showAddPhase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md" onClick={() => setShowAddPhase(false)} />
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                إضافة شهر جديد
              </h3>
              <button onClick={() => setShowAddPhase(false)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-white/5 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPhase} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70 italic">
                  اسم الشهر (مثال: يوليو 2025)
                </label>
                <input
                  value={phaseForm.name}
                  onChange={e => setPhaseForm({ name: e.target.value })}
                  required
                  placeholder="مثال: أغسطس 2025"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <button type="submit" disabled={submitting} className="w-full py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/30 transition-all text-xs uppercase tracking-widest active:scale-95">
                {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'حفظ الشهر'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Video ── */}
      {showAddTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md" onClick={() => setShowAddTask(null)} />
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                إضافة فيديو جديد
              </h3>
              <button onClick={() => setShowAddTask(null)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-white/5 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70 italic">
                  اسم الفيديو / رقم الفيديو
                </label>
                <input
                  value={taskForm.title}
                  onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="مثال: فيديو 01 — مراجعة iPhone 17"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70 italic">
                  تاريخ التسليم (اختياري)
                </label>
                <input
                  type="date"
                  value={taskForm.deadline}
                  onChange={e => setTaskForm(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70 italic">
                  إسناد لعضو فريق (اختياري)
                </label>
                <select
                  value={taskForm.assignedToId}
                  onChange={e => setTaskForm(prev => ({ ...prev, assignedToId: e.target.value }))}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">بدون إسناد...</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.teamMemberInfo?.id}>
                      {m.firstName} {m.lastName} {m.teamMemberInfo?.position ? `(${m.teamMemberInfo.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-5 bg-brand-600 text-white font-black rounded-2xl shadow-xl shadow-brand-600/30 transition-all text-xs uppercase tracking-widest active:scale-95">
                {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'إضافة الفيديو'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Production Pipeline Modal (Requirement 4) ── */}
      {showStageConfigModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Sliders size={20} className="text-amber-500" />
                تخصيص مراحل الإنتاج للعميل
              </h3>
              <button
                onClick={() => setShowStageConfigModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                حدد المراحل الإنتاجية المعتمدة لهذا العميل والتي تظهر له في لوحة التحكم (مثل: سكريبت - مونتاج - مراجعة - نشر).
              </p>

              <div className="flex gap-2">
                <input
                  value={stageInput}
                  onChange={e => setStageInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = stageInput.trim();
                      if (trimmed && !customStages.includes(trimmed)) {
                        setCustomStages([...customStages, trimmed]);
                        setStageInput('');
                      }
                    }
                  }}
                  placeholder="اكتب اسم المرحلة ثم اضغط إضافة..."
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = stageInput.trim();
                    if (trimmed && !customStages.includes(trimmed)) {
                      setCustomStages([...customStages, trimmed]);
                      setStageInput('');
                    }
                  }}
                  className="px-5 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs hover:bg-amber-400 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Active Stages Tags */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المراحل النشطة حالياً:</label>
                {customStages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customStages.map((st, idx) => (
                      <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black">
                        {st}
                        <button
                          type="button"
                          onClick={() => setCustomStages(customStages.filter((_, i) => i !== idx))}
                          className="hover:text-rose-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {['سكريبت', 'مونتاج', 'صور مصغرة', 'نشر'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setCustomStages(prev => [...prev, st])}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-500 hover:bg-amber-500/10 hover:text-amber-500"
                      >
                        + {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={handleSaveCustomStages}
                  disabled={savingStages}
                  className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {savingStages ? <Loader2 size={16} className="animate-spin" /> : 'حفظ مراحل الإنتاج'}
                </button>
                <button
                  onClick={() => setShowStageConfigModal(false)}
                  className="px-6 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Publishing Schedule Section (Requirement 5) ── */}
      <div className="mt-14">
        <PublishingScheduleSection projectId={id} isAdmin={isAdmin} isRTL={true} />
      </div>

      {/* ── Floating Mini Chat ── */}
      <div className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 z-[100] flex flex-col items-end gap-4 sm:gap-6">
        {showMiniChat && (
          <div className="w-[calc(100vw-2rem)] sm:w-[400px] h-[min(550px,70dvh)] bg-white dark:bg-[#0d0d10] border-2 border-slate-100 dark:border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="p-3 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-500 border border-brand-500/30">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tighter">دردشة المشروع</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v21 Live Sync</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/messages" className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all">
                  <ExternalLink size={16} />
                </Link>
                <button onClick={() => setShowMiniChat(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div ref={miniChatRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-black/20">
              {miniMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                  <MessageSquare size={40} className="mb-4 text-brand-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">لا توجد رسائل بعد</p>
                </div>
              ) : miniMessages.map((m, idx) => {
                const isMe = m.senderId === user.id;
                return (
                  <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-bold leading-relaxed ${isMe ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-tl-none'}`}>
                      {!isMe && <p className="text-[8px] font-black text-brand-500 uppercase mb-1">{m.sender?.firstName || 'User'}</p>}
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
                className="flex-1 min-w-0 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              <button disabled={isSendingMini} className="p-3 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-600/30 hover:scale-110 active:scale-95 transition-all flex-shrink-0">
                {isSendingMini ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        )}
        <button
          onClick={() => setShowMiniChat(!showMiniChat)}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all active:scale-95 group ${showMiniChat ? 'bg-slate-900 border-2 border-brand-500 text-white rotate-90 scale-110' : 'bg-brand-600 text-white hover:scale-110 hover:shadow-brand-600/40'}`}
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

export default WorkspaceDetail;
