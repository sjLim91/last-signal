/* Optional, character-specific conversations for Episode 0.
 * Reuses existing approved G1 portraits. No AI API calls or unapproved faces.
 * Dialogue updates real story stats/flags without touching the legacy save key.
 */
(function(root){
'use strict';
const names=Object.freeze({jiyu:'한지유',seoa:'윤서아',soyeon:'박소연',nagyeong:'이나경'});
const roles=Object.freeze({jiyu:'탐사보도 책임 프로듀서',seoa:'민간 해상구조팀 책임자',soyeon:'생존자·가족 지원 활동가',nagyeong:'선사 항해데이터 내부고발자'});
const faceIDs=Object.freeze({jiyu:'jiyu-face',seoa:'seoa-face',soyeon:'soyeon-face'}); // No approved Nagyeong face in source file.
const d=(actor,lead,ask,trust,replyAsk,replyTrust)=>({
 actor,lead,actions:[
  {label:ask,kind:'probe',line:replyAsk,delta:{proof:6,[actor]:-2},flags:['asked_'+actor]},
  {label:trust,kind:'bond',line:replyTrust,delta:{protection:4,[actor]:7},flags:['heard_'+actor]}
 ]
});
const specs=Object.freeze({
 hidden:d('jiyu','지유는 아직 당신이 숨긴 것을 알고 있는지 말하지 않는다.',
 '그날 정정 기사를 왜 막았는지 추궁한다','먼저 지금 자신을 찾아온 이유를 듣는다',
 '“광고주 전화가 왔어요. 내가 그 전화를 받았죠. 당신한테는 미리 말하지 않았고요.”',
 '“누군가 기자님 움직임을 보고 있어요. 내 차가 아니에요. 여기 오래 있지 마요.”'),
 hide_trace:d('jiyu','그녀는 당신이 누구를 믿을지 고르는 동안 화면을 끄지 않는다.',
 '원본 파일의 보관 경로를 묻는다','지유가 왜 그 파일을 지켰는지 묻는다',
 '“서버에서 바로 지우지 못하도록 복사본 세 개를 만들었어요. 적어도 그때는 내가 겁이 났으니까요.”',
 '“당신이 다시 취재할 거라고 생각했어요. 그때 못 했던 말을 오늘은 해야 하니까.”'),
 crossroads:d('jiyu','지유는 수정 원고 한 장을 손끝으로 밀어 준다.',
 '삭제된 원고를 누가 승인했는지 묻는다','여섯 달 동안 어떻게 지냈는지 묻는다',
 '“최종 승인자는 나예요. 그런데 승인 요청을 보낸 사람은 다른 이름으로 남아 있어요.”',
 '“당신이 날 싫어해도 이해해요. 그래도 이 사건은 끝까지 같이 보고 싶어요.”'),
 editor:d('jiyu','지유는 예전 광고 계약서를 숨기지 않는다.',
 '투자자와 개인적으로 어떤 관계인지 확인한다','잘못된 선택을 인정할 기회를 준다',
 '“사적인 관계였어요. 그 사람이 보도국까지 들어온 날, 내 판단은 이미 흔들리고 있었죠.”',
 '“내가 틀렸어요. 방송 앞에서 말할 거예요. 대신 증거를 먼저 확보해 주세요.”'),
 editor_docs:d('jiyu','그녀가 보관실 열쇠를 쥐고 있다.',
 '복사본의 접근 기록을 요구한다','지유에게 안전한 장소부터 제안한다',
 '“언제, 누가, 몇 시에 이 문서를 열었는지 확인할 수 있어요. 다른 기록과 맞춰 봐요.”',
 '“내가 책임지겠다는 말, 이제 믿기 어렵겠죠. 그래도 일단 여기서 나가요.”'),
 editor_call:d('jiyu','통화가 끊겨도 지유의 손은 전화기 위에 멈춰 있다.',
 '이사가 지금까지 제안한 대가를 묻는다','지유가 거절할 수 있도록 편을 든다',
 '“독점 보도권과 자리를 약속했어요. 대신 47초 얘기는 끝내자고 했죠.”',
 '“그 사람이 무슨 말을 하든 내 책임이 사라지는 건 아니에요. 그래도 혼자는 아니군요.”'),
 solo:d('nagyeong','나경은 카메라를 피하고 화면의 검증값을 가리킨다.',
 '승인 로그의 정합성을 검증한다','나경의 신원 보호 조건부터 확인한다',
 '“사본만 믿지 말아요. 원본 보존 경로와 제 전자서명이 함께 있어야 합니다.”',
 '“내가 한 일까지 쓰세요. 대신 다른 사람을 끌어들이기 전에 나한테 말해 줘요.”'),
 solo_safe:d('nagyeong','나경은 출구 쪽을 보며 발걸음을 늦춘다.',
 '47초 자료의 복제 시각을 묻는다','나경이 안전하게 빠져나갈 길을 제안한다',
 '“어젯밤에도 열람 기록이 있었어요. 사고 직후에만 누군가 손댄 게 아닙니다.”',
 '“기자님을 믿어 보겠어요. 대신 내 위치만큼은 누구에게도 넘기지 마세요.”'),
 solo_copy:d('nagyeong','나경에게 다시 전화를 걸면 짧은 신호음만 들린다.',
 '남아 있는 문자에서 파일 작성 시각을 확인한다','그녀에게 사과하는 음성 메시지를 남긴다',
 '“수정 시간이 어젯밤이라는 건 맞아요. 하지만 누가 바꿨는지는 아직 몰라요.”',
 '“사과할 필요는 없어요. 그 파일 때문에 내가 죽을지도 모른다는 것만 기억해 줘요.”'),
 threat:d('seoa','서아는 당신이 아니라 출항 기록을 먼저 바라본다.',
 '당시 구조 지시가 바뀐 시각을 묻는다','그날의 판단을 서아에게 직접 듣는다',
 '“제가 받은 좌표는 공식 조사서보다 늦었어요. 몇 분 차이가 누군가에게는 평생이었죠.”',
 '“사람을 놓쳤어요. 다만 내 실수와 내가 받지 않은 지시까지 한데 묶지 말아 주세요.”'),
 ally_seoa:d('seoa','서아는 젖은 구조선 난간에 손을 올린다.',
 '공식 좌표와 구조선 항적을 대조한다','서아가 후회하는 선택을 묻는다',
 '“전부 기록해요. 내가 잘못 돌린 방향도, 관제에서 내려온 좌표도.”',
 '“그때 돌아가고 싶은 순간이 너무 많아요. 그렇다고 지금 사람까지 놓치고 싶진 않아요.”'),
 seoa_log:d('seoa','서아는 녹음된 자신의 무전 목소리를 끝까지 듣지 못한다.',
 '녹음에 남은 남자 목소리를 물어본다','그 기록이 공개되어도 괜찮을지 묻는다',
 '“알아듣는 말투예요. 하지만 지금 이름을 말하면 증명할 길이 없어요.”',
 '“제 잘못도 같이 쓰세요. 그래야 누군가 다른 사람 잘못을 제 뒤에 숨기지 못하니까.”'),
 seoa_lights:d('seoa','서아는 신호등의 간격을 손가락으로 센다.',
 '등화 주기를 구조 기록과 비교한다','위험한 수색을 중지하자고 제안한다',
 '“정상적인 항로등 신호가 아니에요. 누군가 여기서 지금 신호를 보내고 있어요.”',
 '“이제 구하지 못할 사람을 더 만들고 싶지 않아요. 대신 증거를 꼭 남겨 주세요.”'),
 ally_soyeon:d('soyeon','소연은 기자 수첩을 바라보다 다시 당신의 눈을 본다.',
 '보호명단에 두 개의 이름이 있는지 묻는다','취재보다 생존자 안정을 우선하겠다고 말한다',
 '“명단이 다른 건 맞아요. 그렇다고 지금 이름을 읽어 드릴 순 없어요.”',
 '“오늘은 한 명이라도 잠들 수 있게 해 주세요. 그래야 내일 증언할 수 있어요.”'),
 soyeon_shelter:d('soyeon','소연은 작은 문을 열어 두고 당신의 반응을 기다린다.',
 '남겨진 탑승권을 확인하게 해 달라고 한다','숨겨 준 이유부터 조용히 듣는다',
 '“번호만 적으세요. 사람을 알아낼 수 있는 건 아직 공개하면 안 됩니다.”',
 '“그 사람은 어젯밤까지 여기 있었어요. 내가 지켜 줬다고 믿었죠. 사실은 도망칠 곳만 준 거예요.”'),
 soyeon_names:d('soyeon','소연이 두 명의 이름 사이에 펜을 놓는다.',
 '두 등록번호의 시각을 대조한다','정정 기사의 피해를 먼저 인정한다',
 '“같은 이름이라고 같은 사람은 아니에요. 특히 이 사건에서는요.”',
 '“기자님이 쓴 기사로 누군가의 죽음이 확정됐어요. 이번에는 지우지 말고 정정해 주세요.”'),
 save_private:d('soyeon','소연은 안쪽 방의 불을 한 단계 낮춘다.',
 '증인 동의 절차를 확인한다','증인에게 선택권을 주겠다고 약속한다',
 '“동의하지 않은 기록을 밖으로 빼지 마세요. 그건 증거보다 먼저 지킬 약속이에요.”',
 '“당신이 그 말을 지킬 수 있다면, 내일 그 사람이 자기 이름을 직접 말할 수 있을 거예요.”'),
 reveal:d('jiyu','송출을 앞두고 지유는 당신의 원고를 펼친다.',
 '방송에서 확인할 수 있는 부분을 묻는다','지유가 두려워하는 것을 묻는다',
 '“출처, 시간표, 정정문. 그것만으로도 충분히 큰 뉴스예요. 우리가 모르는 건 모른다고 해야 해요.”',
 '“우리가 또 한 사람을 기사로 죽일까 봐요. 이번에는 마지막까지 검증하고 싶어요.”'),
 broadcast:d('jiyu','지유는 송출 패널의 붉은 표시등을 바라본다.',
 '마지막 원고의 출처를 함께 검증한다','보도 이후의 책임을 함께 지겠다고 말한다',
 '“잘못 쓴 문장은 지워요. 남기는 것마다 책임질 수 있게요.”',
 '“이번에는 혼자 내보내지 않을게요. 당신 원고에 내 이름도 올릴 거예요.”'),
 protect:d('soyeon','소연은 보호 인계서 위에 손을 얹는다.',
 '보호기관의 확인번호를 확보한다','증인의 의사를 다시 확인하자고 한다',
 '“담당자와 연락처를 먼저 남겨 주세요. 기록이 없으면 보호도 약속뿐이에요.”',
 '“증인이 오늘 침묵하기로 선택했다면 그 결정도 존중해야 해요.”'),
 bargain:d('jiyu','지유는 통화 연결음을 듣자마자 표정이 굳어진다.',
 '거래 조건을 서면으로 요구한다','지유가 혼자 감당하지 않게 돕는다',
 '“입으로 한 거래는 없어져요. 서명이 남아야 누구를 압박했는지 드러나요.”',
 '“이번에는 그 사람한테 다시 흔들리지 않을 거예요. 나도 같이 결정할게요.”')
});
const clamp=n=>Math.min(100,Math.max(0,Math.round(n)));
function specFor(id,state){
 const base=specs[id];
 if(!base)return null;
 // React to decisions at scene entry; previous interaction makes a concrete difference.
 let lead=base.lead;
 const trust=state.stats[base.actor]||0;
 if(trust>=65)lead+=' 이제 상대는 먼저 이야기를 이어 가려 한다.';
 else if(trust<=29)lead+=' 상대는 여전히 당신을 경계해 말끝을 흐린다.';
 if(id==='reveal'&&state.flags.overclaim)lead='지유가 원고에서 고의적 범죄라고 단정한 문장을 지운다. “이건 확인되지 않았어요. 방송하지 못해요.”';
 if(id==='reveal'&&state.flags.identity_caution)lead='지유가 고개를 끄덕인다. “신분증을 가진 사람이 누구인지는 감식 전까지 단정하지 않죠.”';
 if(id==='seoa_log'&&state.flags.heard_seoa)lead='서아가 잠시 눈을 감는다. “그날 내 선택까지 기록하겠다고 했죠. 약속 지켜 주세요.”';
 if(id==='editor'&&state.flags.heard_jiyu)lead='지유가 먼저 광고계약서의 마지막 장을 펼친다. “숨기는 건 여기까지 할게요.”';
 if(id==='solo_safe'&&state.flags.asked_nagyeong)lead='나경이 먼저 복제 기록을 보여 준다. “원본 검증부터 했죠. 그건 옳은 선택이에요.”';
 if(id==='soyeon_names'&&state.flags.heard_soyeon)lead='소연이 조용히 명단을 건넨다. “사람부터 보겠다고 했죠. 이번에도 잊지 마세요.”';
 return {...base,lead};
}
function interact(state,id,index){
 const spec=specFor(id,state);
 if(!spec)throw Error('No conversation for '+id);
 const actions=spec.actions;
 const action=actions[index];
 if(!action)throw Error('Invalid interaction');
 if(state.scene!==id)throw Error('Cannot talk outside active scene');
 if(state.interactions?.[id])throw Error('Conversation already held this scene');
 const next={...state,stats:{...state.stats},flags:{...state.flags},interactions:{...(state.interactions||{})}};
 for(const [key,val] of Object.entries(action.delta)){
  if(!(key in next.stats))throw Error('Invalid stat '+key);
  next.stats[key]=clamp(next.stats[key]+val);
 }
 for(const flag of action.flags)next.flags[flag]=true;
 next.interactions[id]={action:action.kind,actor:spec.actor,line:action.line};
 next.updated=Date.now();
 return {state:next,reply:action.line,actor:spec.actor,kind:action.kind};
}
root.LastSignalActors=Object.freeze({names,roles,faceIDs,specFor,interact,sceneSpecs:specs});
})(window);