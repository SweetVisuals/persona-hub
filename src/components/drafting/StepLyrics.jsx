import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { STYLE_PRESETS } from './draftingData';

export default function StepLyrics({ audioData, onVerify }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
  const [customFontSize, setCustomFontSize] = useState(STYLE_PRESETS[0].fontSize);
  
  const [lines, setLines] = useState([
    { id: 1, time: '[00:00.00]', text: 'Music playing' },
    { id: 2, time: '[00:05.20]', text: 'First line of the song' },
    { id: 3, time: '[00:10.45]', text: 'Second line goes here' },
  ]);

  const canvasRef = useRef(null);

  useEffect(() => {
    // Draw placeholder waveform
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, width, height);
    
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < width; i += 5) {
      const h = Math.random() * (height - 20) + 10;
      ctx.moveTo(i, height / 2 - h / 2);
      ctx.lineTo(i, height / 2 + h / 2);
    }
    
    ctx.stroke();
  }, []);

  const handleUpdateLine = (id, field, value) => {
    setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
  };

  const handleAddLine = () => {
    const newId = Math.max(0, ...lines.map(l => l.id)) + 1;
    setLines([...lines, { id: newId, time: '[00:00.00]', text: '' }]);
  };

  const handleRemoveLine = (id) => {
    setLines(lines.filter(line => line.id !== id));
  };

  const handleVerify = () => {
    const styleData = {
      ...selectedStyle,
      fontSize: customFontSize
    };
    onVerify(lines, styleData);
  };

  return (
    <div className="step-content glass">
      <div className="step-lyrics-container">
        
        {/* Left Panel: Lyrics List */}
        <div className="lyrics-panel">
          <div className="panel-header">
            <h3>Edit Timestamps & Lyrics</h3>
            <button className="icon-btn" onClick={handleAddLine} title="Add Line">
              <Plus size={20} />
            </button>
          </div>
          
          <div className="lyrics-list">
            {lines.map((line) => (
              <div key={line.id} className="lyric-row">
                <input 
                  type="text" 
                  className="timestamp-input" 
                  value={line.time}
                  onChange={(e) => handleUpdateLine(line.id, 'time', e.target.value)}
                  placeholder="[00:00.00]"
                />
                <input 
                  type="text" 
                  className="text-input" 
                  value={line.text}
                  onChange={(e) => handleUpdateLine(line.id, 'text', e.target.value)}
                  placeholder="Lyric text"
                />
                <button 
                  className="icon-btn danger" 
                  onClick={() => handleRemoveLine(line.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Audio & Styling */}
        <div className="editor-panel">
          <div className="waveform-container">
            <canvas ref={canvasRef} className="waveform-canvas" width="400" height="80"></canvas>
            <div className="playback-controls">
              <button 
                className="btn" 
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ borderRadius: '50%', padding: '0.75rem' }}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>
          </div>

          <div className="panel-header" style={{ marginTop: '1rem' }}>
            <h3>Visual Style</h3>
          </div>

          <div className="preset-grid">
            {STYLE_PRESETS.map(preset => (
              <div 
                key={preset.id}
                className={`preset-card ${selectedStyle.id === preset.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedStyle(preset);
                  setCustomFontSize(preset.fontSize);
                }}
              >
                <div style={{ 
                  fontFamily: preset.font, 
                  color: preset.color,
                  WebkitTextStroke: `1px ${preset.strokeColor}`,
                  fontSize: '1.25rem',
                  marginBottom: '0.25rem'
                }}>
                  Abc
                </div>
                <div className="preset-name">{preset.name}</div>
              </div>
            ))}
          </div>

          <div className="style-pickers">
            <div className="form-group">
              <label>Font Size</label>
              <input 
                type="number" 
                className="input-field" 
                value={customFontSize}
                onChange={(e) => setCustomFontSize(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Preview</label>
              <div style={{
                background: '#111',
                padding: '0.5rem',
                borderRadius: '4px',
                textAlign: 'center',
                fontFamily: selectedStyle.font,
                color: selectedStyle.color,
                WebkitTextStroke: `1px ${selectedStyle.strokeColor}`,
                fontSize: `${Math.min(customFontSize, 32)}px`
              }}>
                Sample Text
              </div>
            </div>
          </div>

          <div className="panel-footer">
            <button className="btn btn-primary" onClick={handleVerify}>
              <CheckCircle2 size={18} />
              Verify Lyrics
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
