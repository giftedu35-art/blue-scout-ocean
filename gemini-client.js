const BLUE_SCOUT_AI_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxvyo59LsqRySBpinKRk6lOKrzBlTT7FSu0-xAygrpsmy3s7eOutUlYY4_5dFhSvxGe/exec';
const BLUE_SCOUT_INVASIVE_REPORT_URL = 'https://kias.nie.re.kr/page/report/guide';
const BLUE_SCOUT_ENDANGERED_INFO_URL = 'https://species.nibr.go.kr/endangeredspecies/rehome/exlist/exlist.jsp';

async function imageData(file) {
  const originalUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진을 읽을 수 없어요.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('사진 형식을 읽을 수 없어요.'));
      element.src = originalUrl;
    });
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('사진 변환 기능을 사용할 수 없어요.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
    const [, data = ''] = previewUrl.split(',');
    if (!data) throw new Error('사진을 변환할 수 없어요.');
    return { data, mimeType: 'image/jpeg', previewUrl };
  } catch (_) {
    const [head, data = ''] = originalUrl.split(',');
    return {
      data,
      mimeType: (head.match(/data:(.*?);/) || [])[1] || file.type || 'image/jpeg',
      previewUrl: originalUrl
    };
  }
}

function queryResult(token) {
  return new Promise((resolve) => {
    const callback = `blueScoutResult_${token.replace(/[^a-z0-9]/gi, '')}`;
    window[callback] = (data) => { delete window[callback]; script.remove(); resolve(data); };
    const script = document.createElement('script');
    script.src = `${BLUE_SCOUT_AI_ENDPOINT}?action=result&token=${encodeURIComponent(token)}&callback=${callback}`;
    script.onerror = () => { delete window[callback]; script.remove(); resolve({ ok: false, pending: true }); };
    document.head.appendChild(script);
  });
}

async function analyzePhotoWithGemini(file) {
  $('toast').classList.add('hidden');
  const photo = await imageData(file); const token = `${Date.now()}${Math.random().toString(36).slice(2)}`;
  const frame = document.createElement('iframe'); frame.name = `blueScoutUpload${token}`; frame.hidden = true; document.body.appendChild(frame);
  const form = document.createElement('form'); form.method = 'POST'; form.action = BLUE_SCOUT_AI_ENDPOINT; form.target = frame.name;
  const field = document.createElement('textarea'); field.name = 'payload'; field.value = JSON.stringify({ image: photo.data, mimeType: photo.mimeType, token }); form.appendChild(field); document.body.appendChild(form); form.submit();
  for (let i = 0; i < 32; i++) {
    await new Promise((r) => setTimeout(r, i === 0 ? 500 : 850)); const data = await queryResult(token);
    if (!data.pending) { frame.remove(); form.remove(); if (!data.ok) throw new Error(data.error || 'AI 분석에 실패했어요.'); return showAiResult(data.result, photo.previewUrl); }
  }
  frame.remove(); form.remove(); throw new Error('AI 분석 시간이 초과됐어요.');
}

function showAiResult(result, previewUrl) {
  const invasive = result.recognized && window.findInvasiveSpecies
    ? window.findInvasiveSpecies(result.name, result.latin)
    : null;
  if (invasive) {
    result = {
      ...result,
      name: invasive.name,
      latin: invasive.latin,
      category: '생태계교란종',
      risk: result.risk === '고위험군' ? result.risk : '주의',
      points: Math.max(Number(result.points) || 0, 150),
      description: `${result.description || ''} 대한민국 생태계교란 생물 지정: ${invasive.designated}.`.trim()
    };
  }
  if (!result.recognized) result = { ...result, name: '생물·지형으로 확인되지 않았어요', latin: 'Unrecognized target', category: '미확인', rarity: '-', risk: '재촬영 필요', confidence: 0, points: 0, description: '생태계 생물 또는 해안 지형·지질 대상을 확인하기 어려워요.', guide: '대상이 크게 보이도록 밝은 곳에서 다시 촬영해 주세요.' };
  const categoryText = String(result.category || '');
  const rarityText = String(result.rarity || '');
  const baseReward = /외래|교란|멸종위기/.test(categoryText)
    ? 150
    : /위험/.test(categoryText)
      ? 130
      : /지형|지질|절리|암석/.test(categoryText)
        ? 100
        : 80;
  const rarityBonus = /높음|희귀/.test(rarityText)
    ? 40
    : /보통/.test(rarityText)
      ? 20
      : 0;
  const rewardPoints = result.recognized
    ? Math.max(Number(result.points) || 0, baseReward + rarityBonus)
    : 0;
  current = { name: result.name, latin: result.latin || '', type: result.category || '미확인', rarity: result.rarity || '-', risk: result.risk || '확인 필요', score: Number(result.confidence) || 0, emoji: '🔎', points: rewardPoints, xp: 80, description: result.description || '', guide: result.guide || '' };
  const isTerrain = /지형|지질|절리|암석/.test(current.type);
  const isEndangered = /멸종위기/.test(current.type);
  const isReportable = /외래|교란|멸종위기/.test(current.type);
  $('bookStatus').textContent = recorded.has(current.name)
    ? '이미 찾은 발견!'
    : '새로운 발견!';
  const resultVisual = $('resultVisual');
  const resultPhoto = $('resultPhoto');
  resultPhoto.src = previewUrl || '';
  resultPhoto.classList.toggle('hidden', !previewUrl);
  $('resultEmoji').classList.toggle('hidden', Boolean(previewUrl));
  resultVisual.style.backgroundImage = '';
  resultVisual.classList.toggle('has-photo', Boolean(previewUrl));
  $('riskCard').classList.toggle('hidden', isTerrain);
  $('statusGrid').style.gridTemplateColumns = isTerrain ? '1fr' : '1fr 1fr';
  $('reportDiscovery').classList.toggle('hidden', !isReportable);
  $('reportNote').classList.toggle('hidden', !isReportable);
  $('reportDiscovery').textContent = isEndangered
    ? '⚑ 멸종위기종 보호·신고 안내 열기'
    : '⚑ 외래·교란 생물 신고센터 열기';
  $('reportDiscovery').onclick = () => {
    const url = isEndangered
      ? BLUE_SCOUT_ENDANGERED_INFO_URL
      : BLUE_SCOUT_INVASIVE_REPORT_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  $('resultEmoji').textContent=current.emoji; $('speciesName').textContent=current.name; $('latinName').textContent=current.latin; $('typeLabel').textContent=current.type; $('factType').textContent=current.type; $('rarity').textContent=current.rarity; $('rarityStatus').textContent=current.rarity; $('riskStatus').textContent=current.risk; $('confidence').textContent=current.score; $('description').textContent=current.description; $('guide').textContent=current.guide; $('rewardPoint').textContent=current.points; $('rewardXp').textContent=current.xp; $('saveRecord').disabled=!result.recognized || !current.points; screen('resultScreen');
}

$('fileInput').onchange=(e)=>{if(e.target.files[0]) analyzePhotoWithGemini(e.target.files[0]).catch((err)=>{$('toast').textContent=err.message;$('toast').classList.remove('hidden');});};
$('cameraInput').onchange=(e)=>{if(e.target.files[0]) analyzePhotoWithGemini(e.target.files[0]).catch((err)=>{$('toast').textContent=err.message;$('toast').classList.remove('hidden');});};
