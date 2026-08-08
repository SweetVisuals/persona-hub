import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Music, Edit3, CheckCircle } from 'lucide-react';
import StepAudio from '../components/drafting/StepAudio';
import StepLyrics from '../components/drafting/StepLyrics';
import StepConfirm from '../components/drafting/StepConfirm';
import './Drafting.css';

export default function Drafting() {
  const { businessId } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [audioData, setAudioData] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);
  const [styleData, setStyleData] = useState(null);

  const handleAudioNext = (data) => {
    setAudioData(data);
    setCurrentStep(2);
  };

  const handleVerify = async (lyrics, style) => {
    setLyricsData(lyrics);
    setStyleData(style);
    
    // Mock save to supabase
    console.log('Saving to verified_lyrics...', {
      businessId,
      audioId: audioData?.id,
      lyrics,
      style
    });
    
    setCurrentStep(3);
  };

  const steps = [
    { id: 1, title: 'Audio', icon: Music },
    { id: 2, title: 'Edit & Verify', icon: Edit3 },
    { id: 3, title: 'Confirm', icon: CheckCircle },
  ];

  return (
    <div className="drafting-container">
      <div className="drafting-header">
        <h1>Drafting Wizard</h1>
        
        <div className="step-indicator">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
                <div className="step-number">
                  {currentStep > step.id ? <CheckCircle size={14} /> : step.id}
                </div>
                <span>{step.title}</span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`step-separator ${currentStep > step.id ? 'active' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="drafting-body">
        {currentStep === 1 && (
          <StepAudio onNext={handleAudioNext} />
        )}
        
        {currentStep === 2 && (
          <StepLyrics 
            audioData={audioData} 
            onVerify={handleVerify} 
          />
        )}
        
        {currentStep === 3 && (
          <StepConfirm 
            lyricsData={lyricsData}
            styleData={styleData}
            audioData={audioData}
          />
        )}
      </div>
    </div>
  );
}
