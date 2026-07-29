// Progress and ranking are stored locally on this device. A real shared ranking
// will be connected later when sign-in and a database are added.
const BLUE_SCOUT_SAVE = 'blue-scout-progress-v2';
const BLUE_SCOUT_LEGACY_SAVE = 'blue-scout-progress-v1';
let discoveredEntries = [];
let activeBookFilter = 'all';

function isTerrainEntry(entry) {
  return /지형|지질|절리|암석/.test(entry.type || '');
}

function discoveryEmoji(entry) {
  if (isTerrainEntry(entry)) return '🪨';
  if (/해파리/.test(entry.name || '')) return '🪼';
  return entry.emoji || '🐟';
}

function matchesBookFilter(entry, filter) {
  if (filter === 'animal') return !isTerrainEntry(entry);
  if (filter === 'terrain') return isTerrainEntry(entry);
  if (filter === 'invasive') return /외래|교란/.test(entry.type || '');
  if (filter === 'endangered') return /멸종위기/.test(entry.type || '');
  if (filter === 'rare-high') return /높음|희귀/.test(entry.rarity || '');
  if (filter === 'rare-medium') return /보통/.test(entry.rarity || '');
  if (filter === 'rare-low') return /낮음|일반/.test(entry.rarity || '');
  return true;
}

function renderSavedBook(filter = activeBookFilter) {
  activeBookFilter = filter;
  const list = $('bookList');
  const allEntries = discoveredEntries.length
    ? discoveredEntries
    : [...recorded].map((name) => {
        const sample = samples.find((item) => item.name === name);
        return sample || {
          name,
          type: '기록된 발견',
          rarity: '-',
          risk: '-',
          emoji: '🔎'
        };
      });
  const entries = allEntries.filter((entry) =>
    matchesBookFilter(entry, activeBookFilter)
  );

  document.querySelectorAll('#bookFilters button').forEach((button) => {
    button.classList.toggle(
      'selected',
      button.dataset.filter === activeBookFilter
    );
  });

  list.innerHTML = entries.length
    ? entries.map((entry) => {
        const status = isTerrainEntry(entry)
          ? `희귀도: ${entry.rarity || '-'}`
          : `희귀도: ${entry.rarity || '-'} · 위험도: ${entry.risk || '-'}`;
        return `<article class="entry">
          <div class="emoji">${discoveryEmoji(entry)}</div>
          <section>
            <p>${entry.type || '기록된 발견'}</p>
            <b>${entry.name}</b>
            <small>${status}</small>
          </section>
          <span class="badge">${entry.rarity || '-'}</span>
        </article>`;
      }).join('')
    : `<article class="entry locked">
        <div class="emoji">?</div>
        <section>
          <p>${allEntries.length ? '해당 분류의 기록이 없어요' : '도감이 비어 있어요'}</p>
          <b>${allEntries.length ? '다른 필터를 선택해 보세요' : '첫 탐험을 시작해 보세요'}</b>
          <small>${allEntries.length ? '새로운 발견을 기록하면 이 목록에 추가됩니다' : '사진을 기록하면 도감이 열립니다'}</small>
        </section>
      </article>`;

  screen('bookScreen');
}

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

