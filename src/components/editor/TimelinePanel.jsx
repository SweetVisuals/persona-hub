import { useState } from 'react';
import { ChevronUp, ChevronDown, Eye, Lock, Unlock, EyeOff, Video, Music, Type } from 'lucide-react';
import './TimelinePanel.css';

export default function TimelinePanel({ collapsed, onToggleCollapse, clips, setClips, layers, setLayers, currentTime, setCurrentTime, isPlaying, selectedClipId, setSelectedClipId, pixelsPerSecond }) {
  
  const toggleVisibility = (id) => {
    setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };
  
  const toggleLock = (id) => {
    setLayers(layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const addTrack = () => {
    const newId = Date.now();
    setLayers([...layers, { id: newId, name: `Track ${layers.length + 1}`, type: 'video', color: '#3b82f6', visible: true, locked: false }]);
  };

  const deleteTrack = (id) => {
    setLayers(layers.filter(l => l.id !== id));
    setClips(clips.filter(c => c.layerId !== id));
  };

  const getLayerIcon = (type) => {
    if (type === 'video') return <Video size={14} />;
    if (type === 'audio') return <Music size={14} />;
    return <Type size={14} />;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, layerId) => {
    e.preventDefault();
    const fileData = e.dataTransfer.getData('application/json');
    if (!fileData) return;
    
    try {
      const file = JSON.parse(fileData);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - rect.left;

      const isSlideshowExt = ['ppt', 'pptx', 'key', 'pdf', 'slideshow'].includes(file.name.split('.').pop().toLowerCase());

      if (isSlideshowExt) {
        const imageLayerId = Date.now();
        const textLayerId = Date.now() + 1;
        
        // Add new layers. Text layer goes first so it renders above the image layer visually.
        setLayers([
          ...layers,
          { id: textLayerId, name: `${file.name.split('.')[0]} Text`, type: 'text', color: '#f59e0b', visible: true, locked: false },
          { id: imageLayerId, name: `${file.name.split('.')[0]} Images`, type: 'video', color: '#3b82f6', visible: true, locked: false }
        ]);

        const slideClips = [];
        for (let i = 0; i < 3; i++) {
          const startPos = Math.max(0, dropX) + (i * 120);
          
          // Image Clip
          slideClips.push({
            id: Date.now() + 100 + i,
            layerId: imageLayerId,
            fileId: file.id,
            name: `Slide ${i + 1}`,
            type: 'slideshow_slide',
            start: startPos,
            width: 120,
            url: file.metadata?.slides?.[i]
          });
          
          // Text Clip
          slideClips.push({
            id: Date.now() + 200 + i,
            layerId: textLayerId,
            type: 'text',
            name: `Slide ${i + 1} Text`,
            text: `Slide ${i + 1} Caption`,
            font: 'Inter',
            color: '#ffffff',
            x: 50,
            y: 50,
            start: startPos,
            width: 120
          });
        }
        setClips([...clips, ...slideClips]);
      } else {
        let targetLayerId = layerId;
        let newLayers = [...layers];
        if (!targetLayerId) {
          // Auto-create track if dropped in empty area
          targetLayerId = Date.now();
          const newTrack = { id: targetLayerId, name: `Track ${newLayers.length + 1}`, type: file.type === 'audio' ? 'audio' : 'video', color: '#3b82f6', visible: true, locked: false };
          newLayers.push(newTrack);
          setLayers(newLayers);
        }

        const newClip = {
          id: Date.now(),
          layerId: targetLayerId,
          fileId: file.id,
          name: file.name,
          type: file.type || (file.name.endsWith('.png') || file.name.endsWith('.jpg') ? 'image' : 'video'),
          start: Math.max(0, dropX),
          width: 150
        };
        setClips([...clips, newClip]);
      }
    } catch (err) {
      console.error("Failed to parse dropped file", err);
    }
  };

  const handleRulerMouseDown = (e) => {
    const updateTime = (eMove) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, eMove.clientX - rect.left);
      setCurrentTime(x / pixelsPerSecond);
    };
    updateTime(e);
    
    const handleMouseMove = (eMove) => updateTime(eMove);
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleClipMouseDown = (e, clipId) => {
    e.stopPropagation();
    setSelectedClipId(clipId);
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const startX = e.clientX;
    const startLeft = clip.start;
    const startWidth = clip.width;
    
    // Check if dragging left edge or right edge for trimming
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const isTrimmingLeft = offsetX < 10;
    const isTrimmingRight = offsetX > rect.width - 10;

    const handleMouseMove = (eMove) => {
      const deltaX = eMove.clientX - startX;
      setClips(prev => prev.map(c => {
        if (c.id === clipId) {
          if (isTrimmingRight) {
            return { ...c, width: Math.max(10, startWidth + deltaX) };
          } else if (isTrimmingLeft) {
            const newStart = Math.max(0, startLeft + deltaX);
            const newWidth = Math.max(10, startWidth - (newStart - startLeft));
            return { ...c, start: newStart, width: newWidth };
          } else {
            // Moving clip
            return { ...c, start: Math.max(0, startLeft + deltaX) };
          }
        }
        return c;
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="timeline-container">
      <div className="panel-header timeline-header">
        <span>Timeline</span>
        <button className="icon-btn" onClick={onToggleCollapse}>
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {!collapsed && (
        <div className="timeline-body">
          {/* Left: Layers */}
          <div className="layers-panel">
            <div className="timeline-ruler-corner">
              00:00:00:00
            </div>
            <div className="layers-list">
              {layers.map(layer => (
                <div key={layer.id} className="layer-row">
                  <div className="layer-controls">
                    <button className="layer-btn" onClick={() => toggleVisibility(layer.id)} title="Toggle Visibility">
                      {layer.visible ? <Eye size={12} /> : <EyeOff size={12} className="dim" />}
                    </button>
                    <button className="layer-btn" onClick={() => toggleLock(layer.id)} title="Lock Track">
                      {layer.locked ? <Lock size={12} /> : <Unlock size={12} className="dim" />}
                    </button>
                    <button className="layer-btn danger-hover" onClick={() => deleteTrack(layer.id)} title="Delete Track" style={{ marginLeft: 'auto' }}>
                      <span style={{ fontSize: 10 }}>×</span>
                    </button>
                  </div>
                  <div className="layer-name">
                    <span className="layer-color" style={{ background: layer.color }}></span>
                    {getLayerIcon(layer.type)}
                    <span className="name-text">{layer.name}</span>
                  </div>
                </div>
              ))}
              <div className="add-track-row" onClick={addTrack}>
                <span className="add-track-text">+ Add Track</span>
              </div>
            </div>
          </div>

          {/* Right: Tracks */}
          <div className="tracks-panel">
            <div className="timeline-ruler" onMouseDown={handleRulerMouseDown} style={{ cursor: 'text' }}>
              {/* Mock Ruler Marks */}
              {[...Array(50)].map((_, i) => (
                <div key={i} className="ruler-mark" style={{ width: pixelsPerSecond * 5 }}>
                  00:{(i * 5).toString().padStart(2, '0')}
                </div>
              ))}
              <div className="playhead" style={{ left: currentTime * pixelsPerSecond }}>
                <div className="playhead-top"></div>
                <div className="playhead-line"></div>
              </div>
            </div>
            
            <div className="tracks-area" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, null)}>
              {layers.map(layer => (
                <div 
                  key={`track-${layer.id}`} 
                  className="track-row"
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(e, layer.id);
                  }}
                >
                  {clips.filter(c => c.layerId === layer.id).map(clip => (
                    <div 
                      key={clip.id} 
                      className={`clip-block ${layer.locked ? 'locked' : ''} ${selectedClipId === clip.id ? 'selected' : ''}`}
                      onMouseDown={(e) => !layer.locked && handleClipMouseDown(e, clip.id)}
                      style={{ 
                        left: clip.start, 
                        width: clip.width,
                        backgroundColor: `${layer.color}40`, // 25% opacity background
                        borderColor: selectedClipId === clip.id ? '#fff' : layer.color,
                        borderWidth: selectedClipId === clip.id ? 2 : 1,
                        cursor: layer.locked ? 'not-allowed' : 'move'
                      }}
                    >
                      <span className="clip-name">{clip.name}</span>
                      <div className="clip-edge edge-left" style={{ cursor: 'col-resize', position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 }} />
                      <div className="clip-edge edge-right" style={{ cursor: 'col-resize', position: 'absolute', right: 0, top: 0, bottom: 0, width: 8 }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
