import { useEffect, useState, useCallback } from 'react';
import { getProjectsAPI, getContractsAPI, submitClientFeedbackAPI } from '../../store/api';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  FolderKanban, Loader2, CheckCircle2, Film, AlertCircle,
  Calendar, FileCode, Image as ImageIcon, ExternalLink,
  Clock, ChevronDown, ThumbsUp, Edit3, X, Send, Sparkles
} from 'lucide-react';
import PublishingScheduleSection from '../../components/PublishingScheduleSection';

// ─── JSON Schema Parser ───────────────────────────────────────────────────────
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

// ─── Approval Status Badge ────────────────────────────────────────────────────
const ApprovalBadge = ({ status }) => {
  if (!status || status === 'PENDING') return null;
  if (status === 'AUTO_APPROVED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
      ⚡ تم الاعتماد تلقائياً
    </span>
  );
  if (status === 'APPROVED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
      <CheckCircle2 size={9} /> تم الاعتماد
    </span>
  );
  if (status === 'REVISION_DONE') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-600 border border-amber-500/25 animate-pulse">
      🔔 تم التعديل
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-rose-500/15 text-rose-600 border border-rose-500/25">
      <Edit3 size={9} /> مطلوب تعديل
    </span>
  );
};

// ─── Live Countdown Ticker Component ─────────────────────────────────────────
const ClientCountdownTicker = ({ startedAt, reviewHours, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!startedAt || !reviewHours) return;
    const startTime = new Date(startedAt).getTime();
    const durationMs = (Number(reviewHours) || 12) * 60 * 60 * 1000;
    const targetTime = startTime + durationMs;

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsExpired(true);
        if (onExpire) onExpire();
        return;
      }
      const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const mins = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const secs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
      setTimeLeft(`${hrs}:${mins}:${secs}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startedAt, reviewHours, onExpire]);

  if (isExpired || !timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-[9px] font-black">
      <Clock size={11} className="animate-spin text-amber-500" />
      <span>المتبقي للاعتماد التلقائي: {timeLeft}</span>
    </div>
  );
};

// ─── Stage Card with Feedback Controls ───────────────────────────────────────
const StageCard = ({ stageKey, stageMeta = {}, stageLabel, stageIcon: Icon, stageColor, taskId, isPublish, isRTL, onFeedbackSubmit }) => {
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isVisible = !!stageMeta.visible;
  const hasLinkOrValue = !!(stageMeta.link || stageMeta.datetime || stageMeta.hasLink);
  const value = isPublish ? stageMeta.datetime : stageMeta.link;
  const approvalStatus = stageMeta.approvalStatus || 'PENDING';
  const clientNotes = stageMeta.clientNotes || '';

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await submitClientFeedbackAPI(taskId, {
        stage: stageKey,
        approvalStatus: 'APPROVED',
        clientNotes: '',
      });
      toast.success(isRTL ? 'تم الاعتماد بنجاح ✓' : 'Approved successfully ✓');
      onFeedbackSubmit(taskId, res.data?.data);
    } catch (_) { toast.error(isRTL ? 'فشل إرسال الاعتماد' : 'Failed to submit approval'); }
    finally { setSubmitting(false); }
  };

  const handleRevisionSubmit = async () => {
    if (!revisionNote.trim()) return toast.error(isRTL ? 'اكتب ملاحظات التعديل أولاً' : 'Please enter revision notes');
    setSubmitting(true);
    try {
      const res = await submitClientFeedbackAPI(taskId, {
        stage: stageKey,
        approvalStatus: 'REVISION_REQUESTED',
        clientNotes: revisionNote.trim(),
      });
      toast.success(isRTL ? 'تم إرسال طلب التعديل للفريق ✏️' : 'Revision request sent ✏️');
      onFeedbackSubmit(taskId, res.data?.data);
      setShowRevisionBox(false);
      setRevisionNote('');
    } catch (_) { toast.error(isRTL ? 'فشل إرسال الملاحظات' : 'Failed to send notes'); }
    finally { setSubmitting(false); }
  };

  const colorMap = {
    blue:    { bg: 'bg-blue-50/70 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', icon: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', heading: 'text-blue-700 dark:text-blue-300' },
    purple:  { bg: 'bg-purple-50/70 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', icon: 'bg-purple-500/15 text-purple-600 dark:text-purple-400', heading: 'text-purple-700 dark:text-purple-300' },
    amber:   { bg: 'bg-amber-50/70 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', heading: 'text-amber-700 dark:text-amber-300' },
    emerald: { bg: 'bg-emerald-50/70 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', heading: 'text-emerald-700 dark:text-emerald-300' },
  };
  const c = colorMap[stageColor] || colorMap.blue;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-all ${c.bg} ${c.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
            <Icon size={15} />
          </div>
          <div className="min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-widest truncate ${c.heading}`}>{stageLabel}</p>
            {clientNotes && approvalStatus === 'REVISION_REQUESTED' && isVisible && (
              <p className="text-[9px] text-rose-500 font-bold mt-0.5 max-w-[180px] truncate">{clientNotes}</p>
            )}
          </div>
        </div>

        {/* Visibility Status Badge */}
        {!isVisible ? (
          !hasLinkOrValue ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 flex-shrink-0">
              ⏳ {isRTL ? 'تحت الإنشاء' : 'Under Construction'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex-shrink-0">
              🔍 {isRTL ? 'تحت المراجعة من قبل الإدارة' : 'Under Management Review'}
            </span>
          )
        ) : (
          <ApprovalBadge status={approvalStatus} />
        )}
      </div>

      {/* Value display area */}
      {!isVisible ? (
        <div className="bg-white/60 dark:bg-black/20 rounded-xl px-3.5 py-2.5 border border-dashed border-slate-200 dark:border-white/10">
          {!hasLinkOrValue ? (
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse" />
              {isRTL ? 'جاري العمل والتجهيز لهذه المرحلة...' : 'Work in progress by the team...'}
            </p>
          ) : (
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {isRTL ? 'المرحلة مكتملة وقيد المراجعة الإدارية (ستتاح قريباً)' : 'Completed & under review by management (available soon)'}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-white dark:bg-black/20 rounded-xl px-3 py-2 border border-slate-100 dark:border-white/5">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
              {isPublish && value
                ? new Date(value).toLocaleString(isRTL ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
                : value || (isRTL ? 'جاهز للمراجعة' : 'Ready for review')}
            </p>
          </div>
          {!isPublish && value && (
            <a href={value} target="_blank" rel="noopener noreferrer"
              title={isRTL ? 'فتح الرابط' : 'Open link'}
              className="p-2 bg-white dark:bg-white/5 text-slate-400 hover:text-brand-500 border border-slate-200 dark:border-white/10 rounded-xl transition-all flex-shrink-0 shadow-sm">
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      )}

      {/* Live Countdown Ticker — Only if visible */}
      {isVisible && approvalStatus !== 'APPROVED' && approvalStatus !== 'AUTO_APPROVED' && stageMeta.clientTimerStartedAt && (
        <ClientCountdownTicker
          startedAt={stageMeta.clientTimerStartedAt}
          reviewHours={stageMeta.clientReviewHours || 12}
        />
      )}

      {/* REVISION_DONE Banner — team has completed the revision */}
      {isVisible && approvalStatus === 'REVISION_DONE' && (
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <div>
              <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">{isRTL ? 'تم التعديل — راجع الآن!' : 'Revision Completed — Review now!'}</p>
              <p className="text-[9px] text-amber-600 dark:text-amber-500 font-bold">{isRTL ? 'قام الفريق بتعديل هذه المرحلة، يرجى مراجعتها واعتمادها أو طلب تعديل إضافي.' : 'The team has updated this stage, please review and approve or request revision.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Actions — ONLY when Visible & not APPROVED / AUTO_APPROVED */}
      {isVisible && approvalStatus !== 'APPROVED' && approvalStatus !== 'AUTO_APPROVED' && (
        <div className="space-y-2 pt-1">
          {/* Revision note box */}
          {showRevisionBox && (
            <div className="bg-white dark:bg-black/20 rounded-xl border border-rose-200 dark:border-rose-500/20 p-3 space-y-2 animate-in zoom-in-95 duration-200">
              <textarea
                value={revisionNote}
                onChange={e => setRevisionNote(e.target.value)}
                placeholder={isRTL ? 'اكتب ملاحظاتك للفريق بالتفصيل...' : 'Type your revision notes here...'}
                rows={3}
                className="w-full bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 resize-none focus:outline-none placeholder:opacity-40"
              />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => { setShowRevisionBox(false); setRevisionNote(''); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-all">
                  <X size={14} />
                </button>
                <button
                  onClick={handleRevisionSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all">
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {isRTL ? 'إرسال الملاحظات' : 'Submit Notes'}
                </button>
              </div>
            </div>
          )}

          {!showRevisionBox && (
            <div className="flex items-center gap-2">
              {/* ✅ Approve button */}
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-500/20 active:scale-95 hover:bg-emerald-400 transition-all">
                {submitting ? <Loader2 size={11} className="animate-spin" /> : <ThumbsUp size={11} />}
                {isRTL ? 'تأكيد واستلام' : 'Approve & Accept'}
              </button>
              {/* ✏️ Request revision button */}
              <button
                onClick={() => setShowRevisionBox(true)}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-white/5 text-rose-500 border border-rose-300 dark:border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                <Edit3 size={11} />
                {isRTL ? 'طلب تعديل' : 'Request Revision'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approved confirmed note */}
      {isVisible && (approvalStatus === 'APPROVED' || approvalStatus === 'AUTO_APPROVED') && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-xl text-[10px] font-black text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={12} />
          {isRTL ? 'تم الاعتماد واستلام هذه المرحلة بنجاح' : 'This stage has been approved and received'}
        </div>
      )}
    </div>
  );
};

// ─── Video Task Card ──────────────────────────────────────────────────────────
const ClientVideoCard = ({ task, customStages = [], isRTL, onFeedbackSubmit }) => {
  const [expanded, setExpanded] = useState(true);
  const meta = parseVideoMeta(task.description);

  const allStages = [
    { key: 'script',    matcher: ['script', 'سكريبت', 'اسكريبت', 'كتابة'], label: isRTL ? 'مرحلة السكريبت'       : 'Script',     icon: FileCode,   color: 'blue',    isPublish: false },
    { key: 'edit',      matcher: ['edit', 'مونتاج', 'تعديل'],            label: isRTL ? 'مرحلة المونتاج'       : 'Editing',    icon: Film,       color: 'purple',  isPublish: false },
    { key: 'thumbnail', matcher: ['thumbnail', 'صور', 'تصميم', 'بوستر'],  label: isRTL ? 'الصور المصغرة'        : 'Thumbnail',  icon: ImageIcon,  color: 'amber',   isPublish: false },
    { key: 'publish',   matcher: ['publish', 'نشر', 'مواعيد', 'جدول'],     label: isRTL ? 'مواعيد النشر'         : 'Schedule',   icon: Calendar,   color: 'emerald', isPublish: true  },
  ];

  const stagesList = (customStages && customStages.length > 0)
    ? allStages.filter(s => customStages.some(cs => s.matcher.some(m => cs.toLowerCase().includes(m))))
    : allStages;

  // Fallback to all stages if filter resulted in empty
  const activeStages = stagesList.length > 0 ? stagesList : allStages;

  return (
    <div className="bg-white dark:bg-[#0a0a0c]/80 border border-slate-100 dark:border-white/[0.05] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-lg shadow-brand-600/25">
          🎬
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-800 dark:text-white text-sm truncate">{task.title}</p>
          {task.deadline && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
              <Clock size={10} />
              {new Date(task.deadline).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
        {/* Stage summary dots */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {activeStages.map(s => {
            const st = meta[s.key] || {};
            const isVis = !!st.visible;
            const dotColor = !isVis ? 'bg-slate-200 dark:bg-white/10' :
              st.approvalStatus === 'APPROVED' || st.approvalStatus === 'AUTO_APPROVED' ? 'bg-emerald-500' :
              st.approvalStatus === 'REVISION_REQUESTED' ? 'bg-rose-500' : 'bg-amber-400';
            return <div key={s.key} className={`w-2 h-2 rounded-full ${dotColor}`} title={s.label} />;
          })}
        </div>
        <ChevronDown size={18} className={`text-slate-300 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Stage Cards Grid — Shows custom stages with accurate states */}
      {expanded && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
          {activeStages.map(s => (
            <StageCard
              key={s.key}
              stageKey={s.key}
              stageMeta={meta[s.key] || {}}
              stageLabel={s.label}
              stageIcon={s.icon}
              stageColor={s.color}
              taskId={task.id}
              isPublish={s.isPublish}
              isRTL={isRTL}
              onFeedbackSubmit={onFeedbackSubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ClientProjects = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContract, setActiveContract] = useState(null);
  // phaseTasks: { [phaseId]: task[] }
  const [phaseTasks, setPhaseTasks] = useState({});
  // Month Accordion State
  const [expandedPhases, setExpandedPhases] = useState({});

  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: prev[phaseId] === undefined ? false : !prev[phaseId]
    }));
  };

  const isPhaseOpen = (phaseId) => {
    if (expandedPhases[phaseId] !== undefined) return expandedPhases[phaseId];
    return true; // Default open
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([getProjectsAPI(), getContractsAPI()]);
      // getProjects returns array directly OR wrapped — handle both
      const rawProjects = pRes.data?.data || pRes.data || [];
      setProjects(Array.isArray(rawProjects) ? rawProjects : []);
      const myContracts = cRes.data?.data || cRes.data || [];
      if (myContracts.length > 0) {
        const latest = myContracts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        setActiveContract(latest);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://api.creziax.cloud', { transports: ['websocket'] });
    socket.on('task_updated', () => {
      fetchData(true);
      toast.success(t('video_status_updated'));
    });
    socket.on('workspace_updated', () => {
      fetchData(true);
    });
    return () => socket.disconnect();
  }, [fetchData, t]);

  // Optimistic update after client submits feedback
  const handleFeedbackSubmit = useCallback((taskId, updatedTask) => {
    if (!updatedTask) { fetchData(true); return; }
    setProjects(prev => prev.map(project => ({
      ...project,
      phases: (project.phases || []).map(phase => ({
        ...phase,
        tasks: (phase.tasks || []).map(t => t.id === taskId ? { ...t, description: updatedTask.description } : t),
      }))
    })));
  }, [fetchData]);

  const totalTasks = projects.reduce((a, p) => a + (p.phases?.reduce((b, ph) => b + (ph.tasks?.length || 0), 0) || 0), 0);
  const doneTasks = projects.reduce((a, p) => a + (p.phases?.reduce((b, ph) => b + (ph.tasks?.filter(t => t.status === 'DELIVERED').length || 0), 0) || 0), 0);

  return (
    <div className="space-y-16 md:space-y-24 animate-in fade-in duration-1000 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-12 md:py-20 border-b border-slate-100 dark:border-white/[0.05]">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[2rem] bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shadow-xl shadow-brand-500/5 transition-transform hover:rotate-3">
              <FolderKanban size={32} />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">
                {isRTL ? 'مشاريعي ومسار الإنتاج' : 'My Projects & Production'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-bold mt-6 opacity-80 italic leading-relaxed">
                {isRTL ? 'راجع واعتمد كل مرحلة في الوقت الفعلي' : 'Review & approve every stage in real-time'}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          {!loading && projects.length > 0 && (
            <div className="flex flex-wrap items-center gap-6 mt-4 px-1">
              <div className="flex items-center gap-2.5 text-sm font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-2xl">
                <FolderKanban size={16} className="text-brand-500" />
                <span>{projects.length} {isRTL ? 'مشروع' : 'Projects'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-2xl">
                <Film size={16} className="text-indigo-500" />
                <span>{totalTasks} {isRTL ? 'فيديو' : 'Videos'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                <CheckCircle2 size={16} />
                <span>{doneTasks} {isRTL ? 'منجز' : 'Done'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Contract Badge */}
        {activeContract && (
          <div className="flex-shrink-0">
            <div className="bg-slate-900 dark:bg-white text-white dark:text-black rounded-[2rem] p-6 shadow-2xl flex flex-col gap-2 min-w-[240px]">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                <Calendar size={12} />
                {t('contract_period')}
              </div>
              <div className="text-lg font-black tracking-tighter">
                {new Date(activeContract.startDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
                <span className="mx-2 opacity-40">→</span>
                {activeContract.endDate ? new Date(activeContract.endDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '∞'}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-brand-500">
                {t('active_since')} {new Date(activeContract.createdAt).getFullYear()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={44} className="animate-spin text-brand-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
            {isRTL ? 'جارٍ التزامن...' : 'Syncing...'}
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
            <AlertCircle size={36} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white">
            {isRTL ? 'لا توجد مشاريع بعد' : 'No Projects Yet'}
          </h3>
          <p className="text-slate-400 text-sm max-w-xs">
            {isRTL ? 'سيتم إضافة مشاريعك وفيديوهاتك هنا فور أن تبدأ الإنتاج.' : 'Your projects and videos will appear here once production starts.'}
          </p>
        </div>
      ) : (
        <div className="space-y-14">
          {projects.map((project, pIdx) => {
            const total = project.phases?.reduce((a, ph) => a + (ph.tasks?.length || 0), 0) || 0;
            const done = project.phases?.reduce((a, ph) => a + (ph.tasks?.filter(t => t.status === 'DELIVERED').length || 0), 0) || 0;
            const overallPct = total > 0 ? Math.round((done / total) * 100) : 0;

            // Sort phases from newest to oldest (latest month first)
            const sortedPhases = (project.phases || [])
              .slice()
              .sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt));

            // Check if project has any content at all
            const hasAnyTasks = sortedPhases.some(ph => (ph.tasks || []).length > 0);

            return (
              <div key={project.id} className="space-y-6">
                {/* Project header */}
                <div className="bg-white dark:bg-[#0a0a0c]/60 border border-slate-200 dark:border-white/[0.06] rounded-[2.5rem] p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        {isRTL ? 'مشروع' : 'PROJECT'} {String(pIdx + 1).padStart(2, '0')}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight mt-1">
                        {project.name}
                      </h2>
                    </div>
                    {/* Progress ring */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-white/[0.05]" />
                          <circle cx="40" cy="40" r="34" fill="none"
                            stroke={overallPct === 100 ? '#10b981' : '#6366f1'}
                            strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 34}`}
                            strokeDashoffset={`${2 * Math.PI * 34 * (1 - overallPct / 100)}`}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-lg font-black leading-none ${overallPct === 100 ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                            {overallPct}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{done}/{total}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {isRTL ? 'فيديو منجز' : 'Videos Done'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Publishing Schedule Section (Requirement 5) */}
                <PublishingScheduleSection projectId={project.id} isAdmin={false} isRTL={isRTL} />

                {/* Phases (Months) with Videos */}
                {!hasAnyTasks ? (
                  <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/[0.06] rounded-3xl p-10 text-center">
                    <p className="text-slate-400 text-sm font-bold">
                      {isRTL ? 'لا توجد فيديوهات بعد، يعمل الفريق على تجهيزها.' : 'No videos yet. The team is preparing them.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedPhases.map((phase, phIdx) => {
                      // Show all tasks in this phase/month
                      const currentPhaseTasks = phase.tasks || [];
                      if (currentPhaseTasks.length === 0) return null;
                      const isOpen = isPhaseOpen(phase.id);

                      return (
                        <div key={phase.id} className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/[0.06] rounded-3xl p-6 transition-all duration-300">
                          {/* Phase / Month Header with Accordion Toggle */}
                          <div
                            onClick={() => togglePhase(phase.id)}
                            className="flex items-center justify-between gap-4 p-2 -m-2 rounded-2xl cursor-pointer hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors select-none group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0 text-brand-500 group-hover:scale-105 transition-transform">
                                <Calendar size={16} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white tracking-widest uppercase truncate">
                                  {phase.name}
                                </h3>
                                {phase.startDate && (
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                                    {new Date(phase.startDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 flex-shrink-0">
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
                                {currentPhaseTasks.length} {isRTL ? 'فيديو' : 'videos'}
                              </span>
                              <button
                                type="button"
                                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-brand-500 transition-all flex items-center justify-center"
                                title={isOpen ? (isRTL ? 'طي الفيديوهات' : 'Collapse videos') : (isRTL ? 'فتح الفيديوهات' : 'Expand videos')}
                              >
                                <ChevronDown
                                  size={18}
                                  className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-500' : ''}`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Video Cards — Collapsible */}
                          {isOpen && (
                            <div className="space-y-4 pt-5 mt-3 border-t border-slate-100 dark:border-white/[0.04] animate-in slide-in-from-top-2 duration-300">
                              {currentPhaseTasks.map(task => (
                                <ClientVideoCard
                                  key={task.id}
                                  task={task}
                                  customStages={project.client?.productionStages || []}
                                  isRTL={isRTL}
                                  onFeedbackSubmit={handleFeedbackSubmit}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientProjects;