window.renderBlueScoutSharedRanking = (players, currentUid) => {
  const ranked = (Array.isArray(players) ? players : [])
    .filter((player) =>
      player &&
      player.weekId === currentWeekId() &&
      Number(player.weeklyPoints) > 0
    )
    .sort((a, b) => Number(b.weeklyPoints) - Number(a.weeklyPoints))
    .slice(0, 20);

  if (!ranked.length) {
    $('rankPlace').textContent = '-';
    $('rankTitle').textContent = '아직 참가자가 없어요';
    $('rankDescription').textContent = '사진을 기록하면 전체 랭킹에 참가할 수 있어요.';
    $('rankList').innerHTML =
      '<div><b>·</b><span>이번 주 탐험가를 기다리고 있어요</span><em>0P</em></div>';
    return;
  }

  const myIndex = ranked.findIndex((player) => player.uid === currentUid);
  $('rankPlace').textContent = myIndex >= 0 ? String(myIndex + 1) : '-';
  $('rankTitle').textContent =
    myIndex >= 0 ? `이번 주 전체 ${myIndex + 1}위` : '이번 주 전체 탐험 랭킹';
  $('rankDescription').textContent =
    myIndex >= 0
      ? `${Number(ranked[myIndex].weeklyPoints).toLocaleString()}P · 발견 ${Number(ranked[myIndex].records) || 0}종`
      : '사진을 기록하면 전체 랭킹에 참가할 수 있어요.';
  $('rankList').innerHTML = ranked.map((player, index) => {
    const name = String(player.displayName || 'BLUE SCOUT 탐험가')
      .replace(/[<>&"']/g, '');
    return `<div><b>${index + 1}</b><span>${name}${player.uid === currentUid ? ' (나)' : ''}</span><em>${Number(player.weeklyPoints).toLocaleString()}P</em></div>`;
  }).join('');
};

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
  } else {
    $('badges').innerHTML = '<article class="locked-badge"><div>?</div><b>첫 발견</b><small>생물 1종 기록</small></article><article class="locked-badge"><div>?</div><b>바다 지킴이</b><small>위험종 안전 기록</small></article><article class="locked-badge"><div>?</div><b>희귀 추적자</b><small>희귀종 3종 기록</small></article>';
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
  discoveredEntries = Array.isArray(saved.discoveries)
    ? saved.discoveries
    : [];
  window.blueScoutWeeklyPoints = saved.weekId === currentWeekId() ? (Number(saved.weeklyPoints) || 0) : 0;
  updateSavedProgress();
  saveCurrentProgress();
}

function saveCurrentProgress() {
  const progress = {
    points,
    xp,
    level,
    records,
    recorded: [...recorded],
    discoveries: discoveredEntries,
    weekId: currentWeekId(),
    weeklyPoints: rankingScore(),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(BLUE_SCOUT_SAVE, JSON.stringify(progress));
  localStorage.removeItem(BLUE_SCOUT_LEGACY_SAVE);
  window.dispatchEvent(new CustomEvent('blue-scout-progress', {
    detail: progress
  }));
}

function applyBlueScoutProgress(saved) {
  const progress = saved || {};
  points = Number(progress.points) || 0;
  xp = Number(progress.xp) || 0;
  level = Number(progress.level) || 1;
  records = Number(progress.records) || 0;
  recorded.clear();
  (progress.recorded || []).forEach((name) => recorded.add(name));
  discoveredEntries = Array.isArray(progress.discoveries)
    ? progress.discoveries
    : [];
  window.blueScoutWeeklyPoints = progress.weekId === currentWeekId()
    ? Number(progress.weeklyPoints) || 0
    : 0;
  updateSavedProgress();
  saveCurrentProgress();
}

window.getBlueScoutProgress = () => readSavedProgress() || {
  points: 0,
  xp: 0,
  level: 1,
  records: 0,
  recorded: [],
  discoveries: [],
  weekId: currentWeekId(),
  weeklyPoints: 0
};
window.applyBlueScoutProgress = applyBlueScoutProgress;
window.clearBlueScoutLocalProgress = () => {
  localStorage.removeItem(BLUE_SCOUT_SAVE);
  localStorage.removeItem(BLUE_SCOUT_LEGACY_SAVE);
  applyBlueScoutProgress(null);
};

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
  discoveredEntries.push({
    name: current.name,
    latin: current.latin || '',
    type: current.type || '기록된 발견',
    rarity: current.rarity || '-',
    risk: current.risk || '-',
    emoji: current.emoji || '🐟',
    description: current.description || '',
    guide: current.guide || '',
    recordedAt: new Date().toISOString()
  });
  $('bookStatus').textContent = '이미 찾은 발견!';
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
$('showBook').onclick = () => renderSavedBook('all');
$('bookNav').onclick = () => renderSavedBook('all');
document.querySelectorAll('#bookFilters button').forEach((button) => {
  button.onclick = () => renderSavedBook(button.dataset.filter);
});
