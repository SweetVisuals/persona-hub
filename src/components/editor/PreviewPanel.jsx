import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import DeviceFrame from './DeviceFrame';
import './PreviewPanel.css';

export default function PreviewPanel({ activeFile, device, fileMetadata, currentTime, isPlaying, setIsPlaying, clips, setClips, selectedClipId, pixelsPerSecond }) {
  const mediaRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Dragging state
  const [dragClipId, setDragClipId] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0, clipX: 50, clipY: 50 });
  
  // Live Editing state
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    if (mediaRef.current) {
      if (Math.abs(mediaRef.current.currentTime - currentTime) > 0.5) {
        mediaRef.current.currentTime = currentTime;
      }
      if (isPlaying && mediaRef.current.paused) mediaRef.current.play().catch(console.error);
      if (!isPlaying && !mediaRef.current.paused) mediaRef.current.pause();
    }
  }, [currentTime, isPlaying]);

  const renderContent = () => {
    // Determine what to show visually. Timeline overrides activeFile if there is a visual clip.
    const activeVisualClip = clips?.find(c => {
      if (c.type === 'text') return false;
      const startSec = c.start / pixelsPerSecond;
      const endSec = (c.start + c.width) / pixelsPerSecond;
      return currentTime >= startSec && currentTime < endSec;
    });

    let displayFile = activeFile;
    let isSlide = false;

    if (activeVisualClip) {
      if (activeVisualClip.type === 'slideshow_slide') {
        isSlide = true;
        displayFile = { id: activeVisualClip.id, name: activeVisualClip.name, url: activeVisualClip.url || `https://placehold.co/600x800/1e1e1e/FFF?text=${encodeURIComponent(activeVisualClip.name)}` };
      } else if (activeVisualClip.type === 'image' || activeVisualClip.type === 'video') {
        // Mock fallback if we had the actual file URL in clip
        displayFile = { id: activeVisualClip.fileId, name: activeVisualClip.name, url: activeVisualClip.url || `https://placehold.co/600x800/1e1e1e/FFF?text=${encodeURIComponent(activeVisualClip.name)}` };
      }
    }

    if (!displayFile) {
      return (
        <div className="placeholder-content">
          <div className="placeholder-text">Live Preview</div>
        </div>
      );
    }
    
    const ext = displayFile.name.split('.').pop().toLowerCase();
    const isImage = isSlide || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isVideo = ['mp4', 'mov', 'webm'].includes(ext);
    const isAudio = ['mp3', 'wav', 'm4a'].includes(ext);

    const currentMetadata = fileMetadata[displayFile.id] || {};
    const cropRatio = currentMetadata.aspectRatio && currentMetadata.aspectRatio !== 'original' 
      ? currentMetadata.aspectRatio.replace(':', '/') 
      : 'auto';

    const wrapperStyle = {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000', overflow: 'hidden'
    };

    if (isImage) {
      if (cropRatio !== 'auto') {
        return (
          <div style={wrapperStyle}>
            <div style={{ width: '100%', aspectRatio: cropRatio, background: '#111' }}>
              <img src={displayFile.url} alt={displayFile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        );
      }
      return (
        <div style={wrapperStyle}>
          <img src={displayFile.url} alt={displayFile.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      );
    } else if (isVideo) {
      return <video ref={mediaRef} src={displayFile.url} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />;
    } else if (isAudio) {
      return (
        <div className="placeholder-content" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="placeholder-text" style={{ fontSize: 48 }}>🎵</div>
          <audio ref={mediaRef} src={activeFile.url} controls />
        </div>
      );
    }
    
    const isSlideFile = ext === 'slide';
    const isSlideshowExt = ['ppt', 'pptx', 'key', 'pdf', 'slideshow', 'slide'].includes(ext);
    
    // Slide file preview with navigation
    if (isSlideFile && !activeVisualClip) {
      const metadata = displayFile.metadata || { title: 'Untitled', description: 'No description', song: 'Original Sound', slides: [] };
      const slides = metadata.slides || [];

      return (
        <div style={{ ...wrapperStyle, flexDirection: 'column' }}>
          {slides.length > 0 ? (
            <img src={slides[currentSlideIndex]} alt={`Slide ${currentSlideIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ color: 'var(--text-3)' }}>No slides generated yet.</div>
          )}

          {/* UI Overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '120px 20px 40px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', pointerEvents: 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{metadata.title}</div>
            <div style={{ fontSize: 14, color: '#e5e5e5', marginBottom: 12, whiteSpace: 'pre-wrap' }}>{metadata.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#fff' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff' }} /> {metadata.song}
            </div>
          </div>
          
          {/* Navigation Arrows */}
          {slides.length > 1 && (
            <>
              <button 
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentSlideIndex === 0 ? 'default' : 'pointer', opacity: currentSlideIndex === 0 ? 0.3 : 1, zIndex: 10 }}
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                disabled={currentSlideIndex === slides.length - 1}
                onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentSlideIndex === slides.length - 1 ? 'default' : 'pointer', opacity: currentSlideIndex === slides.length - 1 ? 0.3 : 1, zIndex: 10 }}
              >
                <ArrowRight size={20} />
              </button>
            </>
          )}
          
          {/* Pagination Dots */}
          {slides.length > 1 && (
            <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4, zIndex: 10 }}>
              {slides.map((_, i) => (
                <div key={i} style={{ width: i === currentSlideIndex ? 12 : 6, height: 6, borderRadius: 3, background: '#fff', opacity: i === currentSlideIndex ? 1 : 0.4, transition: 'all 0.2s ease' }} />
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Fallback for unknown formats
    return (
      <div className="placeholder-content" style={{ background: '#1e1e1e' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 48 }}>📑</div>
          <div className="placeholder-text" style={{ fontSize: 18, textAlign: 'center' }}>
            {isSlideshowExt ? 'Slideshow Preview' : 'Preview Not Available'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
            {displayFile.name}
          </div>
        </div>
      </div>
    );
  };

  const handleTextMouseDown = (e, clip) => {
    e.stopPropagation();
    setDragClipId(clip.id);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      clipX: clip.x ?? 50,
      clipY: clip.y ?? 50
    };
  };

  useEffect(() => {
    if (!dragClipId) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      // Rough approximation: 5 pixels = 1% movement for a typical screen size
      const percentX = Math.min(100, Math.max(0, dragStartRef.current.clipX + (deltaX / 5)));
      const percentY = Math.min(100, Math.max(0, dragStartRef.current.clipY + (deltaY / 5)));
      
      setClips(prev => prev.map(c => c.id === dragClipId ? { ...c, x: percentX, y: percentY } : c));
    };

    const handleMouseUp = () => setDragClipId(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragClipId, setClips]);

  const renderTextOverlays = () => {
    if (!clips) return null;
    // Current time is in seconds. clip.start and clip.width are in pixels
    // So clip time range is start/pixelsPerSecond to (start+width)/pixelsPerSecond.
    
    const activeTexts = clips.filter(c => {
      if (c.type !== 'text') return false;
      const startSec = c.start / pixelsPerSecond;
      const endSec = (c.start + c.width) / pixelsPerSecond;
      return currentTime >= startSec && currentTime <= endSec;
    });

    return activeTexts.map(clip => {
      if (editingTextId === clip.id) {
        return (
          <textarea
            key={clip.id}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={() => {
              setClips(prev => prev.map(c => c.id === clip.id ? { ...c, text: editingValue, name: editingValue } : c));
              setEditingTextId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.target.blur(); // Trigger onBlur to save
              }
            }}
            autoFocus
            style={{
              position: 'absolute',
              top: `${clip.y ?? 50}%`,
              left: `${clip.x ?? 50}%`,
              transform: 'translate(-50%, -50%)',
              color: clip.color || '#ffffff',
              fontFamily: clip.font || 'TikTok Sans',
              fontSize: '32px',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              background: 'rgba(0,0,0,0.5)',
              border: '2px solid var(--accent)',
              padding: '8px',
              whiteSpace: 'nowrap',
              zIndex: 20,
              minWidth: '100px',
              textAlign: 'center',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden'
            }}
          />
        );
      }

      return (
        <div 
          key={clip.id}
          onMouseDown={(e) => handleTextMouseDown(e, clip)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingTextId(clip.id);
            setEditingValue(clip.text);
          }}
          style={{
            position: 'absolute',
            top: `${clip.y ?? 50}%`,
            left: `${clip.x ?? 50}%`,
            transform: 'translate(-50%, -50%)',
            color: clip.color || '#ffffff',
            fontFamily: clip.font || 'TikTok Sans',
            fontSize: '32px',
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            cursor: 'move',
            border: selectedClipId === clip.id ? '2px dashed var(--accent)' : 'none',
            padding: '8px',
            whiteSpace: 'nowrap',
            zIndex: 10,
            userSelect: 'none'
          }}
        >
          {clip.text}
        </div>
      );
    });
  };

  return (
    <div className="preview-panel-container">
      <div className="preview-toolbar">
        <span className="preview-title">Preview Canvas</span>
        <div className="playhead-info" style={{ color: 'var(--text-3)' }}>
          {new Date(currentTime * 1000).toISOString().substr(11, 11)}
        </div>
      </div>
      
      <div className="preview-canvas-area">
        <DeviceFrame device={device}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {renderContent()}
            {renderTextOverlays()}
          </div>
        </DeviceFrame>
      </div>

      <div className="preview-controls">
        <div className="playhead-info">{new Date(currentTime * 1000).toISOString().substr(11, 11)}</div>
        <div className="player-controls">
          <button className="player-btn">⏮</button>
          <button className="player-btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸' : '▶️'}
          </button>
          <button className="player-btn">⏭</button>
        </div>
        <div className="playback-res">1080p</div>
      </div>
    </div>
  );
}
