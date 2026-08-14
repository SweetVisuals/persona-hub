import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Upload, Music, Download, Sparkles, 
  RefreshCw, FileVideo, Check, AlertTriangle, Trash2, Plus, ArrowRight, VolumeX, Volume2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Standard style presets
const STYLE_PRESETS = [
  {
    id: 'preset-brat-classic',
    name: 'brat (Classic)',
    fontFamily: 'Arial, sans-serif',
    fontSize: 54,
    textColor: '#000000',
    backgroundColor: '#8ACE00',
    backgroundType: 'color',
    textCase: 'lowercase',
    blurAmount: 1, // slight blur to simulate retro compression
    alignment: 'center',
    animationType: 'cut',
    scaleBounce: 1.0
  },
  {
    id: 'preset-brat-green-screen',
    name: 'brat (Green Screen)',
    fontFamily: 'Arial, sans-serif',
    fontSize: 54,
    textColor: '#000000',
    backgroundColor: '#00FF00', // standard chroma key green
    backgroundType: 'color',
    textCase: 'lowercase',
    blurAmount: 1,
    alignment: 'center',
    animationType: 'cut',
    scaleBounce: 1.0
  },
  {
    id: 'preset-brat-transparent',
    name: 'brat (Transparent WebM)',
    fontFamily: 'Arial, sans-serif',
    fontSize: 54,
    textColor: '#ffffff',
    backgroundColor: 'transparent',
    backgroundType: 'transparent',
    textCase: 'lowercase',
    blurAmount: 1,
    alignment: 'center',
    animationType: 'cut',
    scaleBounce: 1.0
  },
  {
    id: 'preset-capcut-pop',
    name: 'CapCut Pop Bold',
    fontFamily: 'Impact, Arial Black, sans-serif',
    fontSize: 64,
    textColor: '#ffff00',
    strokeColor: '#000000',
    strokeWidth: 6,
    backgroundColor: 'transparent',
    backgroundType: 'transparent',
    textCase: 'uppercase',
    blurAmount: 0,
    alignment: 'center',
    animationType: 'scale',
    scaleBounce: 1.25
  },
  {
    id: 'preset-midnight-glow',
    name: 'Midnight Neon',
    fontFamily: 'Courier New, monospace',
    fontSize: 44,
    textColor: '#39FF14', // neon green text
    backgroundColor: '#000000',
    backgroundType: 'color',
    textCase: 'none',
    blurAmount: 0,
    alignment: 'center',
    animationType: 'fade',
    scaleBounce: 1.0,
    glowColor: '#39FF14'
  }
];

// Parser helper for SRT, LRC, and Raw Text
function parseLyrics(text) {
  if (!text) return [];
  
  // 1. Try SRT parsing
  if (text.includes('-->')) {
    const blocks = text.trim().split(/\r?\n\r?\n/);
    const parsed = [];
    let id = 1;
    for (const block of blocks) {
      const lines = block.trim().split(/\r?\n/);
      if (lines.length >= 2) {
        const timeLineIdx = lines.findIndex(l => l.includes('-->'));
        if (timeLineIdx !== -1) {
          const timeLine = lines[timeLineIdx];
          const textLines = lines.slice(timeLineIdx + 1);
          const [startStr, endStr] = timeLine.split(/\s*-->\s*/);
          
          const parseSrtTime = (str) => {
            if (!str) return 0;
            const parts = str.replace(',', '.').split(':');
            let secs = 0;
            if (parts.length === 3) {
              secs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
            } else if (parts.length === 2) {
              secs = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
            } else {
              secs = parseFloat(parts[0]) || 0;
            }
            return secs;
          };
          
          const seconds = parseSrtTime(startStr);
          const endSeconds = parseSrtTime(endStr);
          
          const formatTime = (secs) => {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = Math.floor(secs % 60).toString().padStart(2, '0');
            const c = Math.floor((secs % 1) * 100).toString().padStart(2, '0');
            return `${m}:${s}.${c}`;
          };

          parsed.push({
            id: id++,
            time: formatTime(seconds),
            text: textLines.join(' '),
            seconds: seconds,
            endSeconds: endSeconds
          });
        }
      }
    }
    if (parsed.length > 0) return parsed;
  }
  
  // 2. Try LRC parsing [mm:ss.xx]
  const lrcRegex = /^\[(\d{2}):(\d{2})\.?(\d{0,3})?\](.*)/;
  const rawLines = text.split(/\r?\n/);
  const parsedLrc = [];
  let id = 1;
  
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(lrcRegex);
    if (match) {
      const mins = parseInt(match[1]);
      const secs = parseInt(match[2]);
      const cents = match[3] ? parseInt(match[3].padEnd(2, '0').slice(0, 2)) : 0;
      const lyricText = match[4].trim();
      const totalSeconds = mins * 60 + secs + cents / 100;
      
      const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        const c = Math.floor((secs % 1) * 100).toString().padStart(2, '0');
        return `${m}:${s}.${c}`;
      };

      parsedLrc.push({
        id: id++,
        time: formatTime(totalSeconds),
        text: lyricText,
        seconds: totalSeconds,
        endSeconds: totalSeconds + 3 // Default 3s duration
      });
    }
  }
  
  if (parsedLrc.length > 0) return parsedLrc;
  
  // 3. Fallback to Plain Text (un-timed)
  return rawLines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, idx) => ({
      id: idx + 1,
      time: '',
      text: line,
      seconds: null,
      endSeconds: null
    }));
}

