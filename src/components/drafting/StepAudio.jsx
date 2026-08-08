import React, { useState } from 'react';
import { Upload, Loader2, Music, Link2, Play } from 'lucide-react';

export default function StepAudio({ onNext }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setLoadingType('url');
    
    // Simulate processing
    setTimeout(() => {
      onNext({
        id: 'audio-yt-123',
        source: url,
        duration: 180,
        type: 'youtube'
      });
      setLoading(false);
    }, 2000);
  };

  const handleFileUpload = () => {
    setLoading(true);
    setLoadingType('upload');
    
    // Simulate processing
    setTimeout(() => {
      onNext({
        id: 'audio-file-456',
        source: 'uploaded-file.mp3',
        duration: 215,
        type: 'file'
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="step-content glass">
      <div className="step-audio-form">
        <form onSubmit={handleUrlSubmit} className="form-group">
          <label>Import from YouTube</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Paste YouTube URL here..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ flex: 1 }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !url}
            >
              {loading && loadingType === 'url' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Play size={18} />
              )}
              Import
            </button>
          </div>
        </form>

        <div className="divider">OR</div>

        <div className="form-group">
          <label>Upload Audio File</label>
          <div className="upload-zone" onClick={!loading ? handleFileUpload : undefined} style={{ opacity: loading ? 0.5 : 1 }}>
            {loading && loadingType === 'upload' ? (
              <>
                <Loader2 size={32} className="animate-spin" />
                <span>Processing audio...</span>
              </>
            ) : (
              <>
                <Upload size={32} />
                <span>Click or drag file to upload</span>
                <span style={{ fontSize: '0.75rem' }}>Supports MP3, WAV, M4A</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
