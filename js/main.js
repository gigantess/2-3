// ===================================================
// 처방전 보관함 (Archive) 모듈 — localStorage 기반
// ===================================================
const ARCHIVE_KEY = 'paradox_mind_archive';

const Archive = {
    /** 저장된 전체 목록 반환 */
    getAll() {
        try {
            return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
        } catch {
            return [];
        }
    },

    /** 새 처방전 저장 */
    save(category, worry, quote) {
        const items = this.getAll();
        const item = {
            id: Date.now(),
            category,
            worry: worry.slice(0, 300),   // 너무 긴 내용 방지
            quote: quote.replace(/<br>/g, '\n').replace(/<[^>]*>/g, ''), // HTML 태그 제거
            date: new Date().toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            }),
            sent: false                   // 디스코드 전송 여부 플래그
        };
        items.unshift(item);               // 최신 항목을 맨 앞에
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items.slice(0, 50))); // 최대 50개
        this.render();
        return item;
    },

    /** 특정 ID 목록을 디스코드 전송 완료 상태로 변경 */
    markAsSent(sentIds) {
        const idSet = new Set(sentIds);
        const items = this.getAll().map(item => {
            if (idSet.has(item.id)) {
                return { ...item, sent: true };
            }
            return item;
        });
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items));
        this.render();
    },

    /** 항목 개별 삭제 */
    delete(id) {
        const items = this.getAll().filter(i => i.id !== id);
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items));
        this.render();
    },

    /** 전체 삭제 */
    clear() {
        localStorage.removeItem(ARCHIVE_KEY);
        this.render();
    },

    /** 보관함 섹션 렌더링 */
    render() {
        const items = this.getAll();
        const list       = document.getElementById('archive-list');
        const emptyMsg   = document.getElementById('archive-empty');
        const sendBtn    = document.getElementById('send-discord-btn');
        const clearBtn   = document.getElementById('clear-archive-btn');
        const countEl    = document.getElementById('archive-count');
        const badgeEl    = document.getElementById('archive-count-badge');

        if (!list) return;

        // 카운트 및 미전송 개수 계산
        const count = items.length;
        const unsentCount = items.filter(i => !i.sent).length;

        if (countEl)  countEl.textContent  = count;
        if (badgeEl) {
            const prev = parseInt(badgeEl.textContent || '0', 10);
            badgeEl.textContent = count;
            badgeEl.dataset.count = count;
            // 숫자가 증가할 때만 펄스 애니메이션
            if (count > prev) {
                badgeEl.classList.remove('badge-pulse');
                void badgeEl.offsetWidth; // reflow로 애니메이션 재시작
                badgeEl.classList.add('badge-pulse');
            }
        }

        // 빈 상태 / 있는 상태 토글
        const isEmpty = count === 0;
        if (emptyMsg) emptyMsg.classList.toggle('hidden', !isEmpty);
        if (clearBtn) clearBtn.disabled = isEmpty;

        if (sendBtn) {
            if (isEmpty) {
                sendBtn.disabled = true;
                sendBtn.textContent = '📨 디스코드로 전송하기';
            } else if (unsentCount === 0) {
                sendBtn.disabled = true;
                sendBtn.textContent = '✅ 디스코드 전송 완료';
            } else {
                sendBtn.disabled = false;
                sendBtn.textContent = `📨 디스코드로 전송하기 (${unsentCount}개 새 처방전)`;
            }
        }

        if (isEmpty) {
            list.innerHTML = '';
            return;
        }

        const CATEGORY_LABELS = {
            study: '📚 공부',
            work:  '🏢 직장생활',
            money: '💸 텅장',
            life:  '🛌 귀찮은 인생'
        };

        list.innerHTML = items.map(item => `
            <div class="archive-item ${item.sent ? 'is-sent' : ''}" data-id="${item.id}">
                <div class="archive-header">
                    <div class="archive-badge-group">
                        <span class="archive-category">${CATEGORY_LABELS[item.category] || '기타'}</span>
                        <span class="archive-sent-tag ${item.sent ? 'sent' : 'unsent'}">
                            ${item.sent ? '✅ 전송됨' : '🆕 미발송'}
                        </span>
                    </div>
                    <span class="archive-date">${item.date}</span>
                </div>
                <div class="archive-worry">😰 ${escapeHtml(item.worry)}</div>
                <div class="archive-quote">💊 ${escapeHtml(item.quote)}</div>
                <div class="archive-item-footer">
                    <button class="retro-btn small-btn danger-btn delete-btn" data-id="${item.id}">🗑️ 삭제</button>
                </div>
            </div>
        `).join('');

        // 개별 삭제 버튼 이벤트 바인딩
        list.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                if (confirm('이 처방전을 삭제할까요?')) {
                    Archive.delete(id);
                }
            });
        });
    }
};

/** XSS 방지용 HTML 이스케이프 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br>');
}

/** window에 등록해 api.js에서 접근 가능하게 함 */
window.ParadoxMind = { Archive };

