import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

export default function StepConfirm({ lyricsData, styleData, audioData }) {
  const navigate = useNavigate();
  const { businessId } = useParams();

  const handleGoToStrategies = () => {
    navigate(`/b/${businessId}/strategies`);
  };

  return (
    <div className="step-content glass">
      <div className="confirm-container">
        <div className="success-icon">
          <Check size={32} />
        </div>
        
        <h2>Lyrics Verified!</h2>
        <p style={{ color: 'var(--text-2, #aaa)' }}>
          Your lyrics have been successfully mapped to the audio and saved.
        </p>

        <div className="confirm-details">
          <div className="detail-row">
            <span className="detail-label">Audio Source</span>
            <span className="detail-value">{audioData?.type === 'youtube' ? 'YouTube' : 'Uploaded File'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Lines Mapped</span>
            <span className="detail-value">{lyricsData?.length || 0} lines</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Style Preset</span>
            <span className="detail-value">{styleData?.name || 'Custom'}</span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleGoToStrategies} style={{ marginTop: '1rem' }}>
          Go to Strategies
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
