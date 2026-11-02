/* LAST SIGNAL REBOOT G2 media release contract.
 * This is an inventory, NOT a claim that any image has been generated.
 * To release a still: commit an original independent WebP; verify SHA-256 and
 * visual identity; change approved:false -> true and set image path + hash.
 * Video requires a distinct approved poster image, 3-5 s actual contextual
 * action and tested fallback. No network AI calls during play.
 */
(()=>{
 'use strict';
 const story=window.LastSignalStory;
 if(!story)throw new Error('Load reboot/story.js before media manifest');
 const ids=Object.keys(story.scenes);
 const shots={
  p0:{
   title:'삭제된 47초 · 편집국의 음성 파일',
   action:'늦은 밤 한국 방송사 편집실, 노트북의 추상 음성 파형, 빗물 맺힌 창, 얼굴 노출 없음',
   framing:'35mm, wide observational shot, distinct newsroom only',
   no:'화면 속 가짜 자막·인물 얼굴·다른 장면 합성·로고',
   fallback:'newsroom'
  },
  p1:{
   title:'보내지 못한 기사 · 정정 보류 기록',
   action:'신문 뭉치, 정정 보류 문서, 기자의 손만 보이는 작업 책상; 타인의 증언을 다시 확인하는 순간',
   framing:'50mm, tight documentary evidence desk shot, not p0 recrop',
   no:'읽을 수 있는 가짜 문구·언론사 로고·배우 얼굴·격자 합성',
   fallback:'evidence'
  },
  p2:{
   title:'모르는 여자 · 빗속 옥상 통화',
   action:'서울의 건물 옥상과 젖은 난간, 익명 전화의 불길한 기색; 인물 있다면 뒷모습만',
   framing:'35mm, wide night rooftop shot, a wholly new setting',
   no:'특정 고정 캐릭터 얼굴 생성·자막·다른 샷 복붙·영상 콜라주',
   fallback:'rooftop'
  },
  p3:{
   title:'여섯 달 후 · 추모 광장',
   action:'가상의 항구 추모광장에 놓인 빈 의자들과 국화, 흐린 새벽빛, 얼굴 식별 가능한 조문객 없음',
   framing:'35mm, respectful dawn establishing shot, independent scene',
   no:'실제 참사 사진·실제 유가족 재현·얼굴 클로즈업·가짜 명패·자막',
   fallback:'memorial'
  }
 };
 const candidates={
  'c04-a':'윤서아가 실제 구조선의 난간을 잡고 사고 해역을 가리키는 행동',
  'c05-b':'박소연이 병원에서 유가족의 손을 잡고 인터뷰 대신 보호를 돕는 행동',
  'c07-a':'한지유가 방송 편집실에서 광고계약서를 책상 위에 펼치는 행동',
  'c08-a':'이나경이 불안한 손으로 복제 저장매체를 건네는 행동',
  'c09-a':'윤서아가 관제 음성을 듣다가 이어폰을 낮추는 행동',
  'c11-a':'이나경이 원본 검증 키로 서버 로그를 확인하는 행동',
  'c14-a':'한지유가 송출 패널 앞에서 오디오를 검수하는 행동',
  'c14-o':'최종 방송의 송출등이 켜지는 3초 장면'
 };
 const catalog=Object.fromEntries(ids.map(id=>{
  const ref=shots[id]||{};
  return [id,Object.freeze({
   id,
   approved:false,
   image:null,
   sha256:null,
   motion:null,
   motionSha256:null,
   title:ref.title||story.scenes[id].title,
   fallback:ref.fallback||story.scenes[id].mood,
   brief:ref.action||null,
   framing:ref.framing||null,
   restrictions:ref.no||null,
   motionBrief:candidates[id]||null
  })];
 }));
 window.LastSignalMediaManifest=Object.freeze({
  version:1,
  protocol:'reboot-g2-scene-id-v1',
  generatedStillCount:0,
  approvedStillCount:0,
  approvedMotionCount:0,
  sceneCount:ids.length,
  catalog:Object.freeze(catalog),
  policies:Object.freeze({
   realFilmStillRequired:true,
   individuallyGenerated:true,
   preserveApprovedG1Identity:true,
   noTextInMedia:true,
   noImageRecycling:true,
   localOnly:true,
   videoAutoplayOnlyIfMuted:true,
   maximumConcurrentVideos:1,
   noFalseMediaSuccess:true
  })
 });
})();