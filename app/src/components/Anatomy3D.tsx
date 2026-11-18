import { useState, type ReactNode } from 'react';

/**
 * 미리 렌더링한 3D 근육 이미지 (앞/뒤). 3D와 2D 지도(누르면 근육 도감)를 전환할 수 있음.
 * 이미지는 BodyParts3D (CC BY-SA 2.1 JP) 모델을 렌더링한 것. 불러오지 못하면 2D 지도로 대체.
 */
export function Anatomy3D({ src, alt, fallback }: { src: string; alt: string; fallback: ReactNode }) {
  const [mode, setMode] = useState<'3d' | '2d'>('3d');
  const [failed, setFailed] = useState(false);
  const show3d = mode === '3d' && !failed;
  return (
    <div>
      {!failed && (
        <div className="seg" style={{ marginBottom: 10 }}>
          <button className={mode === '3d' ? 'on' : ''} onClick={() => setMode('3d')}>3D</button>
          <button className={mode === '2d' ? 'on' : ''} onClick={() => setMode('2d')}>지도 (누르면 도감)</button>
        </div>
      )}
      {show3d ? (
        <img src={import.meta.env.BASE_URL + src} alt={alt} loading="lazy" onError={() => setFailed(true)}
          style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain', display: 'block', borderRadius: 10, background: '#f3efe6' }} />
      ) : fallback}
    </div>
  );
}
