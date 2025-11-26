import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 128,
  className = ""
}) => {
  // Use QR code API with settings optimized for long-distance scanning:
  // - ecc=L (Low error correction) = larger modules, easier to scan from distance
  // - qzone=1 (minimal quiet zone)
  // - Higher resolution for cleaner scaling
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&ecc=L&qzone=1&data=${encodeURIComponent(value)}`;

  return (
    <div className={`qr-code ${className}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: 'auto' }}>
      <img
        src={qrCodeUrl}
        alt={`QR Code for ${value}`}
        className="qr-code-image"
        style={{ border: '1px solid #ccc', borderRadius: '4px', height: '100%', width: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
};

export default QRCode;
