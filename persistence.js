// Progress and ranking are stored locally on this device. A real shared ranking
// will be connected later when sign-in and a database are added.
const BLUE_SCOUT_SAVE = 'blue-scout-progress-v2';
const BLUE_SCOUT_LEGACY_SAVE = 'blue-scout-progress-v1';

function currentWeekId() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const day = Math.floor((now - start) / 86400000);
  return `${now.getFullYear()}-W${Math.ceil((day + start.getDay() + 1) / 7)}`;
}

function rankingScore() {
  return Number(window.blueScoutWeeklyPoints) || 0;
}

function updateRanking() {
  const weeklyPoints = rankingScore();
  const hasParticipation = records > 0 && weeklyPoints > 0;

  $('rankPlace').textContent = hasParticipation ? '1' : '-';
  $('rankTitle').textContent = hasParticipation ? '이번 주 탐험 기록' : '아직 참가자가 없어요';
  $('rankDescription').textContent = hasParticipation
    ? `${weeklyPoints.toLocaleString()}P · 발견 ${records}종 기록 중`
    : '첫 탐험 기록을 남기고 1위가 되어보세요.';
  $('rankList').innerHTML = hasParticipation
    ? `<div><b>1</b><span>🌊 나의 이번 주 기록</span><em>${weeklyPoints.toLocaleString()}P</em></div>`
    : '<div><b>·</b><span>이번 주 탐험가를 기다리고 있어요</span><em>0P</em></div>';
}

function updateSavedProgress() {
  $('pointTotal').textContent = points.toLocaleString();
  $('levelNumber').textContent = level;
  $('xpNow').textContent = xp;
  $('xpLeft').textContent = (1000 - xp).toLocaleString();
  $('xpBar').style.width = `${Math.max(0, Math.min(xp / 10, 100))}%`;
  $('missionCount').textContent = Math.min(records, 5);
  $('badgeCount').textContent = `${Math.min(records, 3)} / 6`;

  if (records > 0) {
    $('badges').innerHTML = '<article><div>🐠</div><b>첫 발견</b><small>생물 1종 기록</small></article><article class="locked-badge"><div>?</div><b>바다 지킴이</b><small>위험종 안전 기록</small></article><article class="locked-badge"><div>?</div><b>희귀 추적자</b><small>희귀종 3종 기록</small></article>';
  }
  updateRanking();
}

function readSavedProgress() {
  try {
    return JSON.parse(localStorage.getItem(BLUE_SCOUT_SAVE) || localStorage.getItem(BLUE_SCOUT_LEGACY_SAVE) || 'null');
  } catch (_) {
    return null;
  }
}

function loadSavedProgress() {
  const saved = readSavedProgress();
  if (!saved) {
    window.blueScoutWeeklyPoints = 0;
    updateSavedProgress();
    return;
  }

  points = Number(saved.points) || 0;
  xp = Number(saved.xp) || 0;
  level = Number(saved.level) || 1;
  records = Number(saved.records) || 0;
  (saved.recorded || []).forEach((name) => recorded.add(name));
  window.blueScoutWeeklyPoints = saved.weekId === currentWeekId() ? (Number(saved.weeklyPoints) || 0) : 0;
  updateSavedProgress();
  saveCurrentProgress();
}

function saveCurrentProgress() {
  localStorage.setItem(BLUE_SCOUT_SAVE, JSON.stringify({
    points,
    xp,
    level,
    records,
    recorded: [...recorded],
    weekId: currentWeekId(),
    weeklyPoints: rankingScore(),
    updatedAt: new Date().toISOString()
  }));
  localStorage.removeItem(BLUE_SCOUT_LEGACY_SAVE);
}

function showRecordToast(message) {
  $('toast').textContent = message;
  $('toast').classList.remove('hidden');
  setTimeout(() => $('toast').classList.add('hidden'), 2500);
}

// This is the only record handler. It prevents the old demo handler from
// overwriting saved ranking data.
$('saveRecord').onclick = () => {
  if (!current || !current.name || current.points <= 0) {
    showRecordToast('AI 분석 결과가 확인된 뒤에 기록할 수 있어요.');
    return;
  }
  if (recorded.has(current.name)) {
    showRecordToast('이미 기록된 발견이에요. 새로운 종을 찾아보세요!');
    return;
  }

  recorded.add(current.name);
  points += Number(current.points) || 0;
  xp += Number(current.xp) || 0;
  records += 1;
  window.blueScoutWeeklyPoints = rankingScore() + (Number(current.points) || 0);

  if (xp >= 1000) {
    xp -= 1000;
    level += 1;
  }
  updateSavedProgress();
  saveCurrentProgress();
  showRecordToast(`+${current.points}P · +${current.xp}XP! 랭킹과 도감에 기록됐어요.`);
};

loadSavedProgress();
