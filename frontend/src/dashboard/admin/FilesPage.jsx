import { useEffect, useState } from 'react';
import { getFilesAPI, uploadFileAPI, deleteFileAPI, getProjectsAPI } from '../../store/api';
import { FileText, Upload, Trash2, X } from 'lucide-react';

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const [pRes, fRes] = await Promise.all([getProjectsAPI(), getFilesAPI('')]);
      setProjects(pRes.data);
      setFiles(fRes.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !projectId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('projectId', projectId);
    formData.append('fileType', 'DOCUMENT');
    try {
      await uploadFileAPI(formData);
      setSelectedFile(null);
      fetchData();
    } catch {}
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return;
    try { await deleteFileAPI(id); fetchData(); } catch {}
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Files</h1>
        <p className="text-gray-500 text-sm">Project assets and documents</p>
      </div>

      {/* Upload Box */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase mb-4">Upload File</h2>
        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4">
          <select value={projectId} onChange={e => setProjectId(e.target.value)} required className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/50">
            <option value="">Select Project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="file" onChange={e => setSelectedFile(e.target.files[0])} required className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer" />
          <button type="submit" disabled={uploading} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50">
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {/* File List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map(f => (
          <div key={f.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{f.originalName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{f.project?.name} • {(f.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => handleDelete(f.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        ))}
        {files.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No files uploaded yet</p>}
      </div>
    </div>
  );
};

export default FilesPage;
