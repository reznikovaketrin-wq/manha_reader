'use client';

import { memo, useState } from 'react';

interface TitleBlockProps {
  title: string;
  description: string;
  isMobile: boolean;
}

/**
 * TitleBlock - мемоизированный блок заголовка и описания
 * Адаптивный дизайн для desktop и mobile
 */
export const TitleBlock = memo(function TitleBlock({
  title,
  description,
  isMobile,
}: TitleBlockProps) {
  const [expandedDescription, setExpandedDescription] = useState(false);

  const descriptionLines = description.split('\n');
  const isLongDescription = descriptionLines.length > 3 || description.length > 200;
  const displayDescription = expandedDescription ? description : descriptionLines.slice(0, 2).join('\n');

  return (
    <div>
      {/* Заголовок */}
      <h1
        className="title"
        style={{
          fontSize: isMobile ? '32px' : '38px',
          fontWeight: '700',
          color: '#FFFFFF',
          marginBottom: isMobile ? '2px' : '32px',
          lineHeight: '1.2',
          textAlign: isMobile ? 'center' : 'left',
        }}
      >
        {title}
      </h1>

      {/* Описание - только на desktop */}
      {!isMobile && (
        <div style={{ marginBottom: '28px' }}>
          <p
            className="description"
            style={{
              color: '#CFCFCF',
              lineHeight: '1.45',
              marginBottom: '12px',
              fontSize: '17px',
              fontWeight: '400',
              maxWidth: '780px',
              display: !expandedDescription && isLongDescription ? '-webkit-box' : 'block',
              WebkitLineClamp: !expandedDescription && isLongDescription ? 3 : 'unset',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {displayDescription}
          </p>
          {isLongDescription && (
            <button
              onClick={() => setExpandedDescription(!expandedDescription)}
              style={{
                color: '#A259FF',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'color 0.2s',
                padding: 0,
              }}
            >
              {expandedDescription ? 'Сховати' : 'Розгорнути повністю'}
            </button>
          )}
        </div>
      )}

     
      
    </div>
  );
});