import { useState, useEffect } from 'react';
import Card from '../components/Card';

import { Folder, File, ChevronRight, Upload, Plus, Trash2, Edit2, UserPlus, MoreVertical, Search, CheckSquare, Square, List, Grid, Columns, Image as ImageIcon, PlayCircle, X, Smartphone, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../components/BusinessContext';

export default function FileManager() {
  const { personas } = useBusiness();
  const [items, setItems] = useState([]);
  
  // Navigation State
  const [viewMode, setViewMode] = useState('column');
  const [columnPath, setColumnPath] = useState([]);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // For Media Preview Pane
  const [contextMenu, setContextMenu] = useState(null);

  // Drag and Drop State
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    
    // Fetch initial files
    const fetchFiles = async () => {
      const { data } = await supabase.from('files').select('*');
      if (data) {
        setItems(data.map(d => ({
          id: d.id,
          type: d.type,
          name: d.name,
          parentId: d.parent_id,
          personaId: d.persona_id,
          size: d.size,
          url: d.url,
          metadata: d.metadata,
          date: new Date(d.created_at).toLocaleDateString()
        })));
      }
    };
    fetchFiles();

    // Subscribe to realtime file changes
    const sub = supabase.channel('public:files')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, fetchFiles)
      .subscribe();

    return () => {
      window.removeEventListener('click', handleClick);
      supabase.removeChannel(sub);
    };
  }, []);

  // Derived Breadcrumbs
  const getBreadcrumbs = () => {
    return columnPath.map(id => items.find(i => i.id === id)).filter(Boolean);
  };
  const breadcrumbs = getBreadcrumbs();
  const currentFolderId = columnPath.length > 0 ? columnPath[columnPath.length - 1] : null;
  const currentItems = items.filter(item => item.parentId === currentFolderId);
  const allSelected = currentItems.length > 0 && selectedIds.length === currentItems.length;

  // Actions
  const handleItemClick = (item, e, colIndex = -1) => {
    if (e.shiftKey && lastSelectedId) {
      const currentIndex = currentItems.findIndex(i => i.id === item.id);
      const lastIndex = currentItems.findIndex(i => i.id === lastSelectedId);
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = currentItems.slice(start, end + 1).map(i => i.id);
        setSelectedIds(prev => [...new Set([...prev, ...rangeIds])]);
      }
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelect(item.id);
      setLastSelectedId(item.id);
    } else {
      setSelectedIds([item.id]);
      setLastSelectedId(item.id);
      if (item.type === 'folder') {
        setSelectedFile(null);
        if (viewMode === 'column' && colIndex !== -1) {
          // Truncate path to the column we clicked from, then push new folder
          setColumnPath([...columnPath.slice(0, colIndex), item.id]);
        } else {
          setColumnPath([...columnPath, item.id]);
        }
      } else {
        // File selected -> Open preview
        setSelectedFile(item);
        if (viewMode === 'column' && colIndex !== -1) {
           setColumnPath(columnPath.slice(0, colIndex));
        }
      }
    }
  };

  const jumpToCrumb = (index) => {
    if (index === -1) {
      setColumnPath([]);
    } else {
      setColumnPath(columnPath.slice(0, index + 1));
    }
    setSelectedFile(null);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    setLastSelectedId(id);
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(currentItems.map(i => i.id));
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, targetId: item ? item.id : null });
    if (item && !selectedIds.includes(item.id)) setSelectedIds([item.id]);
  };

  // Drag & Drop
  const handleDragStart = (e, id) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDragOver = (e, targetFolderId) => {
    e.preventDefault();
    if (targetFolderId !== draggedItemId) setDragOverFolderId(targetFolderId);
  };
  const handleDragLeave = () => setDragOverFolderId(null);
  const handleDrop = (e, targetFolderId) => {
    e.preventDefault();
    setDragOverFolderId(null);
    if (draggedItemId && draggedItemId !== targetFolderId) {
      const targetItem = items.find(i => i.id === targetFolderId);
      if (targetItem && targetItem.parentId === draggedItemId) return;
      setItems(prev => prev.map(item => item.id === draggedItemId ? { ...item, parentId: targetFolderId } : item));
    }
    setDraggedItemId(null);
  };

  // Mutations
  const createFolder = async () => {
    const name = prompt('New Folder Name:', 'Untitled Folder');
    if (name) {
      await supabase.from('files').insert({
        type: 'folder',
        name: name,
        parent_id: currentFolderId
      });
    }
  };
  const deleteSelected = async () => {
    if (window.confirm(`Delete ${selectedIds.length} item(s)?`)) {
      await supabase.from('files').delete().in('id', selectedIds);
      setSelectedIds([]);
      setSelectedFile(null);
    }
  };
  const renameSelected = async () => {
    if (selectedIds.length !== 1) return;
    const item = items.find(i => i.id === selectedIds[0]);
    const newName = prompt('Rename to:', item.name);
    if (newName) {
      await supabase.from('files').update({ name: newName }).eq('id', item.id);
    }
  };

  // Render Helpers
  const renderIcon = (item, size = 20) => {
    if (item.type === 'folder') return <Folder size={size} color="var(--text-2)" fill="var(--bg-3)" />;
    if (item.name.endsWith('.slide')) return <Smartphone size={size} color="var(--accent)" />;
    if (item.name.endsWith('.mp4')) return <PlayCircle size={size} color="var(--text-3)" />;
    return <ImageIcon size={size} color="var(--text-3)" />;
  };

  const getFolderContents = (folderId) => items.filter(i => i.parentId === folderId);

  return (
    <div style={{ padding: '32px', width: '100%', maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onContextMenu={(e) => handleContextMenu(e, null)}>
      
      {/* Header & Robust Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexShrink: 0 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>File Browser</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginTop: 8 }}>
            <span style={{ cursor: 'pointer', color: currentFolderId === null ? 'var(--text)' : 'var(--text-3)', transition: 'color 0.2s' }} onClick={() => jumpToCrumb(-1)}>Root</span>
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ChevronRight size={14} color="var(--text-3)" />
                <span style={{ cursor: 'pointer', color: currentFolderId === crumb.id ? 'var(--text)' : 'var(--text-3)', transition: 'color 0.2s' }} onClick={() => jumpToCrumb(idx)}>
                  {crumb.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* View Toggles */}
          <div style={{ display: 'flex', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 4 }}>
            <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'var(--bg-4)' : 'transparent', color: viewMode === 'list' ? 'var(--text)' : 'var(--text-3)', padding: '6px 10px', borderRadius: 4, border: 'none' }}><List size={16} /></button>
            <button onClick={() => setViewMode('grid')} style={{ background: viewMode === 'grid' ? 'var(--bg-4)' : 'transparent', color: viewMode === 'grid' ? 'var(--text)' : 'var(--text-3)', padding: '6px 10px', borderRadius: 4, border: 'none' }}><Grid size={16} /></button>
            <button onClick={() => setViewMode('column')} style={{ background: viewMode === 'column' ? 'var(--bg-4)' : 'transparent', color: viewMode === 'column' ? 'var(--text)' : 'var(--text-3)', padding: '6px 10px', borderRadius: 4, border: 'none' }}><Columns size={16} /></button>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          
          <button onClick={toggleSelectAll} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'var(--text-3)', border: 'none', fontSize: 13, fontWeight: 600 }}>
            {allSelected ? <CheckSquare size={16} color="var(--text)" /> : <Square size={16} />} All
          </button>
          <button onClick={renameSelected} disabled={selectedIds.length !== 1} style={{ background: 'transparent', color: 'var(--text)', border: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: selectedIds.length !== 1 ? 0.3 : 1 }}><Edit2 size={16} /> Rename</button>
          <button onClick={deleteSelected} disabled={selectedIds.length === 0} style={{ background: 'transparent', color: 'var(--red)', border: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: selectedIds.length === 0 ? 0.3 : 1 }}><Trash2 size={16} /> Delete</button>
          
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

          <button onClick={createFolder} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-3)', color: 'var(--text)', padding: '8px 16px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)' }}>
            <Plus size={16} /> New Folder
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--text)', color: 'var(--bg)', padding: '8px 16px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, border: 'none' }}>
            <Upload size={16} /> Upload
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
        {/* Main Browser Area */}
        <Card className="glass" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Render Views */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
            
            {/* --- LIST VIEW --- */}
            {viewMode === 'list' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 150px 100px 50px', padding: '12px 24px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>
                  <div onClick={toggleSelectAll} style={{ cursor: 'pointer', marginRight: 16, display: 'flex', alignItems: 'center' }}>{allSelected ? <CheckSquare size={16} color="var(--text)" /> : <Square size={16} />}</div>
                  <div>Name</div><div>Assigned To</div><div>Size</div><div></div>
                </div>
                {currentItems.map(item => (
                  <div key={item.id} onClick={(e) => handleItemClick(item, e)} onContextMenu={(e) => handleContextMenu(e, item)}
                    draggable onDragStart={(e) => handleDragStart(e, item.id)} onDragOver={item.type === 'folder' ? (e) => handleDragOver(e, item.id) : undefined} onDragLeave={item.type === 'folder' ? handleDragLeave : undefined} onDrop={item.type === 'folder' ? (e) => handleDrop(e, item.id) : undefined}
                    style={{
                      display: 'grid', gridTemplateColumns: 'auto 1fr 150px 100px 50px', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      background: dragOverFolderId === item.id ? 'var(--bg-3)' : (selectedIds.includes(item.id) ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                    }}
                  >
                    <div onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} style={{ marginRight: 16, color: selectedIds.includes(item.id) ? 'var(--text)' : 'var(--text-3)' }}>
                      {selectedIds.includes(item.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{renderIcon(item)} {item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.personaId ? personas.find(p => p.id === item.personaId)?.name : '-'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.size || '--'}</div>
                    <div style={{ color: 'var(--text-3)', display: 'flex', justifyContent: 'flex-end' }}><MoreVertical size={16} /></div>
                  </div>
                ))}
              </div>
            )}

            {/* --- GRID VIEW --- */}
            {viewMode === 'grid' && (
              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, padding: 24, alignContent: 'start' }}>
                {currentItems.map(item => (
                  <div key={item.id} onClick={(e) => handleItemClick(item, e)} onContextMenu={(e) => handleContextMenu(e, item)}
                    draggable onDragStart={(e) => handleDragStart(e, item.id)} onDragOver={item.type === 'folder' ? (e) => handleDragOver(e, item.id) : undefined} onDragLeave={item.type === 'folder' ? handleDragLeave : undefined} onDrop={item.type === 'folder' ? (e) => handleDrop(e, item.id) : undefined}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative',
                      background: dragOverFolderId === item.id ? 'var(--bg-3)' : (selectedIds.includes(item.id) ? 'rgba(255, 255, 255, 0.05)' : 'transparent'),
                    }}
                  >
                    <div onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} style={{ position: 'absolute', top: 12, left: 12, color: selectedIds.includes(item.id) ? 'var(--text)' : 'var(--text-3)' }}>
                      {selectedIds.includes(item.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                    {renderIcon(item, 48)}
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'center', wordBreak: 'break-all' }}>{item.name}</div>
                  </div>
                ))}
              </div>
            )}

            {/* --- COLUMN VIEW (Mac Style) --- */}
            {viewMode === 'column' && (
              <div style={{ display: 'flex', width: '100%', height: '100%', overflowX: 'auto' }}>
                {[null, ...columnPath].map((fId, colIndex) => (
                  <div key={fId || 'root'} style={{ width: 260, minWidth: 260, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'transparent' }}>
                    {getFolderContents(fId).map(item => {
                      const isActiveNode = columnPath[colIndex] === item.id || selectedFile?.id === item.id;
                      return (
                        <div key={item.id} onClick={(e) => handleItemClick(item, e, colIndex)} onContextMenu={(e) => handleContextMenu(e, item)}
                          draggable onDragStart={(e) => handleDragStart(e, item.id)} onDragOver={item.type === 'folder' ? (e) => handleDragOver(e, item.id) : undefined} onDragLeave={item.type === 'folder' ? handleDragLeave : undefined} onDrop={item.type === 'folder' ? (e) => handleDrop(e, item.id) : undefined}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)',
                            background: dragOverFolderId === item.id ? 'var(--bg-4)' : (isActiveNode || selectedIds.includes(item.id) ? 'var(--text)' : 'transparent'),
                            color: isActiveNode || selectedIds.includes(item.id) ? 'var(--bg)' : 'var(--text)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, overflow: 'hidden' }}>
                            {renderIcon(item, 16)}
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isActiveNode || selectedIds.includes(item.id) ? 'var(--bg)' : 'var(--text)' }}>{item.name}</span>
                          </div>
                          {item.type === 'folder' && <ChevronRight size={14} color={isActiveNode || selectedIds.includes(item.id) ? 'var(--bg)' : 'var(--text-3)'} />}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {currentItems.length === 0 && viewMode !== 'column' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--text-3)', padding: 60 }}>
                <Folder size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>This folder is empty</div>
              </div>
            )}
          </div>
        </Card>

        {/* Media Preview Pane */}
        {selectedFile && (
          <Card className="glass" style={{ width: 320, padding: 24, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative' }}>
            <button onClick={() => setSelectedFile(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg-3)', border: 'none', color: 'var(--text-2)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
            
            <div style={{ width: '100%', height: 180, background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' }}>
              {selectedFile.url && (selectedFile.name.endsWith('.jpg') || selectedFile.name.endsWith('.png')) ? (
                <img src={selectedFile.url} alt={selectedFile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : selectedFile.url && selectedFile.name.endsWith('.mp4') ? (
                <video src={selectedFile.url} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                renderIcon(selectedFile, 64)
              )}
            </div>
            
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8, wordBreak: 'break-all' }}>{selectedFile.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500, marginBottom: 24 }}>{selectedFile.size} • {selectedFile.date}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => window.open(selectedFile.url, '_blank')} disabled={!selectedFile.url} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', background: 'var(--text)', color: 'var(--bg)', fontWeight: 600, fontSize: 13, border: 'none', opacity: !selectedFile.url ? 0.3 : 1 }}>Open URL</button>
              <button style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>Schedule Post</button>
            </div>
          </Card>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div style={{
          position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', zIndex: 1000, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 4
        }}>
          {contextMenu.targetId ? (
            <>
              <button onClick={renameSelected} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'transparent', color: 'var(--text)', border: 'none', width: '100%', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }} className="menu-btn"><Edit2 size={14} /> Rename</button>
              <button onClick={deleteSelected} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'transparent', color: 'var(--red)', border: 'none', width: '100%', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }} className="menu-btn"><Trash2 size={14} /> Delete</button>
            </>
          ) : (
            <>
              <button onClick={createFolder} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'transparent', color: 'var(--text)', border: 'none', width: '100%', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }} className="menu-btn"><Plus size={14} /> New Folder</button>
            </>
          )}
          <style>{`.menu-btn:hover { background: var(--bg-3) !important; }`}</style>
        </div>
      )}

      {/* Full-Screen .slide Device Preview Overlay */}
      {selectedFile && selectedFile.name.endsWith('.slide') && (
        <SlidePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  );
}

function SlidePreviewModal({ file, onClose }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Extract metadata directly from the file object
  const metadata = file.metadata || { title: 'Untitled', description: 'No description', song: 'Original Sound', slides: [] };
  const slides = metadata.slides || [];
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 32, right: 32, background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <X size={24} />
      </button>

      {/* Device Frame */}
      <div style={{
        width: 380, height: 800, background: '#000', borderRadius: 48,
        border: '8px solid var(--bg-3)', boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Notch */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 30, background: 'var(--bg-3)', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />

        {slides.length > 0 ? (
          <img src={slides[currentSlideIndex]} alt={`Slide ${currentSlideIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
            No slides generated yet.
          </div>
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
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentSlideIndex === 0 ? 'default' : 'pointer', opacity: currentSlideIndex === 0 ? 0.3 : 1 }}
            >
              <ArrowLeft size={20} />
            </button>
            <button 
              disabled={currentSlideIndex === slides.length - 1}
              onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentSlideIndex === slides.length - 1 ? 'default' : 'pointer', opacity: currentSlideIndex === slides.length - 1 ? 0.3 : 1 }}
            >
              <ArrowRight size={20} />
            </button>
          </>
        )}
        
        {/* Pagination Dots */}
        {slides.length > 1 && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4 }}>
            {slides.map((_, i) => (
              <div key={i} style={{ width: i === currentSlideIndex ? 12 : 6, height: 6, borderRadius: 3, background: '#fff', opacity: i === currentSlideIndex ? 1 : 0.4, transition: 'all 0.2s ease' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
