import { useEffect, useRef, useState } from 'react';
import { del, get, set } from 'idb-keyval';
import { fmtDate } from '../logic.ts';

/*
 * 내 자세 영상: 종목마다 직접 찍은 영상을 폰(IndexedDB)에만 저장해 두고 다시 보며 비교.
 * - 서버로 보내지 않음, 저작권 문제 없음
 * - 운동 기록(AppData)과 분리된 키에 저장해 기록 저장·백업 속도에 영향 없음 (백업 파일에는 포함되지 않음)
 * - 종목당 최근 3개까지
 */
interface Clip { id: string; t: number; blob: Blob }

const MAX_CLIPS = 3;
const MAX_MB = 150;
const key = (exerciseId: string) => `videos:${exerciseId}`;

export function MyVideos({ exerciseId }: { exerciseId: string }) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    get<Clip[]>(key(exerciseId)).then((v) => { if (alive) setClips(v ?? []); }).catch(() => {});
    return () => { alive = false; };
  }, [exerciseId]);

  const add = async (f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) {
      setMsg(`영상이 너무 커요 (${Math.round(f.size / 1048576)}MB). ${MAX_MB}MB 이하의 짧은 영상으로 찍어 주세요.`);
      return;
    }
    const next = [{ id: Date.now().toString(36), t: Date.now(), blob: f as Blob }, ...clips].slice(0, MAX_CLIPS);
    try {
      await set(key(exerciseId), next);
      setClips(next);
      setMsg(clips.length >= MAX_CLIPS ? '가장 오래된 영상은 지웠어요 (종목당 3개까지).' : '');
    } catch {
      setMsg('저장 공간이 부족해 저장하지 못했어요.');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('이 영상을 지울까요?')) return;
    const next = clips.filter((c) => c.id !== id);
    if (next.length) await set(key(exerciseId), next); else await del(key(exerciseId));
    setClips(next);
  };

  return (
    <div className="card">
      <div className="row between">
        <b>🎥 내 자세 영상</b>
        <button className="btn sm primary" onClick={() => fileRef.current?.click()}>＋ 찍기·고르기</button>
      </div>
      <input ref={fileRef} type="file" accept="video/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) add(f); e.target.value = ''; }} />
      {msg && <p className="small" style={{ marginTop: 6, color: 'var(--warn)', fontWeight: 700 }}>{msg}</p>}
      {clips.length === 0 ? (
        <p className="small muted" style={{ marginTop: 6 }}>
          옆이나 대각선에서 한 세트를 찍어 두면 다음에 자세를 비교하기 좋아요. 영상은 이 폰에만 저장돼요.
        </p>
      ) : (
        <div className="stack" style={{ gap: 10, marginTop: 10 }}>
          {clips.map((c) => <ClipView key={c.id} clip={c} onRemove={() => remove(c.id)} />)}
          <p className="tiny muted">영상은 이 폰에만 저장되고 백업 파일에는 포함되지 않아요.</p>
        </div>
      )}
    </div>
  );
}

function ClipView({ clip, onRemove }: { clip: Clip; onRemove: () => void }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const u = URL.createObjectURL(clip.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [clip]);
  return (
    <div>
      <video src={url} controls playsInline muted loop preload="metadata"
        style={{ width: '100%', maxHeight: 360, borderRadius: 10, background: '#000', display: 'block' }} />
      <div className="row between tiny muted" style={{ marginTop: 4 }}>
        <span>{fmtDate(clip.t)}</span>
        <button className="btn ghost sm" style={{ height: 28, color: 'var(--bad)' }} onClick={onRemove}>삭제</button>
      </div>
    </div>
  );
}
