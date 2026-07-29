const blueScoutFirebaseConfig = {
  apiKey: 'AIzaSyDz94BMupj04QzZWIFC3v3wxnU14xAgdZc',
  authDomain: 'blue-scout-ocean.firebaseapp.com',
  projectId: 'blue-scout-ocean',
  storageBucket: 'blue-scout-ocean.firebasestorage.app',
  messagingSenderId: '3130799624',
  appId: '1:3130799624:web:ec44c6d4f16dc011bc43bd'
};

const blueScoutApp = firebase.initializeApp(blueScoutFirebaseConfig);
const blueScoutAuth = firebase.auth();
const blueScoutDb = firebase.firestore();
const blueScoutGoogle = new firebase.auth.GoogleAuthProvider();
blueScoutGoogle.setCustomParameters({ prompt: 'select_account' });

let blueScoutApplyingCloud = false;
let blueScoutSaveTimer = null;
let blueScoutRankingUnsubscribe = null;

function blueScoutAuthMessage(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

async function blueScoutSaveCloud(progress) {
  const user = blueScoutAuth.currentUser;
  if (!user || blueScoutApplyingCloud) return;
  await blueScoutDb.collection('users').doc(user.uid).set({
    ...progress,
    profile: {
      displayName: user.displayName || 'BLUE SCOUT 탐험가'
    },
    cloudUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  await blueScoutDb.collection('rankings').doc(user.uid).set({
    uid: user.uid,
    displayName: user.displayName || 'BLUE SCOUT 탐험가',
    weeklyPoints: Number(progress.weeklyPoints) || 0,
    records: Number(progress.records) || 0,
    level: Number(progress.level) || 1,
    weekId: progress.weekId || '',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

function blueScoutWatchRanking(user) {
  if (blueScoutRankingUnsubscribe) blueScoutRankingUnsubscribe();
  blueScoutRankingUnsubscribe = blueScoutDb.collection('rankings')
    .limit(100)
    .onSnapshot((snapshot) => {
      const players = snapshot.docs.map((doc) => doc.data());
      if (window.renderBlueScoutSharedRanking) {
        window.renderBlueScoutSharedRanking(players, user ? user.uid : '');
      }
    }, () => blueScoutAuthMessage('전체 랭킹을 불러오지 못했어요.'));
}

window.addEventListener('blue-scout-progress', (event) => {
  if (!blueScoutAuth.currentUser || blueScoutApplyingCloud) return;
  clearTimeout(blueScoutSaveTimer);
  blueScoutSaveTimer = setTimeout(() => {
    blueScoutSaveCloud(event.detail).catch(() => {
      blueScoutAuthMessage('기록을 클라우드에 저장하지 못했어요.');
    });
  }, 350);
});

document.getElementById('authButton').onclick = async () => {
  if (blueScoutAuth.currentUser) {
    await blueScoutAuth.signOut();
    window.clearBlueScoutLocalProgress();
    blueScoutAuthMessage('로그아웃했어요. 기기 기록은 초기화되고 계정 기록은 보관됩니다.');
    return;
  }
  try {
    await blueScoutAuth.signInWithPopup(blueScoutGoogle);
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      await blueScoutAuth.signInWithRedirect(blueScoutGoogle);
      return;
    }
    blueScoutAuthMessage('Google 로그인에 실패했어요. 다시 시도해 주세요.');
  }
};

blueScoutAuth.onAuthStateChanged(async (user) => {
  const button = document.getElementById('authButton');
  const label = document.getElementById('authUser');
  if (!user) {
    button.textContent = 'Google 로그인';
    label.textContent = '체험 모드';
    if (blueScoutRankingUnsubscribe) {
      blueScoutRankingUnsubscribe();
      blueScoutRankingUnsubscribe = null;
    }
    return;
  }

  button.textContent = '로그아웃';
  label.textContent = user.displayName || user.email || '로그인됨';
  blueScoutWatchRanking(user);

  try {
    const ref = blueScoutDb.collection('users').doc(user.uid);
    const cloud = await ref.get();
    if (cloud.exists) {
      blueScoutApplyingCloud = true;
      window.applyBlueScoutProgress(cloud.data());
      blueScoutApplyingCloud = false;
      await blueScoutSaveCloud(window.getBlueScoutProgress());
      blueScoutAuthMessage('계정 기록을 불러왔어요.');
    } else {
      await blueScoutSaveCloud(window.getBlueScoutProgress());
      blueScoutAuthMessage('현재 기기 기록을 계정에 저장했어요.');
    }
  } catch (_) {
    blueScoutApplyingCloud = false;
    blueScoutAuthMessage('계정 기록을 불러오지 못했어요.');
  }
});
