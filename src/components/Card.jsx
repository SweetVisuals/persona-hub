export default function Card({ children, style = {}, className = '' }) {
  return (
    <div 
      className={`glass ${className}`}
      style={{
        borderRadius: 'var(--radius)',
        padding: '24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
