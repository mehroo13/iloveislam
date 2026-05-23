import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function OptimizedImage({ src, alt, width, height, className }: Props) {
  // Prefer optimized WebP in /optimized if available.
  const webp = src.replace(/\.(png|jpg|jpeg)$/, '.webp');
  const optimizedPath = `/optimized/${webp.split('/').pop()}`;
  return <Image src={optimizedPath} alt={alt} width={width} height={height} className={className} />;
}
