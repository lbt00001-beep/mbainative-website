"use client";

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      console.log('Tooltip trigger rect:', rect);
      setCoords({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX + (rect.width / 2),
      });
    }
  };

  const show = () => {
    console.log('Tooltip: Mouse Enter');
    updateCoords();
    setVisible(true);
  };

  const hide = () => {
    console.log('Tooltip: Mouse Leave');
    setVisible(false);
  };

  // Close on scroll to avoid floating weirdly
  useEffect(() => {
    if (visible) {
      window.addEventListener('scroll', updateCoords);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [visible]);

  if (!mounted) return <div style={{ display: 'inline-block' }}>{children}</div>;

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{ display: 'inline-block', cursor: 'help' }}
      >
        {children}
      </div>
      {visible && createPortal(
        <div 
            style={{
                position: 'absolute',
                top: coords.top,
                left: coords.left,
                transform: 'translateX(-50%)',
                zIndex: 99999,
                backgroundColor: '#1F2937',
                color: '#F9FAFB',
                padding: '12px',
                borderRadius: '8px',
                width: '280px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                border: '1px solid #4B5563',
                fontSize: '12px',
                lineHeight: '1.5',
                pointerEvents: 'none'
            }}
        >
            {/* Arrow pointing up */}
            <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                marginLeft: '-6px',
                borderWidth: '6px',
                borderStyle: 'solid',
                borderColor: 'transparent transparent #1F2937 transparent'
            }}></div>
            {content}
        </div>,
        document.body
      )}
    </>
  );
}
