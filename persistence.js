// Device-local progress: a new visitor starts empty, returning visitors resume here.
const BLUE_SCOUT_SAVE = 'blue-scout-progress-v1';

function updateSavedProgress() {
  $('pointTotal').textContent = points.toLocaleString();
  $('levelNumber').textContent = level;
  $('xpNow').textContent = xp;
  $('xpLeft').textContent = (1000 - xp).toLocaleString();
  $('xpBar').style.width = `${xp / 10}%`;
  $('missionCount').textContent = Math.min(records, 5);
  $('badgeCount').textContent = `${Math.min(records, 3)} / 6`;
  if (records > 0) {
    $('badges').innerHTML = '<article><div>🐠</div><b>첫 발견</b><small>생물 1종 기록</small></article><article class="locked-badge"><div>?</div><b>바다 지킴이</b><small>위험종 안전 기록</small></article><article class="locked-badge"><div>?</div><b>희귀 추적자</b><small>희귀종 3종 기록</small></article>';
  }
  if (records > 0) {
    $('rankPlace').textContent = '1';
    $('rankTitle').textContent = '첫 번째 탐험가';
    $('rankDescription').textContent = `${points.toLocaleString()}P로 이번 주 1위예요!`;
    $('rankList').innerHTML = `<div><b>1</b><span>🌊 나의 탐험 기록</span><em>${points.toLocaleString()}P</em></div>`;
  }
}

function loadSavedProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(BLUE_SCOUT_SAVE));
    if (!saved) return;
    points = Number(saved.points) || 0;
    xp = Number(saved.xp) || 0;
    level = Number(saved.level) || 1;
    records = Number(saved.records) || 0;
    (saved.recorded || []).forEach((name) => recorded.add(name));
    updateSavedProgress();
  } catch (_) {
    localStorage.removeItem(BLUE_SCOUT_SAVE);
  }
}

function saveCurrentProgress() {
  localStorage.setItem(BLUE_SCOUT_SAVE, JSON.stringify({
    points, xp, level, records, recorded: [...recorded]
  }));
}

$('saveRecord').onclick = () => {
  if (recorded.has(current.name)) {
    $('toast').textContent = '이미 기록된 발견이에요. 새로운 종을 찾아보세요!';
  } else {
    recorded.add(current.name);
    points += current.points;
    xp += current.xp;
    records++;
    if (xp >= 1000) { xp -= 1000; level++; }
    updateSavedProgress();
    saveCurrentProgress();
    $('toast').textContent = `+${current.points}P · +${current.xp}XP! ${current.name}을 기록했어요.`;
  }
  $('toast').classList.remove('hidden');
  setTimeout(() => $('toast').classList.add('hidden'), 2500);
};

loadSavedProgress();
