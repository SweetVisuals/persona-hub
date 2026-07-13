import { NavLink } from 'react-router-dom';
import { 
  ArrowLeft, MousePointer2, Crop, Type, Trash2,
  Undo, Redo, ZoomIn, ZoomOut, Maximize, 
  Smartphone, Tablet, Monitor, Play, Pause, Download, Share2, Settings as SettingsIcon 
} from 'lucide-react';
import './EditorTopbar.css';

export default function EditorTopbar({ 
  device, setDevice, activeFile, fileMetadata, setFileMetadata, 
  isPlaying, setIsPlaying, clips, setClips, layers, setLayers, selectedClipId, setSelectedClipId, currentTime,
  projectTitle, setProjectTitle, undo, redo, canUndo, canRedo, zoomIn, zoomOut, zoomFit, zoomLevel
}) {
  const isImage = activeFile && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(activeFile.name.split('.').pop().toLowerCase());
  
  const currentMetadata = activeFile ? fileMetadata[activeFile.id] || {} : {};
  const currentRatio = currentMetadata.aspectRatio || 'original';

  const setRatio = (ratio) => {
    if (!activeFile) return;
    setFileMetadata({
      ...fileMetadata,
      [activeFile.id]: { ...currentMetadata, aspectRatio: ratio }
    });
  };

  const selectedClip = clips?.find(c => c.id === selectedClipId);
  const isTextSelected = selectedClip?.type === 'text';

  const handleAddText = () => {
    const textLayerId = Date.now();
    const newTrack = { id: textLayerId, name: `Text Track ${layers ? layers.length + 1 : 1}`, type: 'text', color: '#f59e0b', visible: true, locked: false };
    if (setLayers) setLayers([...(layers || []), newTrack]);

    const textClip = {
      id: Date.now() + 1,
      layerId: textLayerId,
      type: 'text',
      name: 'New Text',
      text: 'New Text',
      font: 'TikTok Sans',
      color: '#ffffff',
      start: currentTime * 30, // Default to 30 as base mapping
      width: 150
    };
    setClips([...(clips || []), textClip]);
    setSelectedClipId(textClip.id);
  };

  const updateTextClip = (updates) => {
    if (!selectedClipId) return;
    setClips(clips.map(c => c.id === selectedClipId ? { ...c, ...updates, name: updates.text || c.name } : c));
  };

  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    setClips(clips.filter(c => c.id !== selectedClipId));
    setSelectedClipId(null);
  };

  return (
    <div className="editor-topbar">
      {/* Left Cluster */}
      <div className="topbar-cluster left-cluster">
        <NavLink to="/" className="icon-btn back-btn" title="Back to Dashboard">
          <ArrowLeft size={18} />
        </NavLink>
        <div className="project-info">
          <input 
            type="text" 
            className="project-title-input" 
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            title="Click to rename"
          />
          <div className="save-status">
            <span className="status-dot saved"></span>
            <span className="status-text">Saved</span>
          </div>
        </div>
      </div>

      {/* Center Cluster: Tools */}
      <div className="topbar-cluster center-cluster">
        <div className="tool-group">
          <button className="icon-btn active" title="Select (V)"><MousePointer2 size={16} /></button>
          <button className={`icon-btn ${isImage ? 'active-tool' : ''}`} disabled={!isImage} title="Crop Image (C)">
            <Crop size={16} />
          </button>
          <button className="icon-btn" title="Add Text (T)" onClick={handleAddText}>
            <Type size={16} />
          </button>
          <button className="icon-btn" title="Delete Clip" onClick={handleDeleteClip} disabled={!selectedClipId}>
            <Trash2 size={16} />
          </button>
        </div>
        
        {isImage && !isTextSelected && (
          <>
            <div className="divider"></div>
            <div className="tool-group ratio-group">
              <span className="tool-label">Crop:</span>
              <button className={`text-btn ${currentRatio === 'original' ? 'active' : ''}`} onClick={() => setRatio('original')}>Original</button>
              <button className={`text-btn ${currentRatio === '1:1' ? 'active' : ''}`} onClick={() => setRatio('1:1')}>1:1</button>
              <button className={`text-btn ${currentRatio === '4:5' ? 'active' : ''}`} onClick={() => setRatio('4:5')}>4:5</button>
              <button className={`text-btn ${currentRatio === '9:16' ? 'active' : ''}`} onClick={() => setRatio('9:16')}>9:16</button>
              <button className={`text-btn ${currentRatio === '16:9' ? 'active' : ''}`} onClick={() => setRatio('16:9')}>16:9</button>
            </div>
          </>
        )}

        {isTextSelected && (
          <>
            <div className="divider"></div>
            <div className="tool-group text-format-group">
              <input 
                type="text" 
                value={selectedClip.text} 
                onChange={(e) => updateTextClip({ text: e.target.value })}
                className="text-edit-input"
                placeholder="Enter text..."
              />
              <select 
                value={selectedClip.font || 'TikTok Sans'} 
                onChange={(e) => updateTextClip({ font: e.target.value })}
                className="font-select"
              >
                <option value="TikTok Sans">TikTok Sans</option>
                <option value="Inter">Inter</option>
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
              </select>
              <input 
                type="color" 
                value={selectedClip.color || '#ffffff'} 
                onChange={(e) => updateTextClip({ color: e.target.value })}
                className="color-picker"
                title="Text Color"
              />
            </div>
          </>
        )}
        
        <div className="divider"></div>
        
        <div className="tool-group">
          <button className={`icon-btn ${isPlaying ? 'active' : ''}`} onClick={() => setIsPlaying(!isPlaying)} title="Play / Pause">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
        
        <div className="divider"></div>
        
        <div className="tool-group">
          <button className="icon-btn" title="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo} style={{ opacity: canUndo ? 1 : 0.5 }}><Undo size={16} /></button>
          <button className="icon-btn" title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo} style={{ opacity: canRedo ? 1 : 0.5 }}><Redo size={16} /></button>
        </div>
        
        <div className="divider"></div>
        
        <div className="tool-group">
          <button className="icon-btn" title="Zoom Out" onClick={zoomOut}><ZoomOut size={16} /></button>
          <span className="zoom-level">{zoomLevel}%</span>
          <button className="icon-btn" title="Zoom In" onClick={zoomIn}><ZoomIn size={16} /></button>
          <button className="icon-btn" title="Fit to Screen" onClick={zoomFit}><Maximize size={16} /></button>
        </div>
      </div>

      {/* Right Cluster */}
      <div className="topbar-cluster right-cluster">
        <div className="tool-group device-toggles">
          <button className={`icon-btn ${device === 'phone' ? 'active' : ''}`} onClick={() => setDevice('phone')} title="Phone Preview"><Smartphone size={16} /></button>
          <button className={`icon-btn ${device === 'tablet' ? 'active' : ''}`} onClick={() => setDevice('tablet')} title="Tablet Preview"><Tablet size={16} /></button>
          <button className={`icon-btn ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')} title="Desktop Preview"><Monitor size={16} /></button>
        </div>
        
        <div className="divider"></div>
        
        <button className="icon-btn" title="Settings"><SettingsIcon size={18} /></button>
        <button className="action-btn share-btn" title="Share Project"><Share2 size={16} /> Share</button>
        <button className="action-btn play-btn" title="Play Preview" onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />} {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="action-btn export-btn" title="Export Content" onClick={() => {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ projectTitle, clips, fileMetadata }));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", projectTitle + ".json");
          document.body.appendChild(downloadAnchorNode); // required for firefox
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
        }}>
          <Download size={16} /> Export
        </button>
      </div>
    </div>
  );
}
