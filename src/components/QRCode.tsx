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
  // For now, we'll create a placeholder QR code
  // In a real app, you'd use a QR code library like qrcode.js
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;

  return (
    <div className={`qr-code ${className}`}>
      <img
        src={qrCodeUrl}
        alt={`QR Code for ${value}`}
        className="qr-code-image"
        style={{ border: '1px solid #ccc', borderRadius: '4px' }}
      />
    </div>
  );
};

export default QRCode;
