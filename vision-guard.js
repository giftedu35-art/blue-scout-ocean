// Until a real vision model is connected, uploaded photos must never be given a made-up species name.
function showNeedsAiConnection() {
  current = { name: 'AI 분석 연결 필요', latin: 'Image model not configured', type: '사진이 업로드되었어요', rarity: '-', risk: '-', score: 0, emoji: '📷', points: 0, xp: 0 };
  $('resultEmoji').textContent = '📷';
  $('speciesName').textContent = 'AI 분석 연결 필요';
  $('latinName').textContent = '이미지 인식 모델을 연결하면 종 정보를 제공해요';
  $('typeLabel').textContent = '사진 업로드 완료';
  $('factType').textContent = '검증 대기';
  $('rarity').textContent = '-';
  $('rarityStatus').textContent = '-';
  $('riskStatus').textContent = '판정 전';
  $('confidence').textContent = '0';
  $('description').textContent = '현재 버전은 실제 사진을 판별하는 AI 모델이 연결되어 있지 않습니다. 잘못된 생물 이름과 안전 정보를 표시하지 않기 위해 분석 결과를 보류합니다.';
  $('guide').textContent = 'AI 모델 연결 후 사진 속 대상의 종·위험도·생태 정보를 신뢰도와 함께 안내합니다.';
  $('feedbackTitle').textContent = '정확한 판정을 위해 AI 연결이 필요해요';
  $('feedbackAction').textContent = '현재 사진은 도감과 보상에 기록되지 않습니다.';
  $('feedbackDetail').textContent = '예시 데이터 버튼은 앱 흐름을 확인하는 용도이며, 실제 사진 판별 결과가 아닙니다.';
  $('feedbackCard').className = 'feedback-card geo';
  $('rewardPoint').textContent = '0';
  $('rewardXp').textContent = '0';
  $('saveRecord').disabled = true;
  $('saveRecord').textContent = 'AI 모델 연결 후 기록할 수 있어요';
  screen('resultScreen');
}

$('fileInput').onchange = (event) => { if (event.target.files[0]) showNeedsAiConnection(); };
$('cameraInput').onchange = (event) => { if (event.target.files[0]) showNeedsAiConnection(); };
$('demoScan').onclick = () => { analyze(); $('saveRecord').disabled = false; };
