import { useRef } from 'react';
import { PAIN_DISCLAIMER } from '@core';
import { EMPTY, useStore, type AppData } from '../store.tsx';
import { Toggle } from '../components/ui.tsx';
import { EXPERIENCE_KO, GOAL_KO, JOINT_KO, MUSCLE_KO, WORK_KO } from '../labels.ts';
import { completedSessions, fmtDate } from '../logic.ts';
import { CLASS_INFO, achievements, playerProgress } from '../game.ts';

export function Me({ editProfile, openRoutine }: { editProfile: () => void; openRoutine: () => void }) {
  const { data, update, replaceAll } = useStore();
  const p = data.profile!;
  const fileRef = useRef<HTMLInputElement>(null);
  const lv = playerProgress(data);
  const badges = achievements(data);

  const exportBackup = async () => {
    const json = JSON.stringify(data);
    const name = `liftquest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'LiftQuest 백업' });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
        // 바로 해제하면 Safari 등에서 다운로드가 실패할 수 있음
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
      update((d) => ({ ...d, settings: { ...d.settings, lastBackupAt: Date.now() } }));
    } catch { /* 공유 취소 */ }
  };

  const importBackup = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text()) as AppData;
      if (parsed.version !== 1 || !Array.isArray(parsed.sessions)) throw new Error('형식 오류');
      if (!confirm(`기록 ${parsed.sessions.length}개를 불러올까요? 지금 데이터는 덮어써져요.`)) return;
      replaceAll({ ...EMPTY, ...parsed });
      alert('불러왔어요');
    } catch {
      alert('백업 파일을 읽지 못했어요');
    }
  };

  const row = (k: string, v: string) => (
    <div className="row between small" style={{ padding: '6px 0' }}><span className="muted">{k}</span><span>{v}</span></div>
  );

  return (
    <div className="screen">
      <div className="stack">
        <div className="title">나</div>

        <div className="card hero">
          <div className="row between">
            <div>
              <div className="h2">{CLASS_INFO[p.goal].name} Lv.{lv.level}</div>
              <div className="small muted">운동 {completedSessions(data).length}회 · 주간 클리어 {lv.clearedWeeks}회 · 개인 기록 {lv.prs}회</div>
            </div>
            <span style={{ fontSize: 36 }}>{CLASS_INFO[p.goal].emoji}</span>
          </div>
          <div className="xp-bar" style={{ marginTop: 10 }}><div style={{ width: `${(lv.into / lv.need) * 100}%` }} /></div>
        </div>

        <div className="card">
          <div className="row between"><b>🏅 업적</b><span className="tiny muted">{badges.filter((b) => b.unlocked).length}/{badges.length}</span></div>
          <div className="badges" style={{ marginTop: 10 }}>
            {badges.map((b) => (
              <div key={b.id} className={`badge ${b.unlocked ? 'on' : 'locked'}`} title={`${b.name}: ${b.desc}`} aria-label={`${b.name} ${b.unlocked ? '달성' : '미달성'}: ${b.desc}`}>{b.emoji}</div>
            ))}
          </div>
          <div className="stack" style={{ gap: 4, marginTop: 10 }}>
            {badges.filter((b) => !b.unlocked).slice(0, 2).map((b) => <div key={b.id} className="tiny muted">다음 목표 · {b.emoji} {b.name}: {b.desc}</div>)}
          </div>
        </div>

        <button className="btn block" onClick={openRoutine}>📋 전체 루틴 · 이번 주 부위별 운동량</button>

        <div className="card">
          <div className="row between" style={{ marginBottom: 6 }}><b>내 정보</b><button className="btn sm" onClick={editProfile}>수정</button></div>
          {row('클래스', `${CLASS_INFO[p.goal].name} (${GOAL_KO[p.goal].label})`)}
          {row('경력', EXPERIENCE_KO[p.experience].label)}
          {row('빈도', `주 ${p.daysPerWeek}회 · ${p.minutesPerSession}분`)}
          {row('일하는 방식', `${WORK_KO[p.workActivity ?? 'standing'].label}${p.shiftWork ? ' · 교대근무' : ''}`)}
          {row('불편한 곳', p.injuries.length ? p.injuries.map((j) => JOINT_KO[j]).join(', ') : '없음')}
          {row('집중 부위', p.focusMuscles?.length ? p.focusMuscles.map((m) => MUSCLE_KO[m]).join(', ') : '없음')}
        </div>

        <div className="card">
          <b>운동 중 알림</b>
          <div className="row between" style={{ marginTop: 10 }}>
            <span>휴식 끝 소리</span>
            <Toggle label="휴식 끝 소리" on={data.settings.sound} onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, sound: v } }))} />
          </div>
          <div className="row between" style={{ marginTop: 10 }}>
            <span>음성 안내</span>
            <Toggle label="음성 안내" on={data.settings.voice} onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, voice: v } }))} />
          </div>
          <p className="tiny muted" style={{ marginTop: 8 }}>운동 중에는 화면이 꺼지지 않게 해요. 앱을 닫아도 휴식 시간은 정확히 이어져요.</p>
        </div>

        <div className="card">
          <b>백업</b>
          <p className="small muted" style={{ marginTop: 4 }}>
            기록은 이 폰에만 저장돼요. 백업 파일을 '파일' 앱(iCloud Drive)에 저장해 두세요.
            {data.settings.lastBackupAt ? ` 마지막 백업: ${fmtDate(data.settings.lastBackupAt)}` : ' 아직 백업하지 않았어요.'}
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn sm primary grow" onClick={exportBackup}>백업 파일 저장</button>
            <button className="btn sm grow" onClick={() => fileRef.current?.click()}>불러오기</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ''; }} />
        </div>

        <div className="card small muted">{PAIN_DISCLAIMER}</div>

        <details className="card small">
          <summary className="bold">출처 · 라이선스</summary>
          <ul className="bullet" style={{ marginTop: 8 }}>
            <li>3D 근육 이미지: BodyParts3D, Copyright © 2008 Life Science Integrated Database Center (DBCLS), CC BY-SA 2.1 JP 라이선스. 모델을 단순화·렌더링한 이미지도 같은 라이선스로 공개합니다.</li>
            <li>2D 근육 지도: react-native-body-highlighter © 2022 ELABBASSI Hicham, MIT 라이선스</li>
            <li>추가 종목 58개의 동작 설명: free-exercise-db (퍼블릭 도메인, Unlicense)를 번역·보강</li>
            <li>그 밖의 종목 설명·근육 정보·루틴 로직: LiftQuest 자체 작성</li>
          </ul>
        </details>

        <button className="btn ghost block" style={{ color: 'var(--bad)' }} onClick={() => {
          if (confirm('모든 기록과 설정을 지울까요? 되돌릴 수 없어요.')) replaceAll(EMPTY);
        }}>모든 데이터 지우기</button>
      </div>
    </div>
  );
}
