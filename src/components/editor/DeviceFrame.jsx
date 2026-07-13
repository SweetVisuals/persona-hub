import './DeviceFrame.css';

export default function DeviceFrame({ device, children }) {
  return (
    <div className={`device-frame-wrapper ${device}`}>
      <div className={`device-frame ${device}`}>
        {device === 'phone' && <div className="notch"></div>}
        <div className="device-screen">
          {children}
        </div>
      </div>
    </div>
  );
}
