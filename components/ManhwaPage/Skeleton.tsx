'use client';

import styles from './Skeleton.module.css';

export function ManhwaPageSkeleton() {
  return (
    <div style={{ padding: '24px', backgroundColor: '#0A0A0A' }}>
      {/* Cover и Title skeleton */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        {/* Cover image */}
        <div
          className={styles.shimmer}
          style={{
            width: '200px',
            height: '300px',
            borderRadius: '12px',
            flexShrink: 0,
            backgroundColor: '#1A1A1A',
          }}
        />

        {/* Title и описание */}
        <div style={{ flex: 1 }}>
          {/* Title skeleton */}
          <div
            className={styles.shimmer}
            style={{
              height: '40px',
              backgroundColor: '#1A1A1A',
              borderRadius: '8px',
              marginBottom: '16px',
              width: '60%',
            }}
          />

          {/* Subtitle skeleton */}
          <div
            className={styles.shimmer}
            style={{
              height: '20px',
              backgroundColor: '#1A1A1A',
              borderRadius: '8px',
              marginBottom: '24px',
              width: '40%',
            }}
          />

          {/* Metadata skeleton - 3 блока */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={styles.shimmer}
                style={{
                  height: '60px',
                  flex: 1,
                  backgroundColor: '#1A1A1A',
                  borderRadius: '8px',
                }}
              />
            ))}
          </div>

          {/* Description skeleton - 3 строки */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={styles.shimmer}
              style={{
                height: '16px',
                backgroundColor: '#1A1A1A',
                borderRadius: '8px',
                marginBottom: '12px',
                width: i === 3 ? '80%' : '100%',
              }}
            />
          ))}
        </div>
      </div>

      {/* Chapters list skeleton */}
      <div style={{ marginBottom: '32px' }}>
        <div
          className={styles.shimmer}
          style={{
            height: '24px',
            backgroundColor: '#1A1A1A',
            borderRadius: '8px',
            marginBottom: '16px',
            width: '200px',
          }}
        />

        {/* 5 chapter items */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={styles.shimmer}
            style={{
              height: '48px',
              backgroundColor: '#1A1A1A',
              borderRadius: '8px',
              marginBottom: '12px',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChaptersSkeletonLoader() {
  return (
    <div style={{ padding: '20px' }}>
      <div
        className={styles.shimmer}
        style={{
          height: '24px',
          backgroundColor: '#1A1A1A',
          borderRadius: '8px',
          marginBottom: '16px',
          width: '200px',
        }}
      />

      {/* 5 chapter item skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={styles.shimmer}
          style={{
            height: '48px',
            backgroundColor: '#1A1A1A',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        />
      ))}
    </div>
  );
}

export function CommentsSkeletonLoader() {
  return (
    <div style={{ padding: '20px' }}>
      <div
        className={styles.shimmer}
        style={{
          height: '24px',
          backgroundColor: '#1A1A1A',
          borderRadius: '8px',
          marginBottom: '16px',
          width: '150px',
        }}
      />

      {/* 4 comment skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#0A0A0A',
            borderRadius: '8px',
          }}
        >
          {/* Avatar */}
          <div
            className={styles.shimmer}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#1A1A1A',
              flexShrink: 0,
            }}
          />

          {/* Comment content */}
          <div style={{ flex: 1 }}>
            <div
              className={styles.shimmer}
              style={{
                height: '16px',
                backgroundColor: '#1A1A1A',
                borderRadius: '8px',
                marginBottom: '8px',
                width: '80%',
              }}
            />
            <div
              className={styles.shimmer}
              style={{
                height: '16px',
                backgroundColor: '#1A1A1A',
                borderRadius: '8px',
                width: '60%',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}