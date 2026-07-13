import { useState, useRef, useCallback, useEffect } from 'react';
import EditorTopbar from './EditorTopbar';
import FilePanel from './FilePanel';
import PreviewPanel from './PreviewPanel';
import TemplatesPanel from './TemplatesPanel';
import TimelinePanel from './TimelinePanel';
import './EditorLayout.css';

export default function EditorLayout() {
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(300);
  const [bottomHeight, setBottomHeight] = useState(250);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [device, setDevice] = useState('phone'); // phone, tablet, desktop
  const [clips, setClips] = useState([]);
  const [fileMetadata, setFileMetadata] = useState({}); // { [fileId]: { aspectRatio, ... } }
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState(null);
  
  const [layers, setLayers] = useState([]);

  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [pixelsPerSecond, setPixelsPerSecond] = useState(30);

  // History Stack for Undo/Redo
  const [history, setHistory] = useState([{ clips: [], layers: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoAction = useRef(false);

  useEffect(() => {
    if (isUndoAction.current) {
      isUndoAction.current = false;
      return;
    }
    const currentHist = history[historyIndex];
    if (JSON.stringify(currentHist.clips) !== JSON.stringify(clips) || JSON.stringify(currentHist.layers) !== JSON.stringify(layers)) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ clips, layers });
      // Cap history at 50 states to prevent memory bloat
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [clips, layers, history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      isUndoAction.current = true;
      setHistoryIndex(prev => prev - 1);
      setClips(history[historyIndex - 1].clips);
      setLayers(history[historyIndex - 1].layers);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isUndoAction.current = true;
      setHistoryIndex(prev => prev + 1);
      setClips(history[historyIndex + 1].clips);
      setLayers(history[historyIndex + 1].layers);
    }
  };

  const zoomIn = () => setPixelsPerSecond(prev => Math.min(prev + 10, 100));
  const zoomOut = () => setPixelsPerSecond(prev => Math.max(prev - 10, 10));
  const zoomFit = () => setPixelsPerSecond(30);

  const containerRef = useRef(null);
  const resizingRef = useRef(null); // 'left', 'right', 'bottom', or null

  const handleMouseMove = useCallback((e) => {
    if (!resizingRef.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    if (resizingRef.current === 'left') {
      const newWidth = e.clientX - containerRect.left;
      if (newWidth > 150 && newWidth < 500) {
        setLeftWidth(newWidth);
      }
    } else if (resizingRef.current === 'right') {
      const newWidth = containerRect.right - e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setRightWidth(newWidth);
      }
    } else if (resizingRef.current === 'bottom') {
      const newHeight = containerRect.bottom - e.clientY;
      if (newHeight > 100 && newHeight < containerRect.height - 200) {
        setBottomHeight(newHeight);
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (resizingRef.current) {
      document.body.style.cursor = 'default';
      resizingRef.current = null;
    }
  }, []);

  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();

    const loop = (time) => {
      if (isPlaying) {
        const delta = (time - lastTime) / 1000;
        setCurrentTime(prev => prev + delta);
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Spacebar for play/pause
      if (e.code === 'Space') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault(); // Prevent scrolling
        setIsPlaying(prev => !prev);
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        // Prevent deleting if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        setClips(prev => prev.filter(c => c.id !== selectedClipId));
        setSelectedClipId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId]);

  const startResizing = (panel) => (e) => {
    e.preventDefault();
    resizingRef.current = panel;
    document.body.style.cursor = panel === 'bottom' ? 'row-resize' : 'col-resize';
  };

  return (
    <div className="editor-container" ref={containerRef}>
      <EditorTopbar 
        device={device} 
        setDevice={setDevice} 
        activeFile={activeFile}
        fileMetadata={fileMetadata}
        setFileMetadata={setFileMetadata}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        clips={clips}
        setClips={setClips}
        layers={layers}
        setLayers={setLayers}
        selectedClipId={selectedClipId}
        setSelectedClipId={setSelectedClipId}
        currentTime={currentTime}
        layers={layers}
        setLayers={setLayers}
        projectTitle={projectTitle}
        setProjectTitle={setProjectTitle}
        undo={undo}
        redo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        zoomFit={zoomFit}
        zoomLevel={Math.round((pixelsPerSecond / 30) * 100)}
      />
      
      <div className="editor-main-area">
        {/* Left Panel (File Browser) */}
        <div className="editor-panel" style={{ width: leftWidth, minWidth: leftWidth }}>
          <FilePanel onFileClick={setActiveFile} />
        </div>
        
        {/* Left Drag Handle */}
        <div className="resizer col-resizer" onMouseDown={startResizing('left')} />
        
        {/* Center Panel (Preview) */}
        <div className="editor-panel center-panel">
          <PreviewPanel 
            activeFile={activeFile} 
            device={device} 
            fileMetadata={fileMetadata}
            currentTime={currentTime}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            clips={clips}
            setClips={setClips}
            selectedClipId={selectedClipId}
            pixelsPerSecond={pixelsPerSecond}
          />
        </div>
        
        {/* Right Drag Handle */}
        <div className="resizer col-resizer" onMouseDown={startResizing('right')} />
        
        {/* Right Panel (Templates) */}
        <div className="editor-panel" style={{ width: rightWidth, minWidth: rightWidth }}>
          <TemplatesPanel />
        </div>
      </div>
      
      {/* Bottom Panel Drag Handle (if not collapsed) */}
      {!bottomCollapsed && (
        <div className="resizer row-resizer" onMouseDown={startResizing('bottom')} />
      )}
      
      {/* Bottom Panel (Timeline) */}
      <div 
        className={`editor-bottom-panel ${bottomCollapsed ? 'collapsed' : ''}`}
        style={{ height: bottomCollapsed ? 40 : bottomHeight }}
      >
        <TimelinePanel 
          collapsed={bottomCollapsed} 
          onToggleCollapse={() => setBottomCollapsed(!bottomCollapsed)} 
          clips={clips}
          setClips={setClips}
          layers={layers}
          setLayers={setLayers}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          isPlaying={isPlaying}
          selectedClipId={selectedClipId}
          setSelectedClipId={setSelectedClipId}
          pixelsPerSecond={pixelsPerSecond}
        />
      </div>
    </div>
  );
}
