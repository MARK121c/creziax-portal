import { useEffect, useState, useCallback } from 'react';
import { getProjectsAPI, getContractsAPI } from '../../store/api';
import { submitClientFeedbackAPI } from '../../store/api';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  FolderKanban, Loader2, CheckCircle2, Film, AlertCircle,
  Calendar, FileCode, Image as ImageIcon, ExternalLink,
  Clock, ChevronDown, ThumbsUp, Edit3, X, Send
} from 'lucide-react';

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
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
      status === 'APPROVED'
        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25'
        : 'bg-rose-500/15 text-rose-600 border border-rose-500/25'
    }`}>
      {status === 'APPROVED' ? <><CheckCircle2 size={9} /> تم الاعتماد</> : <><Edit3 size={9} /> مطلوب تعديل</>}
    </span>
  );
};

// ─── Stage Card with Feedback Controls ───────────────────────────────────────
const StageCard = ({ stageKey, stageMeta, stageLabel, stageIcon: Icon, stageColor, taskId, isPublish, onFeedbackSubmit }) => {
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      toast.success('تم الاعتماد بنجاح ✓');
      onFeedbackSubmit(taskId, res.data?.data);
    } catch (_) { toast.error('فشل إرسال الاعتماد'); }
    finally { setSubmitting(false); }
  };

  const handleRevisionSubmit = async () => {
    if (!revisionNote.trim()) return toast.error('اكتب ملاحظات التعديل أولاً');
    setSubmitting(true);
    try {
      const res = await submitClientFeedbackAPI(taskId, {
        stage: stageKey,
        approvalStatus: 'REVISION_REQUESTED',
        clientNotes: revisionNote.trim(),
      });
      toast.success('تم إرسال طلب التعديل للفريق ✏️');
      onFeedbackSubmit(taskId, res.data?.data);
      setShowRevisionBox(false);
      setRevisionNote('');
    } catch (_) { toast.error('فشل إرسال الملاحظات'); }
    finally { setSubmitting(false); }
  };

  const colorMap = {
    blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', icon: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', heading: 'text-blue-700 dark:text-blue-300' },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', icon: 'bg-purple-500/15 text-purple-600 dark:text-purple-400', heading: 'text-purple-700 dark:text-purple-300' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', heading: 'text-amber-700 dark:text-amber-300' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', heading: 'text-emerald-700 dark:text-emerald-300' },
  };
  const c = colorMap[stageColor] || colorMap.blue;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${c.bg} ${c.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
            <Icon size={15} />
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${c.heading}`}>{stageLabel}</p>
            {clientNotes && approvalStatus === 'REVISION_REQUESTED' && (
              <p className="text-[9px] text-rose-500 font-bold mt-0.5 max-w-[180px] truncate">{clientNotes}</p>
            )}
          </div>
        </div>
        <ApprovalBadge status={approvalStatus} />
      </div>

      {/* Value display */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 bg-white dark:bg-black/20 rounded-xl px-3 py-2 border border-slate-100 dark:border-white/5">
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
            {isPublish && value
              ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
              : value || 'جاهز للمراجعة'}
          </p>
        </div>
        {!isPublish && value && (
          <a href={value} target="_blank" rel="noopener noreferrer"
            className="p-2 bg-white dark:bg-white/5 text-slate-400 hover:text-brand-500 border border-slate-200 dark:border-white/10 rounded-xl transition-all flex-shrink-0">
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Feedback Actions — only if PENDING or REVISION_REQUESTED */}
      {approvalStatus !== 'APPROVED' && (
        <div className="space-y-2 pt-1">
          {/* Revision note box */}
          {showRevisionBox && (
            <div className="bg-white dark:bg-black/20 rounded-xl border border-rose-200 dark:border-rose-500/20 p-3 space-y-2">
              <textarea
                value={revisionNote}
                onChange={e => setRevisionNote(e.target.value)}
                placeholder="اكتب ملاحظاتك للفريق بالتفصيل..."
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
                  إرسال الملاحظات
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
                تأكيد واستلام
              </button>
              {/* ✏️ Request revision button */}
              <button
                onClick={() => setShowRevisionBox(true)}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-white/5 text-rose-500 border border-rose-300 dark:border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                <Edit3 size={11} />
                طلب تعديل
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approved confirmed note */}
      {approvalStatus === 'APPROVED' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-xl text-[10px] font-black text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={12} />
          تم الاعتماد واستلام هذه المرحلة
        </div>
      )}
    </div>
  );
};

// ─── Video Task Card ──────────────────────────────────────────────────────────
const ClientVideoCard = ({ task, isRTL, onFeedbackSubmit }) => {
  const [expanded, setExpanded] = useState(true);
  const meta = parseVideoMeta(task.description);

  const stagesList = [
    { key: 'script',    label: isRTL ? 'السكريبت'      : 'Script',     icon: FileCode,   color: 'blue',    isPublish: false },
    { key: 'edit',      label: isRTL ? 'المونتاج'      : 'Editing',    icon: Film,       color: 'purple',  isPublish: false },
    { key: 'thumbnail', label: isRTL ? 'الصورة المصغرة': 'Thumbnail',  icon: ImageIcon,  color: 'amber',   isPublish: false },
    { key: 'publish',   label: isRTL ? 'موعد النشر'    : 'Schedule',   icon: Calendar,   color: 'emerald', isPublish: true  },
  ];

  const visibleStages = stagesList.filter(s => !!meta[s.key]?.visible);
  if (visibleStages.length === 0) return null;

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
          {stagesList.map(s => {
            const st = meta[s.key];
            if (!st?.visible) return <div key={s.key} className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10" />;
            const dotColor = st.approvalStatus === 'APPROVED' ? 'bg-emerald-500' : st.approvalStatus === 'REVISION_REQUESTED' ? 'bg-rose-500' : 'bg-amber-400';
            return <div key={s.key} className={`w-2 h-2 rounded-full ${dotColor}`} title={s.label} />;
          })}
        </div>
        <ChevronDown size={18} className={`text-slate-300 flex-shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Stage Cards Grid */}
      {expanded && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
          {visibleStages.map(s => (
            <StageCard
              key={s.key}
              stageKey={s.key}
              stageMeta={meta[s.key]}
              stageLabel={s.label}
              stageIcon={s.icon}
              stageColor={s.color}
              taskId={task.id}
              isPublish={s.isPublish}
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

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([getProjectsAPI(), getContractsAPI()]);
      setProjects(pRes.data?.data || pRes.data || []);
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

            // Collect all tasks with at least one visible stage
            const allVisibleTasks = (project.phases || [])
              .sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt))
              .flatMap(ph => (ph.tasks || []).map(t => ({ ...t, phaseName: ph.name })))
              .filter(task => {
                try {
                  const m = JSON.parse(task.description || '{}');
                  return ['script', 'edit', 'thumbnail', 'publish'].some(k => m[k]?.visible);
                } catch (_) { return false; }
              });

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

                {/* Video Cards */}
                <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/[0.06] rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Film size={18} className="text-slate-400" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-widest uppercase">
                      {isRTL ? 'فيديوهات المشروع' : 'Project Videos'}
                    </h3>
                  </div>

                  {allVisibleTasks.length > 0 ? (
                    <div className="space-y-4">
                      {allVisibleTasks.map(task => (
                        <ClientVideoCard
                          key={task.id}
                          task={task}
                          isRTL={isRTL}
                          onFeedbackSubmit={handleFeedbackSubmit}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-sm font-bold">
                      {isRTL ? 'لا توجد مراحل متاحة للمراجعة بعد، يعمل الفريق على تجهيزها.' : 'No stages ready for review yet. The team is preparing them.'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientProjects;