// ===================================================
// 디스코드 전송 핸들러
// ===================================================
function initDiscordSend() {
    const sendBtn      = document.getElementById('send-discord-btn');
    const clearBtn     = document.getElementById('clear-archive-btn');
    const statusDiv    = document.getElementById('discord-status');

    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const allItems = Archive.getAll();
            const unsentItems = allItems.filter(item => !item.sent);

            if (unsentItems.length === 0) {
                if (statusDiv) {
                    statusDiv.className = 'discord-status-msg success';
                    statusDiv.textContent = 'ℹ️ 이미 모든 처방전이 디스코드로 전송되었습니다. 새로운 처방전을 저장해 보세요!';
                    statusDiv.classList.remove('hidden');
                    setTimeout(() => { if (statusDiv) statusDiv.classList.add('hidden'); }, 4000);
                }
                return;
            }

            const targetItems = unsentItems.slice(0, 10);

            // 전송 중 UI
            sendBtn.disabled = true;
            sendBtn.textContent = '📡 전송 중...';
            if (statusDiv) {
                statusDiv.className = 'discord-status-msg sending';
                statusDiv.textContent = `🔄 ${targetItems.length}개의 새로운 처방전을 디스코드로 보내고 있습니다...`;
                statusDiv.classList.remove('hidden');
            }

            try {
                const res = await fetch('/api/discord', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: targetItems }) // 미전송 항목만
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || `HTTP ${res.status}`);
                }

                // 성공 시 전송된 처방전들을 sent=true로 업데이트
                Archive.markAsSent(targetItems.map(i => i.id));

                if (statusDiv) {
                    statusDiv.className = 'discord-status-msg success';
                    statusDiv.textContent = `✅ ${data.sent}개의 새로운 처방전을 디스코드로 전송했습니다! 채널을 확인해보세요 🎉`;
                }
            } catch (err) {
                if (statusDiv) {
                    statusDiv.className = 'discord-status-msg error';
                    statusDiv.textContent = `❌ 전송 실패: ${err.message}`;
                }
                Archive.render(); // 상태 복구
            } finally {
                // 6초 후 상태 메시지 자동 숨김
                setTimeout(() => {
                    if (statusDiv) statusDiv.classList.add('hidden');
                }, 6000);
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('저장된 처방전을 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
                Archive.clear();
                if (statusDiv) statusDiv.classList.add('hidden');
            }
        });
    }
}

// ===================================================
// 보너스 2: 다크 모드 토글
// ===================================================
const DM_KEY = 'paradox_mind_dark';

function applyTheme(isDark) {
    const html  = document.documentElement;
    const btn   = document.getElementById('dark-mode-toggle');
    const icon  = btn ? btn.querySelector('.dm-icon')  : null;
    const label = btn ? btn.querySelector('.dm-label') : null;

    html.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (icon)  icon.textContent  = isDark ? '☀️' : '🌙';
    if (label) label.textContent = isDark ? '라이트' : '다크';
}

function initDarkMode() {
    const saved = localStorage.getItem(DM_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved !== null ? saved === 'true' : prefersDark;
    applyTheme(isDark);

    const btn = document.getElementById('dark-mode-toggle');
    if (btn) {
        btn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark';
            const next = !current;
            applyTheme(next);
            localStorage.setItem(DM_KEY, String(next));
        });
    }

    // OS 다크 모드 설정 변경 감지 (사용자가 수동 설정하지 않은 경우)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (localStorage.getItem(DM_KEY) === null) {
            applyTheme(e.matches);
        }
    });
}

// ===================================================
// 보너스 2: 스크롤 리빈 (IntersectionObserver)
// ===================================================
function initScrollReveal() {
    const targets = document.querySelectorAll('.comic-box');
    targets.forEach(el => el.classList.add('reveal-hidden'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('reveal-hidden');
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target); // 한 번만 트리거
            }
        });
    }, { threshold: 0.08 });

    targets.forEach(el => observer.observe(el));
}

// ===================================================
// DOMContentLoaded 진입점
// ===================================================
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
    const resetBtn  = document.getElementById('reset-btn');
    const worryForm = document.getElementById('worry-form');
    const resultArea = document.getElementById('result-area');

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (worryForm) worryForm.reset();
            if (resultArea) resultArea.classList.add('hidden');

            // 폼으로 다시 스크롤
            const generatorSection = document.getElementById('generator');
            const headerHeight = document.querySelector('.kitsch-header').offsetHeight;
            window.scrollTo({
                top: generatorSection.getBoundingClientRect().top + window.scrollY - headerHeight - 20,
                behavior: 'smooth'
            });
        });
    }

    // 4. 보관함 초기 렌더링 + 디스코드 버튼 초기화
    Archive.render();
    initDiscordSend();

    // 5. 다크 모드 초기화 (미리 저장된 설정 적용)
    initDarkMode();

    // 6. 스크롤 리빈 (IntersectionObserver)
    initScrollReveal();

    // 7. 마인드 컨트롤 갤러리 랜덤 출력 로직 (50개 B급 명언)
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
