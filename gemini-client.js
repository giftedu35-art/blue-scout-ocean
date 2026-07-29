// Gemini API key stays in Apps Script. The browser only sends the selected image.
const BLUE_SCOUT_AI_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyum7Xt1dF7EHtsQpF7IXELSBNxAKChX23A9NKxiITgFpFM-_xTFpLF9qtOs9Om5llF/exec';

function readImageForAi(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진을 읽을 수 없어요.'));
    reader.onload = () => {
      const [prefix, image] = String(reader.result).split(',');
      resolve({ image, mimeType: (prefix.match(/data:(.*?);/) || [])[1] || file.type || 'image/jpeg' });
    };
    reader.readAsDataURL(file);
  });
}

function showAiResult(result) {
  if (!result.recognized) {
    result = { ...result, name: '해양 생물로 확인되지 않았어요', latin: 'Not a marine target', category: '미확인', rarity: '-', risk: '재촬영 필요', confidence: 0, points: 0, description: '사진에서 물고기·해양 생물·지질 대상을 확인하기 어려워요. 사람, 풍경, 사물 사진은 도감에 기록되지 않습니다.', guide: '물고기 전체가 보이도록 가까이에서 밝고 선명하게 다시 촬영해 주세요.' };
  }
  current = {
    name: result.name || '미확인 관찰', latin: result.latin || 'Unidentified observation',
    type: result.category || '미확인', rarity: result.rarity || '-', risk: result.risk || '확인 필요',
    score: Number(result.confidence) || 0, emoji: '🔎', points: Number(result.points) || 0,
    xp: 80, description: result.description || '사진 속 대상을 명확히 판별하기 어려워요.',
    guide: result.guide || '다른 각도와 더 밝은 사진으로 다시 촬영해 주세요.'
  };
  $('resultEmoji').textContent = current.emoji; $('speciesName').textContent = current.name;
  $('latinName').textContent = current.latin; $('typeLabel').textContent = current.type;
  $('factType').textContent = current.type; $('rarity').textContent = current.rarity;
  $('rarityStatus').textContent = current.rarity; $('riskStatus').textContent = current.risk;
  $('confidence').textContent = current.score; $('description').textContent = current.description;
  $('guide').textContent = current.guide; $('rewardPoint').textContent = current.points;
  $('rewardXp').textContent = current.xp; $('saveRecord').disabled = !result.recognized || !current.points;
  screen('resultScreen');
}

async function analyzePhotoWithGemini(file) {
  $('toast').textContent = 'AI가 사진을 분석하고 있어요…'; $('toast').classList.remove('hidden');
  try {
    const photo = await readImageForAi(file);
    const data = await new Promise((resolve, reject) => {
      const frame = document.createElement('iframe'); frame.name = 'blueScoutAiFrame'; frame.hidden = true; document.body.appendChild(frame);
      const form = document.createElement('form'); form.method = 'POST'; form.action = BLUE_SCOUT_AI_ENDPOINT; form.target = frame.name;
      const field = document.createElement('textarea'); field.name = 'payload'; field.value = JSON.stringify({ ...photo, origin: location.origin }); form.appendChild(field); document.body.appendChild(form);
      const timer = setTimeout(() => reject(new Error('AI 분석 시간이 초과됐어요.')), 30000);
      const receive = (event) => { if (!event.data || event.data.channel !== 'BLUE_SCOUT_AI') return; clearTimeout(timer); window.removeEventListener('message', receive); frame.remove(); form.remove(); resolve(event.data.data); };
      window.addEventListener('message', receive); form.submit();
    });
    if (!data.ok) throw new Error(data.error || 'AI 분석에 실패했어요.'); showAiResult(data.result);
  } catch (error) {
    $('toast').textContent = error.message || 'AI 연결을 확인해 주세요.';
    setTimeout(() => $('toast').classList.add('hidden'), 3500);
  }
}

$('fileInput').onchange = (event) => { if (event.target.files[0]) analyzePhotoWithGemini(event.target.files[0]); };
$('cameraInput').onchange = (event) => { if (event.target.files[0]) analyzePhotoWithGemini(event.target.files[0]); };
