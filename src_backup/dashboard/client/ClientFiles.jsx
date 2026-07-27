import { useEffect, useState, useCallback } from 'react';
import { getProjectsAPI } from '../../store/api';
import { Briefcase, Search, Loader2, Link as LinkIcon, Palette, Type, LayoutGrid, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ClientFiles = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjectsAPI();
      setProjects(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load projects/files:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProjects = projects.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFormattedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
    return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight uppercase flex items-center gap-4">
            <span className="w-2 md:w-3 h-8 md:h-12 bg-brand-500 rounded-full"></span>
            {t('my_files', 'ملفاتي المشتركة')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] mt-3 opacity-80">
            {t('client_files_desc', 'الوصول السريع لملفات المشاريع')}
          </p>
        </div>
        
        <div className="relative group flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder={t('search_project', "بحث عن مشروع...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-16 pl-8 py-4 md:py-5 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] text-sm font-black focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all w-full sm:w-80 shadow-sm backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 md:py-48">
          <Loader2 size={48} className="animate-spin text-brand-500 mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">{t('syncing', 'جاري الوصول للملفات...')}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[3rem] shadow-sm flex flex-col items-center justify-center py-32 md:py-48 text-center px-10 backdrop-blur-3xl">
          <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100 dark:border-white/10">
            <FileText size={32} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3">{t('no_projects_found', 'لا يوجد مشاريع')}</h3>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{t('no_projects_desc', 'لم يتم إضافة مشاريع أو ملفات لحسابك بعد.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredProjects.map(p => (
            <div key={p.id} className="group bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-500 backdrop-blur-3xl flex flex-col h-full hover:border-brand-500/30">
              
              {/* Card Header (Logo & Name) */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                  {p.logoUrl ? (
                    <img src={getFormattedUrl(p.logoUrl)} className="w-full h-full object-cover" alt={p.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-black text-slate-300 dark:text-slate-700 uppercase">
                      {(p.name || '?')[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight truncate group-hover:text-brand-500 transition-colors">{p.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description / Notes */}
              <div className="mb-6 flex-1">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {p.description || t('no_notes', 'لا يوجد ملاحظات مسجلة لهذا المشروع.')}
                </p>
              </div>

              {/* Brand Kit Section */}
              <div className="bg-slate-50 dark:bg-[#121215] rounded-2xl p-4 mb-6 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand Kit</span>
                  {p.brandFonts ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Type size={12} className="text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 max-w-[100px] truncate">{p.brandFonts}</span>
                    </div>
                  ) : <span className="text-[10px] font-bold text-slate-400 italic">No Fonts</span>}
                </div>
                
                <div className="flex items-center gap-1">
                  {p.brandColors ? p.brandColors.split(',').slice(0, 4).map((color, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color.trim() }}></div>
                  )) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                      <Palette size={14} className="text-slate-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button (Google Drive Link) */}
              <div className="mt-auto">
                {p.driveUrl ? (
                  <a 
                    href={p.driveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-brand-600/20 group/btn"
                  >
                    <Briefcase size={16} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                    {t('open_drive', 'فتح ملفات المشروع')}
                  </a>
                ) : (
                  <div className="w-full flex items-center justify-center gap-3 py-4 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest cursor-not-allowed">
                    <LinkIcon size={16} />
                    {t('link_not_available', 'الرابط غير متوفر')}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientFiles;
