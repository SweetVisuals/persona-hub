import { useState, useEffect, useRef } from 'react';
import { Folder, File as FileIcon, Image as ImageIcon, Music, Video, Plus, UploadCloud, Search, MoreVertical, Trash2, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TranscriptionModal from './TranscriptionModal';
import './FilePanel.css';

export default function FilePanel({ onFileClick }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Audio');
  const [uploading, setUploading] = useState(false);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Transcription Modal State
  const [transcribeFile, setTranscribeFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFiles();
    
    // Close context menu on click outside
    const closeMenu = () => setContextMenu(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false });
    if (data) setFiles(data);
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage.from('content_files').upload(filePath, file);

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      setUploading(false);
      return;
    }

    // Insert into DB
    const { data: publicUrlData } = supabase.storage.from('content_files').getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('files').insert({
      name: file.name,
      type: 'file',
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      url: publicUrlData.publicUrl
    });

    if (!dbError) {
      fetchFiles();
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id, fileUrl) => {
    if (fileUrl) {
      // Extract path from public URL
      const urlParts = fileUrl.split('/content_files/');
      if (urlParts.length > 1) {
        const path = urlParts[1];
        await supabase.storage.from('content_files').remove([path]);
      }
    }
    await supabase.from('files').delete().eq('id', id);
    fetchFiles();
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const getTranscriptText = (fileId) => {
    return localStorage.getItem(`transcript_${fileId}`);
  };

  const handleDragStart = (e, file) => {
    e.dataTransfer.setData('application/json', JSON.stringify(file));
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['mp4', 'mov', 'avi'].includes(ext)) return <Video size={16} className="file-icon video" />;
    if (['mp3', 'wav', 'm4a'].includes(ext)) return <Music size={16} className="file-icon audio" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon size={16} className="file-icon image" />;
    if (ext === 'slide') return <Smartphone size={16} className="file-icon slide" style={{ color: "var(--accent)" }} />;
    return <FileIcon size={16} className="file-icon text" />;
  };

  const getCategoryFiles = () => {
    if (activeCategory === 'All') return files;
    if (activeCategory === 'Video') return files.filter(f => ['mp4', 'mov', 'avi'].includes(f.name.split('.').pop().toLowerCase()));
    if (activeCategory === 'Audio') return files.filter(f => ['mp3', 'wav', 'm4a'].includes(f.name.split('.').pop().toLowerCase()));
    if (activeCategory === 'Image') return files.filter(f => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f.name.split('.').pop().toLowerCase()));
    if (activeCategory === 'Slideshow') return files.filter(f => ['ppt', 'pptx', 'key', 'pdf', 'slideshow', 'slide'].includes(f.name.split('.').pop().toLowerCase()));
    return files;
  };

  const filteredFiles = getCategoryFiles().filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="panel-container">
      <div className="panel-header">
        Project Files
        <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Upload File">
          <Plus size={16} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
        />
      </div>

      <div className="panel-search">
        <Search size={14} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search files..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="file-categories">
        {['All', 'Video', 'Audio', 'Image', 'Slideshow'].map(cat => (
          <button 
            key={cat} 
            className={`file-cat-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="panel-content file-list">
        {uploading && (
          <div className="file-item uploading">
            <UploadCloud size={16} className="spin" />
            <span className="file-name">Uploading...</span>
          </div>
        )}

        {loading && files.length === 0 ? (
          <div className="empty-state">Loading...</div>
        ) : filteredFiles.length === 0 && !uploading ? (
          <div className="empty-state">No files found.</div>
        ) : (
          filteredFiles.map(file => (
            <div 
              key={file.id} 
              className="file-item"
              onClick={() => onFileClick && onFileClick(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
              onDragStart={(e) => handleDragStart(e, file)}
              draggable
            >
              {getFileIcon(file.name)}
              <div className="file-details">
                <span className="file-name" title={file.name}>{file.name}</span>
                <span className="file-size">{file.size}</span>
              </div>
              <div className="file-hover-actions">
                {['mp3', 'wav', 'm4a', 'mp4', 'mov'].includes(file.name.split('.').pop().toLowerCase()) && (
                  <button 
                    className="hover-action-btn" 
                    onClick={(e) => { e.stopPropagation(); setTranscribeFile(file); }}
                    title={getTranscriptText(file.id) ? "View Transcript" : "Transcribe"}
                  >
                    {getTranscriptText(file.id) ? 'View Aa' : 'Aa'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && selectedFile && (
        <div 
          className="context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {['mp3', 'wav', 'm4a'].includes(selectedFile.name.split('.').pop().toLowerCase()) && (
            <button onClick={() => { setTranscribeFile(selectedFile); setContextMenu(null); }}>
              Transcribe Audio
            </button>
          )}
          <button onClick={() => { handleDelete(selectedFile.id, selectedFile.url); setContextMenu(null); }} className="danger">
            <Trash2 size={14} style={{ marginRight: 6 }} /> Delete
          </button>
        </div>
      )}

      {/* Transcription Modal */}
      {transcribeFile && (
        <TranscriptionModal 
          file={transcribeFile} 
          onClose={() => setTranscribeFile(null)} 
        />
      )}
    </div>
  );
}
