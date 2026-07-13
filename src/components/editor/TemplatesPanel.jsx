import { useState } from 'react';
import { MOCK_TEMPLATES, TEMPLATE_CATEGORIES, STYLE_PRESETS } from './editorData';
import { Search, Plus } from 'lucide-react';
import './TemplatesPanel.css';

export default function TemplatesPanel({ selectedTemplateId, onSelectTemplate, personas = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTemplates = MOCK_TEMPLATES.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="templates-panel">
      <div className="panel-header">
        <span className="panel-title">Templates</span>
      </div>

      <div className="search-container">
        <Search size={14} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search templates..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="categories-scroll">
        {TEMPLATE_CATEGORIES.map(category => (
          <button 
            key={category}
            className={`category-pill ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="templates-grid-container">
        <div className="templates-grid">
          {filteredTemplates.map((template, index) => (
            <div 
              key={template.id} 
              className={`template-card ${selectedTemplateId === template.id ? 'selected' : ''}`}
              onClick={() => onSelectTemplate?.(template)}
            >
              <div 
                className="template-thumbnail" 
                style={{ 
                  aspectRatio: template.aspectRatio.replace(':', '/'),
                  background: `linear-gradient(135deg, hsl(${index * 45}, 60%, 20%), hsl(${index * 45 + 60}, 60%, 15%))`
                }}
              >
                <div className="persona-assign-btn" title="Assign Persona" onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement persona assignment dropdown
                }}>
                  <Plus size={12} />
                </div>
              </div>
              <div className="template-info">
                <div className="template-name">{template.name}</div>
                <div className="template-desc">{template.description}</div>
                <div className="template-badge">{template.aspectRatio}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="style-presets-section">
          <div className="section-title">Style Presets</div>
          <div className="presets-list">
            {STYLE_PRESETS.map(preset => (
              <div key={preset.id} className="preset-row">
                <div className="color-swatches">
                  {preset.colors.map((color, i) => (
                    <div key={i} className="color-swatch" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="preset-info">
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-font">{preset.font}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="apply-section">
        <button className="apply-btn" disabled={!selectedTemplateId}>
          Apply to Project
        </button>
      </div>
    </div>
  );
}
