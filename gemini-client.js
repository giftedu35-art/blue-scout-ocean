const BLUE_SCOUT_AI_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxvyo59LsqRySBpinKRk6lOKrzBlTT7FSu0-xAygrpsmy3s7eOutUlYY4_5dFhSvxGe/exec';

function imageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진을 읽을 수 없어요.'));
    reader.onload = () => {
      const [head, data] = String(reader.result).split(',');
      resolve({ data, mimeType: (head.match(/data:(.*?);/) || [])[1] || 'image/jpeg', previewUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  });
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
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 1200)); const data = await queryResult(token);
    if (!data.pending) { frame.remove(); form.remove(); if (!data.ok) throw new Error(data.error || 'AI 분석에 실패했어요.'); return showAiResult(data.result, photo.previewUrl); }
  }
  frame.remove(); form.remove(); throw new Error('AI 분석 시간이 초과됐어요.');
}

function showAiResult(result, previewUrl) {
  if (!result.recognized) result = { ...result, name: '해양 생물로 확인되지 않았어요', latin: 'Not a marine target', category: '미확인', rarity: '-', risk: '재촬영 필요', confidence: 0, points: 0, description: '해양 생물·물고기·지질 대상을 확인하기 어려워요.', guide: '대상이 크게 보이도록 다시 촬영해 주세요.' };
  current = { name: result.name, latin: result.latin || '', type: result.category || '미확인', rarity: result.rarity || '-', risk: result.risk || '확인 필요', score: Number(result.confidence) || 0, emoji: '🔎', points: Number(result.points) || 0, xp: 80, description: result.description || '', guide: result.guide || '' };
  const isTerrain = /지형|지질|절리|암석/.test(current.type);
  const resultVisual = $('resultVisual');
  const resultPhoto = $('resultPhoto');
  resultPhoto.src = previewUrl || '';
  resultPhoto.classList.toggle('hidden', !previewUrl);
  $('resultEmoji').classList.toggle('hidden', Boolean(previewUrl));
  resultVisual.style.backgroundImage = '';
  resultVisual.classList.toggle('has-photo', Boolean(previewUrl));
  $('riskCard').classList.toggle('hidden', isTerrain);
  $('statusGrid').style.gridTemplateColumns = isTerrain ? '1fr' : '1fr 1fr';
  $('resultEmoji').textContent=current.emoji; $('speciesName').textContent=current.name; $('latinName').textContent=current.latin; $('typeLabel').textContent=current.type; $('factType').textContent=current.type; $('rarity').textContent=current.rarity; $('rarityStatus').textContent=current.rarity; $('riskStatus').textContent=current.risk; $('confidence').textContent=current.score; $('description').textContent=current.description; $('guide').textContent=current.guide; $('rewardPoint').textContent=current.points; $('rewardXp').textContent=current.xp; $('saveRecord').disabled=!result.recognized || !current.points; screen('resultScreen');
}

$('fileInput').onchange=(e)=>{if(e.target.files[0]) analyzePhotoWithGemini(e.target.files[0]).catch((err)=>{$('toast').textContent=err.message;$('toast').classList.remove('hidden');});};
$('cameraInput').onchange=(e)=>{if(e.target.files[0]) analyzePhotoWithGemini(e.target.files[0]).catch((err)=>{$('toast').textContent=err.message;$('toast').classList.remove('hidden');});};
