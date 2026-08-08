import React, { useState, useEffect } from 'react';
import Card from './Card';
import { supabase } from '../lib/supabase';
import { X, Calendar, Clock, Type, Layout, CheckCircle, Image as ImageIcon, Video } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, initialData = null, onSuccess }) {
  const [personas, setPersonas] = useState([]);
  const [formData, setFormData] = useState({
    persona_id: '',
    platform: 'tiktok',
    content: '',
    type: 'Video',
    status: 'scheduled',
    scheduledDate: '',
    scheduledTime: '12:00',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      const { data } = await supabase.from('personas').select('id, name');
      if (data) {
        setPersonas(data);
        if (!initialData && data.length > 0) {
          setFormData(prev => ({ ...prev, persona_id: data[0].id }));
        }
      }
    };
    if (isOpen) {
      fetchPersonas();
      if (initialData) {
        const d = new Date(initialData.scheduled_for);
        const dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        const timeStr = !isNaN(d.getTime()) ? d.toTimeString().slice(0, 5) : '';
        
        setFormData({
          persona_id: initialData.persona_id || '',
          platform: initialData.platform || 'tiktok',
          content: initialData.content || '',
          type: initialData.type || 'Video',
          status: initialData.status || 'scheduled',
          scheduledDate: dateStr,
          scheduledTime: timeStr,
        });
      } else {
        // Default to tomorrow 12:00 PM if no initial data
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData(prev => ({
          ...prev,
          scheduledDate: tomorrow.toISOString().split('T')[0],
          scheduledTime: '12:00',
        }));
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Combine date and time to ISO string
    let scheduled_for = null;
    if (formData.scheduledDate && formData.scheduledTime) {
       const dateObj = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`);
       scheduled_for = dateObj.toISOString();
    } else {
       scheduled_for = new Date().toISOString();
    }

    const payload = {
      persona_id: formData.persona_id,
      platform: formData.platform,
      content: formData.content,
      type: formData.type,
      status: formData.status,
      scheduled_for,
    };

    try {
      if (initialData && initialData.id) {
        const { error } = await supabase.from('automation_tasks').update(payload).eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('automation_tasks').insert(payload);
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Error saving task: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const platforms = ['tiktok', 'instagram', 'youtube', 'snapchat', 'pinterest', 'twitter'];
  const types = ['Video', 'Image', 'Text'];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(8px)' }}>
      <Card className="glass" style={{ width: 500, padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={20} /></button>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>
          {initialData ? 'Edit Task' : 'New Task'}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                Persona
              </label>
              <select 
                value={formData.persona_id}
                onChange={e => setFormData({...formData, persona_id: e.target.value})}
                style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                required
              >
                {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                Platform
              </label>
              <select 
                value={formData.platform}
                onChange={e => setFormData({...formData, platform: e.target.value})}
                style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, textTransform: 'capitalize' }}
              >
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
              <Type size={14} /> Content
            </label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              placeholder="Enter post description, caption, or script..."
              style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, minHeight: 80, resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                  <Layout size={14} /> Type
                </label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
             
             <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Status
                </label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
             </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                  <Calendar size={14} /> Date
                </label>
                <input 
                  type="date"
                  value={formData.scheduledDate}
                  onChange={e => setFormData({...formData, scheduledDate: e.target.value})}
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                  required
                />
             </div>
             
             <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                  <Clock size={14} /> Time
                </label>
                <input 
                  type="time"
                  value={formData.scheduledTime}
                  onChange={e => setFormData({...formData, scheduledTime: e.target.value})}
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                  required
                />
             </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} disabled={isSaving} style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '20px', fontSize: 14, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '10px 24px', borderRadius: '20px', fontSize: 14, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.5 : 1 }}>
              {isSaving ? 'Saving...' : <><CheckCircle size={18} /> Save</>}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
