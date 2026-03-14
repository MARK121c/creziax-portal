import { useEffect, useState } from 'react';
import { getFilesAPI, uploadFileAPI, deleteFileAPI, getProjectsAPI } from '../../store/api';
import { FileText, Upload, Trash2, X, Search, Folder, Cloud, HardDrive, Download, MoreVertical, Loader2, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const FilesPage = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, fRes] = await Promise.all([getProjectsAPI(), getFilesAPI('')]);
      setProjects(pRes.data);
      setFiles(fRes.data);
    } catch (err) {
      toast.error('Failed to sync repository.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !projectId) {
      toast.error('Please select both project and file.');
      return;
    }
    
    setUploading(true);
    const loadingToast = toast.loading('Uploading asset...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('projectId', projectId);
    formData.append('fileType', 'DOCUMENT');
    
    try {
      await uploadFileAPI(formData);
      toast.success('Asset synchronized successfully.', { id: loadingToast });
      setSelectedFile(null);
      e.target.reset();
      fetchData();
    } catch (err) {
      toast.error('Transmission failed.', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Permanently remove ${name}?`)) return;
    const loadingToast = toast.loading('Removing asset...');
    try { 
      await deleteFileAPI(id); 
      toast.success('Asset purged.', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Purge failed.', { id: loadingToast });
    }
  };

  const filteredFiles = files.filter(f => 
    f.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.project?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight italic uppercase">{t('asset_vault')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-lg italic border-l-4 border-brand-500/20 pl-4">{t('manage_assets')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Filter assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-80 shadow-sm font-bold italic"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Upload Terminal */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/20 dark:shadow-none sticky top-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20">
                <Cloud size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">{t('upload_terminal')}</h2>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('target_project')}</label>
                <select 
                  value={projectId} 
                  onChange={e => setProjectId(e.target.value)} 
                  required 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('asset_file')}</label>
                <div className="relative group/file">
                  <input 
                    type="file" 
                    onChange={e => setSelectedFile(e.target.files[0])} 
                    required 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="w-full px-5 py-8 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 group-hover/file:border-brand-500/30 transition-all bg-slate-50/50 dark:bg-white/[0.02]">
                    <Upload size={24} className="text-slate-300 dark:text-slate-600 group-hover/file:text-brand-500" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">
                      {selectedFile ? selectedFile.name : t('drop_files_here')}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={uploading} 
                className="w-full py-5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-white/5 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {uploading ? 'Processing...' : t('synchronize_asset')}
              </button>
            </form>
          </div>
        </div>

        {/* Repository Grid */}
        <div className="xl:col-span-2">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-40 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem]">
               <Loader2 size={40} className="animate-spin text-brand-500 mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing Vault...</p>
             </div>
           ) : filteredFiles.length === 0 ? (
             <div className="bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] py-32 text-center">
                <HardDrive size={60} className="text-slate-200 dark:text-slate-700 mx-auto mb-6" />
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">{t('vault_empty')}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 italic">Awaiting your first production asset.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredFiles.map(f => (
                  <div key={f.id} className="group bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-xl shadow-slate-200/20 dark:shadow-none hover:border-brand-500/30 transition-all duration-300 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate group-hover:text-brand-600 transition-colors italic">{f.originalName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{f.project?.name || 'Global'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                          <span className="text-[9px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-widest">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">{new Date(f.createdAt).toLocaleDateString()}</p>
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-300 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-all">
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(f.id, f.originalName)} 
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
