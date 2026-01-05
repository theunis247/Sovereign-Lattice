import React, { useState } from 'react';
import { SolvedBlock, User } from '../types';
import { PremiumPDFGenerator, createCertificateData } from '../services/pdfGenerator';

interface CertificatePreviewProps {
  block: SolvedBlock;
  user: User;
}

/**
 * Preview component showing what the billion-dollar NFT certificate will look like
 */
const CertificatePreview: React.FC<CertificatePreviewProps> = ({ block, user }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const certificateData = createCertificateData(block, user);
      
      const blob = await PremiumPDFGenerator.generateCertificate(
        certificateData,
        (progressUpdate) => {
          setProgress(progressUpdate.progress);
          setProgressMessage(progressUpdate.message);
        }
      );

      // Download the premium certificate
      PremiumPDFGenerator.downloadPDF(blob, block, user);
      
    } catch (error) {
      console.error('Certificate generation failed:', error);
      alert('Failed to generate certificate: ' + error.message);
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const gradeColors = {
    'S': '#FF6B35', // Rare Orange
    'A': '#9B59B6', // Royal Purple
    'B': '#3498DB', // Premium Blue
    'C': '#2ECC71'  // Success Green
  };

  const grade = block.grade || 'C';
  const gradeColor = gradeColors[grade as keyof typeof gradeColors];

  return (
    <div className="certificate-preview" style={{
      background: 'linear-gradient(135deg, #0B1426 0%, #1a2332 100%)',
      color: '#FAFAFA',
      padding: '30px',
      borderRadius: '15px',
      border: '2px solid #D4AF37',
      maxWidth: '600px',
      margin: '20px auto',
      fontFamily: 'Times, serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ 
          color: '#D4AF37', 
          fontSize: '28px', 
          marginBottom: '10px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          QUANTUM BREAKTHROUGH
        </h1>
        <h2 style={{ 
          color: '#E5E4E2', 
          fontSize: '18px', 
          marginBottom: '20px',
          fontWeight: 'normal'
        }}>
          SCIENTIFIC ACHIEVEMENT CERTIFICATE
        </h2>
        
        {/* Grade Badge */}
        <div style={{
          display: 'inline-block',
          backgroundColor: gradeColor,
          color: 'white',
          padding: '8px 16px',
          borderRadius: '50px',
          fontSize: '14px',
          fontWeight: 'bold',
          border: '2px solid #0B1426',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          GRADE {grade}
        </div>
      </div>

      <div style={{ marginBottom: '25px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', marginBottom: '15px', color: '#E5E4E2' }}>
          This certifies that the scientific breakthrough detailed below has been<br/>
          validated, authenticated, and recorded on the Sovereign Lattice blockchain.
        </p>
        
        <h3 style={{ 
          color: '#D4AF37', 
          fontSize: '22px', 
          marginBottom: '15px',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {user.username}
        </h3>
      </div>

      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ 
          color: '#D4AF37', 
          fontSize: '16px', 
          marginBottom: '10px',
          textAlign: 'center',
          borderBottom: '1px solid #D4AF37',
          paddingBottom: '5px'
        }}>
          BREAKTHROUGH DETAILS
        </h4>
        
        <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '10px', textAlign: 'center' }}>
            <strong>{block.problem.substring(0, 100)}...</strong>
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
            <div>
              <strong style={{ color: '#D4AF37' }}>Advancement Level:</strong><br/>
              Mk {block.advancementLevel || 1}
            </div>
            <div>
              <strong style={{ color: '#D4AF37' }}>Block ID:</strong><br/>
              {block.id}
            </div>
            <div>
              <strong style={{ color: '#D4AF37' }}>Timestamp:</strong><br/>
              {block.timestamp}
            </div>
            <div>
              <strong style={{ color: '#D4AF37' }}>Score:</strong><br/>
              {block.breakthroughScore || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        borderTop: '1px solid #D4AF37', 
        paddingTop: '20px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#E5E4E2',
            margin: '0 auto 10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#0B1426',
            border: '2px solid #D4AF37'
          }}>
            QR CODE<br/>
            VERIFICATION
          </div>
          <p style={{ fontSize: '10px', color: '#E5E4E2' }}>
            Scan to verify authenticity on blockchain
          </p>
        </div>

        <button
          onClick={handleGeneratePreview}
          disabled={isGenerating}
          style={{
            backgroundColor: isGenerating ? '#666' : '#D4AF37',
            color: '#0B1426',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
        >
          {isGenerating ? `Generating... ${progress}%` : 'Generate Premium Certificate PDF'}
        </button>

        {isGenerating && (
          <div style={{ marginTop: '15px' }}>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#333',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#D4AF37',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ fontSize: '12px', marginTop: '8px', color: '#E5E4E2' }}>
              {progressMessage}
            </p>
          </div>
        )}

        <div style={{ 
          marginTop: '20px', 
          fontSize: '10px', 
          color: '#999',
          borderTop: '1px solid #333',
          paddingTop: '15px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <em>Sovereign Lattice Authority</em><br/>
              Scientific Validation Council
            </div>
            <div style={{ textAlign: 'right' }}>
              <em>Quantum Breakthrough System</em><br/>
              © 2026 All Rights Reserved
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(212, 175, 55, 0.3)'
      }}>
        <h4 style={{ color: '#D4AF37', fontSize: '14px', marginBottom: '10px' }}>
          🏆 Billion-Dollar Certificate Features:
        </h4>
        <ul style={{ fontSize: '12px', lineHeight: '1.5', paddingLeft: '20px' }}>
          <li>Museum-quality typography and layout</li>
          <li>Grade-specific premium color schemes</li>
          <li>High-resolution QR codes for blockchain verification</li>
          <li>Security watermarks and authenticity markers</li>
          <li>Professional A4 format suitable for framing</li>
          <li>Unique serial numbers and digital signatures</li>
          <li>Luxury gold and navy color palette</li>
          <li>Tamper-evident design elements</li>
        </ul>
      </div>
    </div>
  );
};

export default CertificatePreview;