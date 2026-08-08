import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, Search, Bell, List, UserCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { useBusiness } from './BusinessContext';

export default function BusinessTopbar({ businessId, personaId, onToggleLogs, onOpenQueue }) {
  const navigate = useNavigate();
  const { business } = useBusiness();

  const businessLinks = [
    { name: 'Dashboard', path: `/b/${businessId}` },
    { name: 'Strategies', path: `/b/${businessId}/strategies` },
    { name: 'Drafting', path: `/b/${businessId}/drafting` },
    { name: 'Calendar', path: `/b/${businessId}/calendar` },
    { name: 'Files', path: `/b/${businessId}/files` },
    { name: 'Settings', path: `/b/${businessId}/settings` },
  ];

  const personaLinks = [
    { name: 'Overview', path: `/b/${businessId}/p/${personaId}` },
    { name: 'Accounts', path: `/b/${businessId}/p/${personaId}/accounts` },
    { name: 'Strategies', path: `/b/${businessId}/p/${personaId}/strategies` },
    { name: 'Content', path: `/b/${businessId}/p/${personaId}/content` },
    { name: 'Sources', path: `/b/${businessId}/p/${personaId}/sources` },
    { name: 'Analytics', path: `/b/${businessId}/p/${personaId}/analytics` },
  ];

  const links = personaId ? personaLinks : businessLinks;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: 56,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      fontSize: 14
    }}>
      {/* Left Side */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* Logo */}
        <div 
          onClick={() => navigate('/choose-account')}
          style={{ width: 32, height: 32, background: 'var(--text)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: 20 }}
        >
          <Zap size={18} color="var(--bg)" fill="var(--bg)" />
        </div>

        {/* Context / Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 32, gap: 8 }}>
          <div 
            onClick={() => navigate(`/choose-account`)}
            style={{ fontWeight: 600, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {business?.name || 'Loading...'}
            <ChevronDown size={14} color="var(--text-3)" />
          </div>
          
          {personaId && (
            <>
              <ChevronRight size={16} color="var(--text-3)" />
              <div 
                onClick={() => navigate(`/b/${businessId}`)}
                style={{ fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer' }}
              >
                Back to Dashboard
              </div>
            </>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', height: '100%', gap: 4 }}>
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.name === 'Dashboard' || link.name === 'Overview'}
              style={({ isActive }) => ({
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                color: isActive ? 'var(--text)' : 'var(--text-3)',
                background: isActive ? 'var(--bg-3)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                borderBottom: isActive ? '2px solid var(--text)' : '2px solid transparent',
              })}
            >
              {link.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input 
            type="text" 
            placeholder="Search..." 
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '6px 16px 6px 32px',
              color: 'var(--text)',
              fontSize: 13,
              width: 200,
              outline: 'none'
            }} 
          />
        </div>

        {/* Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-2)' }}>
          <button onClick={onToggleLogs} style={{ background: 'transparent', color: 'inherit', padding: 4, position: 'relative', cursor: 'pointer' }}>
            <Bell size={20} />
            <div style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, background: 'var(--red)', borderRadius: '50%' }}></div>
          </button>
          <button onClick={onOpenQueue} style={{ background: 'transparent', color: 'inherit', padding: 4, cursor: 'pointer' }}>
            <List size={20} />
          </button>
        </div>

        {/* Drafting CTA */}
        <button 
          onClick={() => navigate(`/b/${businessId}/drafting`)}
          style={{ background: 'var(--text)', color: 'var(--bg)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}
        >
          DRAFTING
        </button>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, cursor: 'pointer' }}>
          <UserCircle size={24} color="var(--text-2)" />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Admin</span>
        </div>
      </div>
    </div>
  );
}
