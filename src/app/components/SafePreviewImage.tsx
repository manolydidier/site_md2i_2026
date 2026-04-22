'use client';

import Image from 'next/image';

type SafePreviewImageProps = {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
  fit?: 'cover' | 'contain';
  fallbackSrc?: string;
  emptyLabel?: string;
};

function canUseNextImage(src: string) {
  return src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:');
}

export default function SafePreviewImage({
  src,
  alt,
  width,
  height,
  className,
  style,
  fit = 'cover',
  fallbackSrc = '/placeholder-reference.svg',
  emptyLabel = 'Aucune image',
}: SafePreviewImageProps) {
  const cleaned = src?.trim() || '';
  const finalSrc = cleaned || fallbackSrc || '';

  if (!finalSrc) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          display: 'grid',
          placeItems: 'center',
          background: '#F3F4F6',
          color: '#6B7280',
          fontSize: 12,
          ...style,
        }}
      >
        {emptyLabel}
      </div>
    );
  }

  if (canUseNextImage(finalSrc)) {
    return (
      <Image
        src={finalSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: fit,
          ...style,
        }}
      />
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: fit,
        ...style,
      }}
    />
  );
}