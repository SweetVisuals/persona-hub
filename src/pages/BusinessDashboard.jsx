import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../components/BusinessContext';
import { supabase } from '../lib/supabase';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/Card';
import { 
  Plus, Search, Edit2, Eye, Trash2, ChevronUp, ChevronDown, 
  Users, Wifi, TrendingUp, CheckSquare, Square 
} from 'lucide-react';

export default function BusinessDashboard() {
  const { business, personas, loading, refetchPersonas } = useBusiness();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [strategiesCount, setStrategiesCount] = useState({});
  const [postsCount, setPostsCount] = useState({});

  useEffect(() => {
    if (!personas || personas.length === 0) return;

    const fetchCounts = async () => {
      const personaIds = personas.map(p => p.id);
      
      // Fetch strategy counts
      const { data: stratData } = await supabase
        .from('strategies')
        .select('persona_id, id');
        
      if (stratData) {
        const counts = {};
        stratData.forEach(s => {
          if (personaIds.includes(s.persona_id)) {
            counts[s.persona_id] = (counts[s.persona_id] || 0) + 1;
          }
        });
        setStrategiesCount(counts);
      }

      // Fetch queued posts counts
      const { data: postsData } = await supabase
        .from('posts')
        .select('persona_id, id')
        .eq('status', 'queued');
        
      if (postsData) {
        const counts = {};
        postsData.forEach(p => {
          if (personaIds.includes(p.persona_id)) {
            counts[p.persona_id] = (counts[p.persona_id] || 0) + 1;
          }
        });
        setPostsCount(counts);
      }
    };

    fetchCounts();
  }, [personas]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleStatus = async (e, personaId, currentStatus) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await supabase.from('personas').update({ status: newStatus }).eq('id', personaId);
    refetchPersonas();
  };

  const toggleSelection = (e, id) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredAndSortedPersonas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedPersonas.map(p => p.id)));
    }
  };

  const handleBulkAction = async (action) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (action === 'delete') {
      if (!window.confirm('Are you sure you want to delete selected personas?')) return;
      await supabase.from('personas').delete().in('id', ids);
    } else {
      await supabase.from('personas').update({ status: action }).in('id', ids);
    }
    
    setSelectedIds(new Set());
    refetchPersonas();
  };

  const filteredAndSortedPersonas = useMemo(() => {
    if (!personas) return [];
    
    let result = personas.filter(p => {
      const matchName = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchHandle = p.handle?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchHandle;
    });

    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'reach') {
        aVal = a.social_accounts?.reduce((sum, acc) => sum + (acc.followers || 0), 0) || 0;
        bVal = b.social_accounts?.reduce((sum, acc) => sum + (acc.followers || 0), 0) || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [personas, searchTerm, sortConfig]);

  if (loading || !business) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-2)' }}>
        Loading dashboard...
      </div>
    );
  }

  // Calculate KPIs
  const totalPersonas = personas?.length || 0;
  const activeAccounts = personas?.reduce((sum, p) => sum + (p.social_accounts?.length || 0), 0) || 0;
  const totalReach = personas?.reduce((sum, p) => {
    return sum + (p.social_accounts?.reduce((accSum, acc) => accSum + (acc.followers || 0), 0) || 0);
  }, 0) || 0;
  const queuedPosts = Object.values(postsCount).reduce((sum, count) => sum + count, 0);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} style={{ marginLeft: 4 }} /> : <ChevronDown size={14} style={{ marginLeft: 4 }} />;
  };

  return (
    <div style={{ padding: 32, maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Top Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>{business.name}</h1>
          {business.goal && (
            <p style={{ color: 'var(--text-2)', fontSize: 15, margin: 0 }}>{business.goal}</p>
          )}
        </div>
        <button 
          onClick={() => navigate('personas/new')}
          style={{
            background: 'var(--text)',
            color: 'var(--bg)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Plus size={18} />
          New Persona
        </button>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            <Users size={18} />
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Personas</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalPersonas}</div>
        </Card>
        
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            <Wifi size={18} />
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Accounts</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{activeAccounts}</div>
        </Card>
        
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Reach</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalReach.toLocaleString()}</div>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            <CheckSquare size={18} />
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Queued Posts</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{queuedPosts}</div>
        </Card>
      </div>

      {/* Main Table Section */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        
        {/* Table Toolbar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-2)' }}>
          
          {selectedIds.size > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedIds.size} selected</span>
              <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
              <button onClick={() => handleBulkAction('paused')} style={{ background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 500, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>Pause Selected</button>
              <button onClick={() => handleBulkAction('active')} style={{ background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 500, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>Activate Selected</button>
              <button onClick={() => handleBulkAction('delete')} style={{ background: 'transparent', color: 'var(--red)', fontSize: 13, fontWeight: 500, padding: '6px 12px', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)' }}>Delete Selected</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-3)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: 300 }}>
              <Search size={16} color="var(--text-3)" />
              <input 
                type="text" 
                placeholder="Search personas..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', width: '100%', fontSize: 14 }}
              />
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)' }}>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: 48, position: 'sticky', top: 0, zIndex: 10 }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size > 0 && selectedIds.size === filteredAndSortedPersonas.length}
                    ref={input => {
                      if (input) {
                        input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredAndSortedPersonas.length;
                      }
                    }}
                    onChange={toggleAll}
                  />
                </th>
                <th onClick={() => handleSort('status')} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Status <SortIcon columnKey="status" /></div>
                </th>
                <th onClick={() => handleSort('name')} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Persona <SortIcon columnKey="name" /></div>
                </th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 10 }}>
                  Linked Accounts
                </th>
                <th onClick={() => handleSort('reach')} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>Reach <SortIcon columnKey="reach" /></div>
                </th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 10 }}>
                  Trend (7d)
                </th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 10 }}>
                  Strategies
                </th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right', position: 'sticky', top: 0, zIndex: 10 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPersonas.map((persona, i) => {
                const isSelected = selectedIds.has(persona.id);
                const isActive = persona.status === 'active';
                const reach = persona.social_accounts?.reduce((sum, acc) => sum + (acc.followers || 0), 0) || 0;
                
                return (
                  <tr 
                    key={persona.id}
                    onClick={() => navigate(`p/${persona.id}`)}
                    style={{
                      background: isSelected ? 'var(--bg-3)' : (i % 2 === 0 ? 'var(--bg-2)' : 'var(--bg)'),
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'var(--bg-3)' : (i % 2 === 0 ? 'var(--bg-2)' : 'var(--bg)')}
                  >
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => toggleSelection(e, persona.id)}
                      />
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                      <button 
                        onClick={(e) => toggleStatus(e, persona.id, persona.status)}
                        style={{
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 4,
                          borderRadius: '50%'
                        }}
                        title={isActive ? 'Pause' : 'Activate'}
                      >
                        <div style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: isActive ? 'var(--green)' : 'var(--text-3)',
                          boxShadow: isActive ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'
                        }} />
                      </button>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: persona.color || 'var(--bg-4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16
                        }}>
                          {persona.avatar || '👤'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{persona.name}</div>
                          <div style={{ color: 'var(--text-3)', fontSize: 12 }}>{persona.handle || '@handle'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {persona.social_accounts?.map(acc => (
                          <PlatformBadge key={acc.id} platform={acc.platform} size="sm" />
                        ))}
                        {(!persona.social_accounts || persona.social_accounts.length === 0) && (
                          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>None</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>
                      {reach.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>
                      —
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                      {strategiesCount[persona.id] !== undefined ? (
                        <div style={{ background: 'var(--bg-4)', display: 'inline-flex', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                          {strategiesCount[persona.id]}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`personas/${persona.id}/edit`); }}
                          style={{ background: 'var(--bg-3)', color: 'var(--text-2)', padding: 8, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`p/${persona.id}`); }}
                          style={{ background: 'var(--bg-3)', color: 'var(--text-2)', padding: 8, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSortedPersonas.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
                    No personas found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
    </div>
  );
}