export default function BratLyricGenerator({ initialAudioUrl, initialLyrics }) {
  // Tabs and Modes
  const [activeTab, setActiveTab] = useState('audio'); // 'audio', 'sync', 'style', 'export'
  
  // Source inputs
  const [audioSource, setAudioSource] = useState('local'); // 'local', 'youtube', 'artist'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [customChannelUrl, setCustomChannelUrl] = useState('');
  const [artistStrategy, setArtistStrategy] = useState('latest'); // 'latest', 'best'
  const [personas, setPersonas] = useState([]);
  
  // Audio state
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  
  // Lyrics state
  const [rawLyrics, setRawLyrics] = useState(initialLyrics || '');
  const [lines, setLines] = useState([]);
  
  // Sync timing wizard
  const [isSyncMode, setIsSyncMode] = useState(false);
  const [currentSyncIndex, setCurrentSyncIndex] = useState(0);
  
  // Sourcing Job status
  const [sourcingStatus, setSourcingStatus] = useState('idle'); // 'idle', 'sourcing', 'processing', 'completed'
  const [sourcingProgress, setSourcingProgress] = useState('');
  const [error, setError] = useState(null);
  
  // Style properties
  const [style, setStyle] = useState(STYLE_PRESETS[0]);
  
  // Export properties
  const [resolution, setResolution] = useState('9:16'); // '9:16', '16:9', '1:1'
  const [exportState, setExportState] = useState('idle'); // 'idle', 'exporting', 'completed', 'error'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState(null);
  const [muteDuringExport, setMuteDuringExport] = useState(true);

  // DOM Refs
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);

  // Load Personas for dropdown
  useEffect(() => {
    const fetchPersonas = async () => {
      const { data } = await supabase.from('personas').select('id, name, youtube_channel_url, audio_strategy');
      if (data) setPersonas(data);
    };
    fetchPersonas();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Sync state if initial variables load later
  useEffect(() => {
    if (initialAudioUrl) setAudioUrl(initialAudioUrl);
    if (initialLyrics) {
      setRawLyrics(initialLyrics);
      setLines(parseLyrics(initialLyrics));
    }
  }, [initialAudioUrl, initialLyrics]);

  // Handle selected persona pre-filling
  const handlePersonaChange = (id) => {
    setSelectedPersonaId(id);
    const p = personas.find(p => p.id === id);
    if (p && p.youtube_channel_url) {
      setCustomChannelUrl(p.youtube_channel_url);
      if (p.audio_strategy) setArtistStrategy(p.audio_strategy);
    }
  };

  // Drag and Drop Local Audio
  const handleAudioFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setAudioSource('local');
      setError(null);
    }
  };

  // Submit background sourcing job (YouTube or Artist Channel)
  const triggerAutoSourceJob = async (e) => {
    e.preventDefault();
    setError(null);
    setSourcingStatus('sourcing');
    setSourcingProgress('Queueing job in database...');

    let sourceUrl = '';
    let sourceType = '';

    if (audioSource === 'youtube') {
      if (!youtubeUrl) {
        setError('Please enter a YouTube video URL.');
        setSourcingStatus('idle');
        return;
      }
      sourceUrl = youtubeUrl;
      sourceType = 'youtube';
    } else if (audioSource === 'artist') {
      if (!customChannelUrl) {
        setError('Please enter or select an artist YouTube channel URL.');
        setSourcingStatus('idle');
        return;
      }
      sourceUrl = customChannelUrl;
      sourceType = artistStrategy === 'best' ? 'artist_best' : 'artist_latest';
    }

    try {
      const { data, error } = await supabase.from('audio_extractions').insert({
        persona_id: selectedPersonaId || null,
        source_type: sourceType,
        source_url: sourceUrl,
        status: 'pending'
      }).select().single();

      if (error) throw error;

      setSourcingProgress('Job submitted! Waiting for background worker (running local scrape & Whisper)...');
      pollJobStatus(data.id);
    } catch (err) {
      console.error(err);
      setError('Failed to trigger auto sourcing: ' + err.message);
      setSourcingStatus('idle');
    }
  };

  // Poll job status from Supabase
  const pollJobStatus = (jobId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      const { data, error } = await supabase
        .from('audio_extractions')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        clearInterval(pollIntervalRef.current);
        setError('Error checking status: ' + error.message);
        setSourcingStatus('idle');
        return;
      }

      if (data.status === 'completed') {
        clearInterval(pollIntervalRef.current);
        setAudioUrl(data.mp3_url);
        setRawLyrics(data.lyrics || '');
        setLines(parseLyrics(data.lyrics || ''));
        setSourcingStatus('completed');
        setActiveTab('sync');
      } else if (data.status === 'processing') {
        setSourcingStatus('processing');
        setSourcingProgress('Worker has started! Scraped audio and transcribing lyrics with Whisper...');
      } else if (data.status === 'error') {
        clearInterval(pollIntervalRef.current);
        setError('Sourcing failed: ' + (data.error_message || 'Unknown backend error.'));
        setSourcingStatus('idle');
      }
    }, 4000);
  };

  // Load lyrics manually from textarea
  const loadRawLyrics = (text) => {
    setRawLyrics(text);
    setLines(parseLyrics(text));
  };

  const handleUpdateLineText = (id, newText) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, text: newText } : l));
  };

  const handleUpdateLineTime = (id, newTime) => {
    // Parse MM:SS.CC or SS into seconds
    let secs = null;
    const parts = newTime.split(':');
    if (parts.length === 2) {
      secs = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    } else {
      secs = parseFloat(newTime);
    }
    
    setLines(prev => prev.map(l => l.id === id ? { 
      ...l, 
      time: newTime, 
      seconds: isNaN(secs) ? null : secs,
      endSeconds: isNaN(secs) ? null : secs + 3
    } : l).sort((a,b) => (a.seconds || 0) - (b.seconds || 0)));
  };

  const handleAddLine = () => {
    const newId = Math.max(0, ...lines.map(l => l.id)) + 1;
    const lastSecs = lines.length > 0 ? (lines[lines.length - 1].seconds || 0) + 3 : 0;
    
    const formatTime = (secs) => {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      const c = Math.floor((secs % 1) * 100).toString().padStart(2, '0');
      return `${m}:${s}.${c}`;
    };

    setLines(prev => [...prev, {
      id: newId,
      time: formatTime(lastSecs),
      text: '',
      seconds: lastSecs,
      endSeconds: lastSecs + 3
    }]);
  };

  const handleRemoveLine = (id) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  // Timing sync tap helper
  const handleStartSync = () => {
    if (!audioUrl) return;
    setIsSyncMode(true);
    setCurrentSyncIndex(0);
    
    // Reset all lines to no timing if starting fresh
    setLines(prev => prev.map(l => ({ ...l, time: '', seconds: null, endSeconds: null })));
    
    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.playbackRate = playbackRate;
    audio.play();
    setIsPlaying(true);
  };

  const handleTapSync = () => {
    if (!isSyncMode || currentSyncIndex >= lines.length) return;

    const audio = audioRef.current;
    const t = audio.currentTime;
    
    const formatTime = (secs) => {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      const c = Math.floor((secs % 1) * 100).toString().padStart(2, '0');
      return `${m}:${s}.${c}`;
    };

    setLines(prev => {
      const updated = [...prev];
      updated[currentSyncIndex] = {
        ...updated[currentSyncIndex],
        time: formatTime(t),
        seconds: t,
        endSeconds: t + 3
      };
      
      // Update the previous line's endSeconds to transition clean to this one
      if (currentSyncIndex > 0) {
        updated[currentSyncIndex - 1].endSeconds = t;
      }
      return updated;
    });

    if (currentSyncIndex === lines.length - 1) {
      // Finished
      setIsSyncMode(false);
      audio.pause();
      setIsPlaying(false);
      // set the final end time
      setLines(prev => {
        const u = [...prev];
        u[u.length - 1].endSeconds = audio.duration || u[u.length - 1].seconds + 5;
        return u;
      });
    } else {
      setCurrentSyncIndex(prev => prev + 1);
    }
  };

  // Listen to spacebar for sync tapping
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isSyncMode && e.code === 'Space') {
        e.preventDefault();
        handleTapSync();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSyncMode, currentSyncIndex, lines]);

  // Audio Playback Controls
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = val;
      setCurrentTime(val);
    }
  };

  // Format second output
  const formatSeconds = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Canvas drawing logic for preview and rendering
  const drawCanvasFrame = (canvas, time, targetRes = '9:16') => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Standard vertical dimensions vs landscape
    let w = 1080;
    let h = 1920;
    
    if (targetRes === '16:9') {
      w = 1920;
      h = 1080;
    } else if (targetRes === '1:1') {
      w = 1080;
      h = 1080;
    }

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    // 1. Clear & Background
    ctx.clearRect(0, 0, w, h);
    if (style.backgroundType === 'color') {
      ctx.fillStyle = style.backgroundColor;
      ctx.fillRect(0, 0, w, h);
    } else if (style.backgroundType === 'transparent') {
      // Keep clear
    }

    // 2. Find active caption
    const activeLineIndex = lines.findIndex((l) => {
      return l.seconds !== null && time >= l.seconds && time <= (l.endSeconds || l.seconds + 3);
    });

    if (activeLineIndex !== -1) {
      const activeLine = lines[activeLineIndex];
      let txt = activeLine.text;

      // Transform Text
      if (style.textCase === 'lowercase') {
        txt = txt.toLowerCase();
      } else if (style.textCase === 'uppercase') {
        txt = txt.toUpperCase();
      }

      // Compute transitions/bounces
      const timeInActive = time - activeLine.seconds;
      let scale = 1.0;
      let opacity = 1.0;

      if (style.animationType === 'scale') {
        if (timeInActive < 0.25) {
          const progress = timeInActive / 0.25;
          scale = 0.8 + (style.scaleBounce - 0.8) * Math.sin(progress * Math.PI / 2);
        } else {
          scale = 1.0;
        }
      } else if (style.animationType === 'fade') {
        if (timeInActive < 0.2) {
          opacity = timeInActive / 0.2;
        }
      }

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.textAlign = style.alignment;
      ctx.textBaseline = 'middle';
      
      const fullFont = `bold ${style.fontSize}px ${style.fontFamily}`;
      ctx.font = fullFont;

      const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '';
        const linesArr = [];

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            linesArr.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        linesArr.push(line);
        
        const totalHeight = linesArr.length * lineHeight;
        let startY = y - totalHeight / 2 + lineHeight / 2;

        linesArr.forEach((l) => {
          ctx.save();
          if (scale !== 1.0) {
            ctx.translate(x, startY);
            ctx.scale(scale, scale);
            ctx.translate(-x, -startY);
          }

          if (style.glowColor) {
            ctx.shadowColor = style.glowColor;
            ctx.shadowBlur = 15;
          } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }

          if (style.blurAmount > 0) {
            ctx.filter = `blur(${style.blurAmount}px)`;
          }

          if (style.strokeColor && style.strokeWidth) {
            ctx.strokeStyle = style.strokeColor;
            ctx.lineWidth = style.strokeWidth;
            ctx.lineJoin = 'round';
            ctx.strokeText(l.trim(), x, startY);
          }

          ctx.fillStyle = style.textColor;
          ctx.fillText(l.trim(), x, startY);
          
          ctx.restore();
          startY += lineHeight;
        });
      };

      const maxW = w * 0.9;
      const lHeight = style.fontSize * 1.25;
      const centerX = style.alignment === 'center' ? w / 2 : style.alignment === 'left' ? w * 0.08 : w * 0.92;
      const centerY = h / 2;

      wrapText(ctx, txt, centerX, centerY, maxW, lHeight);
      ctx.restore();
    }
  };

  // Preview Loop on requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || isSyncMode || exportState === 'exporting') return;
    
    const updatePreview = () => {
      const audio = audioRef.current;
      if (audio) {
        setCurrentTime(audio.currentTime);
        drawCanvasFrame(previewCanvasRef.current, audio.currentTime, resolution);
      }
      animationFrameRef.current = requestAnimationFrame(updatePreview);
    };

    animationFrameRef.current = requestAnimationFrame(updatePreview);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, isSyncMode, style, resolution, lines]);

  // Redraw preview once if audio paused but styles or lines changed
  useEffect(() => {
    drawCanvasFrame(previewCanvasRef.current, currentTime, resolution);
  }, [style, resolution, lines, currentTime]);

  // Style Preset Selection
  const applyPreset = (preset) => {
    setStyle(preset);
  };

  // Web Audio mixing & canvas stream recording
  const handleExportVideo = async () => {
    if (!audioUrl || lines.length === 0) return;
    
    setExportState('exporting');
    setExportProgress(0);
    setIsPlaying(false);
    
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      
      const monitorNode = audioCtx.createGain();
      monitorNode.gain.value = muteDuringExport ? 0 : volume;

      source.connect(dest);
      source.connect(monitorNode);
      monitorNode.connect(audioCtx.destination);

      const recordCanvas = canvasRef.current;
      const fps = 30;
      
      drawCanvasFrame(recordCanvas, 0, resolution);
      
      const canvasStream = recordCanvas.captureStream(fps);
      const audioTrack = dest.stream.getAudioTracks()[0];
      const videoTrack = canvasStream.getVideoTracks()[0];
      
      const combinedStream = new MediaStream([videoTrack, audioTrack]);

      let options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 6000000 };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm', videoBitsPerSecond: 6000000 };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { videoBitsPerSecond: 6000000 };
      }

      const recorder = new MediaRecorder(combinedStream, options);
      recorderRef.current = recorder;

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const type = 'video/webm';
        const blob = new Blob(chunks, { type });
        const videoUrl = URL.createObjectURL(blob);
        setExportUrl(videoUrl);
        setExportState('completed');
        
        source.disconnect();
        monitorNode.disconnect();
        audioCtx.close();
      };

      const durationSeconds = audio.duration || 60;
      const progressTimer = setInterval(() => {
        const t = audio.currentTime;
        const progress = Math.min(Math.round((t / durationSeconds) * 100), 99);
        setExportProgress(progress);
        drawCanvasFrame(recordCanvas, t, resolution);
      }, 100);

      audio.onended = () => {
        clearInterval(progressTimer);
        setExportProgress(100);
        recorder.stop();
      };

      recorder.start();
      audio.play();

    } catch (err) {
      console.error(err);
      setError('Recording failed: ' + err.message);
      setExportState('error');
    }
  };

  return (
    <div style={{
      background: 'var(--bg-2)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr',
      minHeight: '80vh',
      gap: 24,
      padding: 24,
      overflow: 'hidden'
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <audio 
        ref={audioRef} 
        src={audioUrl} 
        crossOrigin="anonymous"
        onDurationChange={(e) => setDuration(e.target.duration)}
        onTimeUpdate={(e) => {
          if (!isPlaying) setCurrentTime(e.target.currentTime);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setIsSyncMode(false);
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ 
          display: 'flex', 
          background: 'var(--bg-3)', 
          padding: 4, 
          borderRadius: 8, 
          border: '1px solid var(--border)' 
        }}>
          {[
            { id: 'audio', label: '1. Audio Source' },
            { id: 'sync', label: '2. Timing Sync' },
            { id: 'style', label: '3. CAPTION STYLE' },
            { id: 'export', label: '4. BAKE VIDEO' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                background: activeTab === tab.id ? 'var(--text)' : 'transparent',
                color: activeTab === tab.id ? 'var(--bg)' : 'var(--text-3)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--red)',
            padding: 16,
            borderRadius: 'var(--radius)',
            color: 'var(--red)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <AlertTriangle size={18} />
            <div>{error}</div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Sourcing Method</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { id: 'local', label: 'Local MP3 Upload' },
                  { id: 'youtube', label: 'YouTube Video Import' },
                  { id: 'artist', label: 'Auto-Scrape Artist Release' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setAudioSource(method.id);
                      setError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: audioSource === method.id ? 'var(--bg-4)' : 'var(--bg-3)',
                      color: audioSource === method.id ? 'var(--accent)' : 'var(--text-3)',
                      border: `1px solid ${audioSource === method.id ? 'var(--text-3)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {audioSource === 'local' && (
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius)',
                padding: 40,
                textAlign: 'center',
                background: 'var(--bg-3)',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleAudioFileUpload}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
                  }}
                />
                <Upload size={32} color="var(--text-3)" style={{ margin: '0 auto 16px' }} />
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Drag & drop audio track</h4>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Supports MP3, WAV, M4A, AAC</p>
                {audioFile && (
                  <div style={{ 
                    marginTop: 16, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    padding: '6px 12px', 
                    borderRadius: 20, 
                    background: 'var(--bg-4)', 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: 'var(--green)' 
                  }}>
                    <Check size={14} /> {audioFile.name}
                  </div>
                )}
              </div>
            )}

            {audioSource === 'youtube' && (
              <form onSubmit={triggerAutoSourceJob} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>YouTube Video URL</label>
                  <input 
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    disabled={sourcingStatus !== 'idle' && sourcingStatus !== 'completed'}
                    style={{
                      width: '100%',
                      background: 'var(--bg-3)',
                      border: '1px solid var(--border)',
                      padding: 12,
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                      fontSize: 13
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sourcingStatus !== 'idle' && sourcingStatus !== 'completed'}
                  style={{
                    background: 'var(--text)',
                    color: 'var(--bg)',
                    padding: 14,
                    borderRadius: 'var(--radius)',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 2 }}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> Import & Transcribe
                </button>
              </form>
            )}

            {audioSource === 'artist' && (
              <form onSubmit={triggerAutoSourceJob} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Link Artist Persona</label>
                    <select
                      value={selectedPersonaId}
                      onChange={(e) => handlePersonaChange(e.target.value)}
                      disabled={sourcingStatus !== 'idle' && sourcingStatus !== 'completed'}
                      style={{
                        width: '100%',
                        background: 'var(--bg-3)',
                        border: '1px solid var(--border)',
                        padding: 12,
                        borderRadius: 'var(--radius)',
                        color: 'var(--text)',
                        fontSize: 13,
                        outline: 'none'
                      }}
                    >
                      <option value="">-- Choose Artist --</option>
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Or YouTube Channel URL</label>
                    <input 
                      type="text"
                      placeholder="https://youtube.com/channel/..."
                      value={customChannelUrl}
                      onChange={(e) => setCustomChannelUrl(e.target.value)}
                      disabled={sourcingStatus !== 'idle' && sourcingStatus !== 'completed'}
                      style={{
                        width: '100%',
                        background: 'var(--bg-3)',
                        border: '1px solid var(--border)',
                        padding: 12,
                        borderRadius: 'var(--radius)',
                        color: 'var(--text)',
                        fontSize: 13
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Sourcing Strategy</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { id: 'latest', label: 'Latest Video Release' },
                      { id: 'best', label: 'Best (Top Viewed Release)' }
                    ].map(strat => (
                      <button
                        key={strat.id}
                        type="button"
                        onClick={() => setArtistStrategy(strat.id)}
                        disabled={sourcingStatus !== 'idle' && sourcingStatus !== 'completed'}
                        style={{
                          flex: 1,
                          padding: 12,
                          background: artistStrategy === strat.id ? 'var(--bg-4)' : 'var(--bg-3)',
                          color: artistStrategy === strat.id ? 'var(--accent)' : 'var(--text-3)',
                          border: `1px solid ${artistStrategy === strat.id ? 'var(--text-3)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {strat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sourcingStatus !== 'idle' && sourcingStatus !== 'completed'}
                  style={{
                    background: 'var(--text)',
                    color: 'var(--bg)',
                    padding: 14,
                    borderRadius: 'var(--radius)',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={16} /> Auto-Scrape & Transcribe
                </button>
              </form>
            )}

            {sourcingStatus !== 'idle' && sourcingStatus !== 'completed' && (
              <div style={{
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16
              }}>
                <RefreshCw size={28} className="spin" color="var(--accent)" />
                <h4 style={{ fontSize: 14, fontWeight: 700 }}>Autonomous Sourcing in Progress</h4>
                <p style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>{sourcingProgress}</p>
                <div style={{ width: '100%', background: 'var(--bg-4)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                  <div className="sourcing-bar" style={{
                    width: sourcingStatus === 'processing' ? '70%' : '30%',
                    height: '100%',
                    background: 'var(--accent)',
                    transition: 'width 2s ease'
                  }} />
                </div>
              </div>
            )}

            {audioUrl && sourcingStatus === 'idle' && (
              <div style={{
                marginTop: 20,
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setActiveTab('sync')}
                  style={{
                    background: 'var(--bg-4)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius)',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  Configure Lyrics Timing <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sync' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            {!audioUrl ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                <Music size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Please load or source an audio track first in Step 1.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700 }}>Lyrics Timestamp Mapping</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleAddLine}
                      style={{
                        background: 'var(--bg-3)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Plus size={12} /> Add Line
                    </button>
                  </div>
                </div>

                <div style={{
                  background: isSyncMode ? 'rgba(138, 206, 0, 0.1)' : 'var(--bg-3)',
                  border: `1px solid ${isSyncMode ? '#8ACE00' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  padding: 20,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  {isSyncMode ? (
                    <>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#8ACE00', textTransform: 'uppercase' }}>Tap Synchronization Active</span>
                      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
                        "{lines[currentSyncIndex]?.text || 'Complete!'}"
                      </h2>
                      <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        Press the <strong style={{ color: '#8ACE00' }}>SPACEBAR</strong> or tap the button below exactly when you hear this line start in the song.
                      </p>
                      <button
                        onClick={handleTapSync}
                        style={{
                          background: '#8ACE00',
                          color: '#000000',
                          border: 'none',
                          padding: 16,
                          borderRadius: 30,
                          fontSize: 15,
                          fontWeight: 800,
                          cursor: 'pointer',
                          marginTop: 8
                        }}
                      >
                        TAP NOW (SPACE)
                      </button>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        Line {currentSyncIndex + 1} of {lines.length} • Click pause on player to pause.
                      </span>
                    </>
                  ) : (
                    <>
                      <h4 style={{ fontSize: 15, fontWeight: 700 }}>Interactive Tap Sync Tool</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 450, margin: '0 auto' }}>
                        Play the song and tap along to map each subtitle line's exact entry point. Highly accurate and offline-capable.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                        <button
                          onClick={handleStartSync}
                          style={{
                            background: 'var(--text)',
                            color: 'var(--bg)',
                            padding: '10px 20px',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Sparkles size={14} /> Start Tapping
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16, flex: 1, minHeight: 280 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Paste Plain Lyrics</label>
                    <textarea
                      placeholder="Paste raw lyrics line-by-line here..."
                      value={rawLyrics}
                      onChange={(e) => loadRawLyrics(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'var(--bg-3)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: 12,
                        color: 'var(--text)',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        resize: 'none',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Fine-Tune Timestamps</label>
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      maxHeight: 280,
                      background: 'var(--bg-3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}>
                      {lines.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                          No parsed lyrics yet. Paste raw text in the box.
                        </div>
                      ) : (
                        lines.map((line, idx) => (
                          <div 
                            key={line.id} 
                            style={{ 
                              display: 'flex', 
                              gap: 8, 
                              alignItems: 'center',
                              background: isSyncMode && idx === currentSyncIndex ? 'rgba(138, 206, 0, 0.15)' : 'var(--bg-4)',
                              border: `1px solid ${isSyncMode && idx === currentSyncIndex ? '#8ACE00' : 'transparent'}`,
                              padding: '4px 8px',
                              borderRadius: 4
                            }}
                          >
                            <input 
                              type="text"
                              value={line.time}
                              placeholder="00:00.00"
                              onChange={(e) => handleUpdateLineTime(line.id, e.target.value)}
                              style={{
                                width: 70,
                                background: 'var(--bg-3)',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                fontSize: 11,
                                fontFamily: 'monospace',
                                textAlign: 'center',
                                padding: '4px 2px',
                                borderRadius: 4
                              }}
                            />
                            <input 
                              type="text"
                              value={line.text}
                              onChange={(e) => handleUpdateLineText(line.id, e.target.value)}
                              style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text)',
                                fontSize: 12,
                                outline: 'none'
                              }}
                            />
                            <button
                              onClick={() => handleRemoveLine(line.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--red)',
                                cursor: 'pointer',
                                padding: 2
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Sync Tempo:</span>
                    {[0.75, 1.0, 1.25].map(rate => (
                      <button
                        key={rate}
                        onClick={() => {
                          setPlaybackRate(rate);
                          if (audioRef.current) audioRef.current.playbackRate = rate;
                        }}
                        style={{
                          background: playbackRate === rate ? 'var(--text)' : 'var(--bg-4)',
                          color: playbackRate === rate ? 'var(--bg)' : 'var(--text-2)',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTab('style')}
                    style={{
                      background: 'var(--bg-4)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius)',
                      fontWeight: 700,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer'
                    }}
                  >
                    Adjust Style Presets <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Visual Style Presets</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {STYLE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    style={{
                      background: style.id === preset.id ? 'var(--text)' : 'var(--bg-3)',
                      color: style.id === preset.id ? 'var(--bg)' : 'var(--text)',
                      border: style.id === preset.id ? 'none' : '1px solid var(--border)',
                      padding: 12,
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{preset.name}</span>
                    <span style={{ 
                      fontSize: 10, 
                      opacity: 0.7, 
                      fontFamily: preset.fontFamily,
                      textTransform: preset.textCase
                    }}>
                      abc overlay
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-3)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              padding: 16,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Font Typography</label>
                <select
                  value={style.fontFamily}
                  onChange={(e) => setStyle(prev => ({ ...prev, fontFamily: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-4)',
                    border: '1px solid var(--border)',
                    padding: 8,
                    borderRadius: 4,
                    color: 'var(--text)',
                    fontSize: 12,
                    outline: 'none'
                  }}
                >
                  <option value="Arial, sans-serif">Arial (Signature brat)</option>
                  <option value="Space Grotesk, sans-serif">Space Grotesk</option>
                  <option value="Courier New, monospace">Courier Monospace</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Impact, sans-serif">Impact (CapCut Heavy)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Font Size (px)</label>
                <input 
                  type="number"
                  min="20"
                  max="120"
                  value={style.fontSize}
                  onChange={(e) => setStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 48 }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-4)',
                    border: '1px solid var(--border)',
                    padding: 8,
                    borderRadius: 4,
                    color: 'var(--text)',
                    fontSize: 12
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Text Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input 
                    type="color"
                    value={style.textColor}
                    onChange={(e) => setStyle(prev => ({ ...prev, textColor: e.target.value }))}
                    style={{
                      background: 'none', border: 'none', width: 32, height: 32, cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{style.textColor}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Letter Case</label>
                <select
                  value={style.textCase}
                  onChange={(e) => setStyle(prev => ({ ...prev, textCase: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-4)',
                    border: '1px solid var(--border)',
                    padding: 8,
                    borderRadius: 4,
                    color: 'var(--text)',
                    fontSize: 12,
                    outline: 'none'
                  }}
                >
                  <option value="none">Normal Case</option>
                  <option value="lowercase">lowercase (brat style)</option>
                  <option value="uppercase">UPPERCASE (bold style)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Background Mode</label>
                <select
                  value={style.backgroundType}
                  onChange={(e) => setStyle(prev => ({ 
                    ...prev, 
                    backgroundType: e.target.value,
                    backgroundColor: e.target.value === 'transparent' ? 'transparent' : prev.backgroundColor === 'transparent' ? '#8ACE00' : prev.backgroundColor
                  }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-4)',
                    border: '1px solid var(--border)',
                    padding: 8,
                    borderRadius: 4,
                    color: 'var(--text)',
                    fontSize: 12,
                    outline: 'none'
                  }}
                >
                  <option value="color">Solid Background Color</option>
                  <option value="transparent">Transparent (For WebM Alpha Overlays)</option>
                </select>
              </div>

              {style.backgroundType === 'color' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Background Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input 
                      type="color"
                      value={style.backgroundColor}
                      onChange={(e) => setStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      style={{
                        background: 'none', border: 'none', width: 32, height: 32, cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{style.backgroundColor}</span>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Low-res Blur (pixelation effect)</label>
                <input 
                  type="range"
                  min="0"
                  max="4"
                  step="0.5"
                  value={style.blurAmount}
                  onChange={(e) => setStyle(prev => ({ ...prev, blurAmount: parseFloat(e.target.value) }))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{style.blurAmount}px (Brat cover uses slight offset blur)</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Active Lyric Transitions</label>
                <select
                  value={style.animationType}
                  onChange={(e) => setStyle(prev => ({ 
                    ...prev, 
                    animationType: e.target.value,
                    scaleBounce: e.target.value === 'scale' ? 1.25 : 1.0
                  }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-4)',
                    border: '1px solid var(--border)',
                    padding: 8,
                    borderRadius: 4,
                    color: 'var(--text)',
                    fontSize: 12,
                    outline: 'none'
                  }}
                >
                  <option value="cut">Snappy Cut (brat default)</option>
                  <option value="fade">Smooth Fade-In</option>
                  <option value="scale">Bounce Scale-Up (CapCut style)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActiveTab('export')}
                style={{
                  background: 'var(--text)',
                  color: 'var(--bg)',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                Go to Render Video <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {exportState === 'idle' && (
              <>
                <h4 style={{ fontSize: 14, fontWeight: 700 }}>Render Configuration</h4>
                
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Export Aspect Ratio</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { id: '9:16', label: 'Vertical Overlay (9:16 - TikTok/Shorts/CapCut)' },
                      { id: '16:9', label: 'Widescreen Overlay (16:9 - YouTube)' },
                      { id: '1:1', label: 'Square (1:1 - Instagram)' }
                    ].map(res => (
                      <button
                        key={res.id}
                        onClick={() => setResolution(res.id)}
                        style={{
                          flex: 1,
                          padding: 12,
                          background: resolution === res.id ? 'var(--bg-4)' : 'var(--bg-3)',
                          color: resolution === res.id ? 'var(--accent)' : 'var(--text-3)',
                          border: `1px solid ${resolution === res.id ? 'var(--text-3)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {res.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Mute Physical Audio During Render</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Render works in real-time. Toggle to mute speaker feedback while baking.</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={muteDuringExport}
                      onChange={(e) => setMuteDuringExport(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ borderBottom: '1px solid var(--border)', margin: '4px 0' }} />
                  
                  <span style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Sparkles size={14} color="#8ACE00" /> WebM exports with Alpha Transparency support are fully compatible with CapCut, Premiere, and After Effects.
                  </span>
                </div>

                <button
                  onClick={handleExportVideo}
                  style={{
                    background: '#8ACE00',
                    color: '#000',
                    padding: 16,
                    borderRadius: 'var(--radius)',
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                >
                  <FileVideo size={18} /> Bake Lyrics Sync Overlay Video
                </button>
              </>
            )}

            {exportState === 'exporting' && (
              <div style={{
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16
              }}>
                <RefreshCw size={36} className="spin" color="#8ACE00" />
                <h4 style={{ fontSize: 16, fontWeight: 800 }}>Baking Overlay Video...</h4>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>This will take as long as the duration of the audio clip.</p>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent)' }}>
                  {exportProgress}%
                </div>
                <div style={{ width: '100%', background: 'var(--bg-4)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div className="sourcing-bar" style={{
                    width: `${exportProgress}%`,
                    height: '100%',
                    background: '#8ACE00',
                    transition: 'width 0.1s linear'
                  }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  Capturing canvas frames at 30fps and encoding audio...
                </span>
              </div>
            )}

            {exportState === 'completed' && (
              <div style={{
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                textAlign: 'center'
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)'
                }}>
                  <Check size={32} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Baking Complete!</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Your synced overlay video is ready to download.</p>
                </div>

                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                  <button
                    onClick={() => {
                      setExportState('idle');
                      setExportUrl(null);
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--bg-4)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      padding: 12,
                      borderRadius: 'var(--radius)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Configure Style & Re-bake
                  </button>
                  <a
                    href={exportUrl}
                    download={`brat_lyrics_overlay_${Date.now()}.webm`}
                    style={{
                      flex: 1,
                      background: '#8ACE00',
                      color: '#000',
                      padding: 12,
                      borderRadius: 'var(--radius)',
                      fontWeight: 800,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={16} /> Download WebM
                  </a>
                </div>
                
                <div style={{ 
                  background: 'var(--bg-4)', 
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 11,
                  color: 'var(--text-2)',
                  textAlign: 'left',
                  marginTop: 8
                }}>
                  <strong>How to use in CapCut/Premiere:</strong>
                  <ol style={{ paddingLeft: 16, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <li>Import this WebM file into your editor.</li>
                    <li>Drop it onto a video track above your background visual layer.</li>
                    <li>{style.backgroundType === 'transparent' ? 'Since it has a transparent alpha channel, it should display immediately overlayed!' : 'Select the overlay clip, go to video settings -> chroma key -> click color picker and select the green background to key it out!'}</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 24,
        position: 'relative',
        minHeight: 500
      }}>
        <div style={{
          width: resolution === '9:16' ? 260 : resolution === '1:1' ? 360 : 420,
          height: resolution === '9:16' ? 462 : resolution === '1:1' ? 360 : 236,
          background: '#0a0a0a',
          borderRadius: resolution === '9:16' ? 36 : 8,
          border: '10px solid #1a1a1a',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}>
          <canvas 
            ref={previewCanvasRef} 
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'contain',
              backgroundImage: style.backgroundType === 'transparent' 
                ? 'radial-gradient(#111 20%, transparent 20%), radial-gradient(#111 20%, transparent 20%)'
                : 'none',
              backgroundPosition: '0 0, 8px 8px',
              backgroundSize: '16px 16px',
              backgroundColor: style.backgroundType === 'transparent' ? '#060606' : 'transparent',
            }} 
          />

          {isSyncMode && (
            <div style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(239, 68, 68, 0.85)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              padding: '4px 8px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Sync Mode
            </div>
          )}
        </div>

        {audioUrl && (
          <div style={{ 
            marginTop: 20, 
            width: '100%', 
            maxWidth: 420,
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)' }}>
                {formatSeconds(currentTime)}
              </span>
              <input 
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                disabled={isSyncMode || exportState === 'exporting'}
                style={{ flex: 1, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)' }}>
                {formatSeconds(duration)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  onClick={togglePlay}
                  disabled={isSyncMode || exportState === 'exporting'}
                  style={{
                    background: 'var(--text)',
                    color: 'var(--bg)',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
                  Preview Player
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => {
                    const newVol = volume === 0 ? 1 : 0;
                    setVolume(newVol);
                    if (audioRef.current) audioRef.current.volume = newVol;
                  }}
                  style={{ background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}
                >
                  {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  style={{ width: 60, height: 2, cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1.2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
