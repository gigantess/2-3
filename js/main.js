document.addEventListener('DOMContentLoaded', () => {
    // 1. 네비게이션 스무스 스크롤 (바닐라 JS)
    const links = document.querySelectorAll('nav a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // 헤더 높이만큼 오프셋을 주기 위해
                const headerHeight = document.querySelector('.kitsch-header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. 폼 제출 이벤트 핸들링은 api.js에서 전담합니다.

    // 3. 리셋 버튼 (다시하기)
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            worryForm.reset();
            resultArea.classList.add('hidden');
            
            // 폼으로 다시 스크롤
            const generatorSection = document.getElementById('generator');
            const headerHeight = document.querySelector('.kitsch-header').offsetHeight;
            window.scrollTo({
                top: generatorSection.getBoundingClientRect().top + window.scrollY - headerHeight - 20,
                behavior: 'smooth'
            });
        });
    }

    // 4. 마인드 컨트롤 갤러리 랜덤 출력 로직 (50개 B급 명언)
    const quotes = [
        { q: "돈이 없어요.", a: "걱정마세요, 내일도 없을 테니까요! 어차피 안 생기니 마음을 비우세요." },
        { q: "살이 자꾸 쪄요.", a: "축하합니다! 지구의 중력을 더 많이 받을 수 있는 특별한 존재가 되셨군요." },
        { q: "출근하기 싫어요.", a: "회사도 당신이 오길 썩 기다리지 않을지도 모릅니다. 무승부네요!" },
        { q: "공부하기 싫어요.", a: "괜찮아요, 공부도 당신을 좋아하지 않을 거예요." },
        { q: "내 집 마련은 언제쯤...", a: "우주에 먼지 같은 우리 존재, 집이 다 무슨 소용입니까." },
        { q: "애인이 안 생겨요.", a: "당신의 눈높이를 지하 3층으로 낮춰보세요. 그래도 없으면 포기하세요." },
        { q: "오늘 뭐 먹지?", a: "어차피 내일이면 배설될 거, 대충 드세요." },
        { q: "퇴사하고 싶어요.", a: "통장 잔고를 보세요. 퇴사 욕구가 싹 사라질 겁니다." },
        { q: "인생이 노잼이에요.", a: "당신 얼굴을 거울로 보세요. 꽤나 유잼일 겁니다." },
        { q: "다이어트 언제 시작하죠?", a: "내일부터요. 다이어트는 내일의 나에게 미루는 것이 국룰입니다." },
        { q: "피곤해 죽겠어요.", a: "죽으면 영원히 잘 수 있습니다. 조금만 더 버티세요." },
        { q: "상사가 너무 꼰대 같아요.", a: "당신도 10년 뒤면 똑같이 됩니다. 거울 치료 미리 하세요." },
        { q: "로또 1등 언제 될까요?", a: "번개를 두 번 맞을 확률입니다. 피뢰침부터 사세요." },
        { q: "쉬어도 쉬는 것 같지 않아요.", a: "대출금을 떠올려보세요. 쉴 틈이 어딨습니까." },
        { q: "인간관계가 힘들어요.", a: "인간을 포기하면 관계도 사라집니다. 자연인이 되세요." },
        { q: "아침에 일어나기 힘들어요.", a: "알람 시계를 쓰레기통에 넣으세요. 어차피 못 일어날 거 편하게 자세요." },
        { q: "머리가 나쁜 것 같아요.", a: "이제 아셨군요! 자아 성찰이 뛰어납니다." },
        { q: "주식이 자꾸 떨어져요.", a: "당신이 샀으니까요. 팔면 오릅니다." },
        { q: "시간이 너무 빨리 가요.", a: "재미없는 책을 읽어보세요. 1분이 1시간 같습니다." },
        { q: "자존감이 바닥이에요.", a: "지하를 뚫고 멘틀까지 가보세요. 거기가 바닥입니다." },
        { q: "열정이 식었어요.", a: "냉장고에 넣어둔 열정을 전자레인지에 데워보세요." },
        { q: "앞날이 막막해요.", a: "눈을 감아보세요. 원래 다 그런 겁니다." },
        { q: "스트레스 받아요.", a: "통장 잔고를 보면 스트레스가 분노로 바뀝니다." },
        { q: "운동하기 귀찮아요.", a: "숨쉬기 운동도 훌륭한 유산소 운동입니다." },
        { q: "결혼할 수 있을까요?", a: "혼자 사는 게 제일 편합니다. 환상을 버리세요." },
        { q: "왜 나만 불행할까요?", a: "남들도 다 불행합니다. 티를 안 낼 뿐이죠." },
        { q: "아무것도 하기 싫어요.", a: "격렬하게 아무것도 하지 마세요. 그것도 능력입니다." },
        { q: "월급이 너무 적어요.", a: "당신의 업무량을 생각해보면 적당할지도 모릅니다." },
        { q: "미래가 불안해요.", a: "현재도 불안한데 미래까지 걱정하시다니, 대단한 오지랖입니다." },
        { q: "친구들이 다 잘 나가요.", a: "연락을 끊으세요. 그럼 비교할 대상이 사라집니다." },
        { q: "운이 없는 것 같아요.", a: "운이 없는 게 아니라 실력이 없는 겁니다. 팩트 체크하세요." },
        { q: "다 포기하고 싶어요.", a: "포기하면 편합니다. 배추 셀 때나 쓰는 말이죠." },
        { q: "성공하고 싶어요.", a: "꿈에서 깨어나세요. 여긴 현실입니다." },
        { q: "잠이 안 와요.", a: "전공 서적을 펼쳐보세요. 3분 안에 잠듭니다." },
        { q: "휴가가 너무 짧아요.", a: "백수가 되면 365일이 휴가입니다. 도전해보세요." },
        { q: "기억력이 떨어져요.", a: "나쁜 기억을 잊기 위한 뇌의 방어 기제입니다. 좋게 생각하세요." },
        { q: "화가 참아지지 않아요.", a: "참지 마세요! 화병 납니다. 소리 한번 지르세요." },
        { q: "외로워요.", a: "사람이 많다고 외롭지 않은 건 아닙니다. 원래 인생은 독고다이." },
        { q: "일이 재미없어요.", a: "재밌으면 돈을 내고 하겠죠. 돈 받으니까 참으세요." },
        { q: "청춘이 아깝네요.", a: "이미 지나갔습니다. 남은 노후나 걱정하세요." },
        { q: "내가 뭘 좋아하는지 모르겠어요.", a: "돈 쓰는 걸 제일 좋아하실 겁니다. 부정하지 마세요." },
        { q: "자꾸 딴생각이 들어요.", a: "본업이 재미없어서 그렇습니다. 정상입니다." },
        { q: "나이를 먹는 게 두려워요.", a: "안 먹으면 죽습니다. 감사하게 드세요." },
        { q: "선택 장애가 있어요.", a: "동전을 던지세요. 어차피 후회는 똑같습니다." },
        { q: "실수가 너무 잦아요.", a: "당신의 정체성입니다. 완벽하면 인간미 없어요." },
        { q: "칭찬받고 싶어요.", a: "거울 보고 스스로 하세요. 남들은 당신에게 관심 없습니다." },
        { q: "답답해요.", a: "사이다를 드세요. 속이 뻥 뚫릴 겁니다." },
        { q: "요즘 너무 예민해요.", a: "당이 떨어져서 그렇습니다. 초콜릿을 드세요." },
        { q: "귀차니즘이 심해요.", a: "나무늘보의 환생일 수 있습니다. 운명을 받아들이세요." },
        { q: "모든 게 허무해요.", a: "배가 고파서 그렇습니다. 치킨을 시키세요." }
    ];

    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
        const shuffled = quotes.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        
        selected.forEach(item => {
            const div = document.createElement('div');
            div.className = 'gallery-item retro-card';
            div.innerHTML = `
                <div class="q">Q: ${item.q}</div>
                <div class="a">A: ${item.a}</div>
            `;
            galleryContainer.appendChild(div);
        });
    }
});
