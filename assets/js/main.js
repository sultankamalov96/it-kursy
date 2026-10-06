/* IT-КУРСЫ — отрисовка блоков из data.js, форма заявки, копирование текстов */
(function () {
    'use strict';

    const SITE = window.SITE || {};
    const S = SITE.settings || {};
    const courses = SITE.courses || [];
    const programs = SITE.programs || {};
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

    /* ---------- Хелперы ---------- */
    const $ = (sel) => document.querySelector(sel);
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const digits = (s) => String(s ?? '').replace(/\D+/g, '');
    const money = (n) => Number(n || 0).toLocaleString('ru-RU').replace(/ /g, ' ');
    const courseById = (id) => courses.find((c) => c.id === id);
    const nl2br = (s) => esc(s).replace(/\n/g, '<br>');

    const waNumber = digits(S.whatsapp);
    const waLink = (text) => waNumber ? 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text) : '#zayavka';

    function startLabel(date) {
        if (!date) return 'Скоро';
        const [y, m, d] = date.split('-').map(Number);
        return d && m ? d + ' ' + months[m - 1] : 'Скоро';
    }

    /* ---------- Отрисовка ---------- */
    function renderSettings() {
        document.querySelectorAll('[data-set]').forEach((el) => { el.textContent = S[el.dataset.set] || ''; });
        document.querySelectorAll('[data-wa]').forEach((a) => {
            a.href = waLink('Здравствуйте! Хочу записаться на курс программирования.');
        });
        $('#year').textContent = new Date().getFullYear();
        $('#dir-h').textContent = courses.length === 3 ? 'Три направления' : 'Направления';
    }

    function renderMark() {
        const byColor = {};
        courses.forEach((c) => { if (!byColor[c.color]) byColor[c.color] = c; });
        const pos = { blue: 'top', orange: 'right', green: 'bottom', purple: 'left' };
        $('#mark').innerHTML = Object.entries(pos).map(([color, p]) => {
            const c = byColor[color];
            return `<a class="tile tile-${p} c-${color}" href="${c ? '#kurs-' + esc(c.id) : '#zayavka'}">
                <span class="tile-in">
                    <span class="tile-label">${esc(c ? c.title : 'Твой проект')}</span>
                    <code>${esc(c ? c.sampleCode : 'git push → портфолио')}</code>
                </span></a>`;
        }).join('');
    }

    function renderCourses() {
        $('#dirs').innerHTML = courses.map((c) => `
            <article class="dir c-${esc(c.color)}" id="kurs-${esc(c.id)}">
                <div class="dir-top"><span class="gem" aria-hidden="true"></span><span class="dir-stack">${esc(c.stack)}</span></div>
                <h3>${esc(c.title)}</h3>
                <p>${esc(c.description)}</p>
                <ul class="chips">
                    ${(c.topics || []).map((t) => `<li>${esc(t)}</li>`).join('')}
                    <li class="chip-accent">Практические проекты</li>
                </ul>
                ${programs[c.id] ? `<a href="#programma-${esc(c.id)}" class="btn btn-ghost btn-block dir-more" data-program="${esc(c.id)}">Программа и проекты</a>` : ''}
                <div class="dir-foot">
                    <span class="dir-price">${money(c.price)} ${esc(S.currency)} <small>${esc(c.pricePeriod)}</small></span>
                    <a href="#zayavka" class="link-arrow" data-course="${esc(c.id)}">Записаться <span aria-hidden="true">→</span></a>
                </div>
            </article>`).join('');

        $('#prices').innerHTML = courses.map((c) => {
            const rows = [['Длительность', c.duration], ['Занятия', c.lessons], ['Формат', c.format]]
                .filter(([, v]) => v)
                .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
            return `
            <div class="price c-${esc(c.color)}">
                <h3><span class="gem" aria-hidden="true"></span>${esc(c.title)}</h3>
                <p class="price-sum"><b>${money(c.price)}</b> ${esc(S.currency)}</p>
                <p class="price-per">${esc(c.pricePeriod)}</p>
                <dl>${rows}</dl>
                <a href="#zayavka" class="btn btn-block btn-ghost" data-course="${esc(c.id)}">Записаться</a>
            </div>`;
        }).join('');

        $('#f-course').insertAdjacentHTML('beforeend',
            courses.map((c) => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join(''));
    }

    function renderWho() {
        $('#who').innerHTML = (SITE.forWhom || []).map((w) => `<li>${esc(w)}</li>`).join('');
        $('#why').innerHTML = (SITE.whyUs || []).map(([t, d]) => `<li><strong>${esc(t)}</strong><span>${esc(d)}</span></li>`).join('');
    }

    function renderSchedule() {
        const groups = (SITE.schedule || []).filter((g) => courseById(g.course));
        if (!groups.length) {
            $('#schedule').innerHTML = '<p class="empty">Расписание новых групп появится скоро. Оставьте заявку — сообщим о старте первыми.</p>';
            return;
        }
        const rows = groups.map((g) => {
            const c = courseById(g.course);
            const seats = Number(g.seats) || 0;
            const seatsHtml = seats === 0 ? '<span class="seats seats-none">Мест нет</span>'
                : seats <= 3 ? `<span class="seats seats-few">Осталось ${seats}</span>`
                : `<span class="seats">${seats} мест</span>`;
            const act = seats > 0
                ? `<a href="#zayavka" class="link-arrow" data-course="${esc(c.id)}" data-group="${esc(g.group + ', ' + g.days + ' ' + g.time)}">Записаться <span aria-hidden="true">→</span></a>`
                : '';
            return `<tr class="c-${esc(c.color)}${seats === 0 ? ' is-full' : ''}">
                <td data-l="Направление"><span class="gem gem-sm" aria-hidden="true"></span>${esc(c.title)}</td>
                <td data-l="Группа">${esc(g.group)}</td>
                <td data-l="Дни">${esc(g.days)}</td>
                <td data-l="Время" class="mono">${esc(g.time)}</td>
                <td data-l="Старт">${esc(startLabel(g.start))}</td>
                <td data-l="Места">${seatsHtml}</td>
                <td class="td-act">${act}</td></tr>`;
        }).join('');
        $('#schedule').innerHTML = `<div class="table-wrap"><table class="sched">
            <thead><tr><th>Направление</th><th>Группа</th><th>Дни</th><th>Время</th><th>Старт</th><th>Места</th><th><span class="sr">Действие</span></th></tr></thead>
            <tbody>${rows}</tbody></table></div>`;
    }

    function renderFaq() {
        const faq = SITE.faq || [];
        if (!faq.length) { $('#faq').hidden = true; return; }
        $('#faq-list').innerHTML = faq.map((f, i) =>
            `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><div class="faq-a">${nl2br(f.a)}</div></details>`).join('');
    }

    function renderTexts() {
        $('#texts').innerHTML = (SITE.texts || []).map((t, i) => {
            const body = t.list
                ? `<ul class="txt-list">${t.text.split('\n').filter((l) => l.trim()).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
                : `<div class="txt-body">${nl2br(t.text)}</div>`;
            return `<article class="txt${t.wide ? ' txt-wide' : ''}">
                <header><h3>${esc(t.title)}</h3><button type="button" class="copy" data-copy="${i}">Копировать</button></header>
                ${body}</article>`;
        }).join('');
    }

    function renderFooter() {
        const phoneDigits = digits(S.phone);
        $('#foot-contacts').innerHTML = [
            S.phone && `<li><a href="tel:+${phoneDigits}">${esc(S.phone)}</a></li>`,
            waNumber && `<li><a href="${esc(waLink('Здравствуйте!'))}" target="_blank" rel="noopener">WhatsApp</a></li>`,
            S.email && `<li><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>`,
        ].filter(Boolean).join('');
        $('#foot-address').innerHTML = [
            `<li>${esc([S.city, S.address].filter(Boolean).join(', '))}</li>`,
            S.hours && `<li class="muted">${esc(S.hours)}</li>`,
        ].filter(Boolean).join('');
        $('#foot-social').innerHTML = [
            S.instagram && `<li><a href="https://instagram.com/${encodeURIComponent(S.instagram)}" target="_blank" rel="noopener">Instagram · @${esc(S.instagram)}</a></li>`,
            S.telegram && `<li><a href="https://t.me/${encodeURIComponent(S.telegram)}" target="_blank" rel="noopener">Telegram · @${esc(S.telegram)}</a></li>`,
        ].filter(Boolean).join('');
    }

    renderSettings();
    renderMark();
    renderCourses();
    renderWho();
    renderSchedule();
    renderFaq();
    renderTexts();
    renderFooter();

    /* ---------- Шапка: тень при прокрутке и мобильное меню ---------- */
    const header = $('.site-header');
    const burger = $('.burger');
    const nav = $('#nav');

    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const setMenu = (open) => {
        burger.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('open', open);
    };
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    /* ---------- Форма заявки ---------- */
    const form = $('#lead-form');
    const select = $('#f-course');
    const msg = $('#f-msg');
    const statusEl = form.querySelector('.form-status');

    // Кнопки «Записаться» в карточках и расписании выбирают направление (и группу)
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-course]');
        if (!link) return;
        select.value = link.dataset.course;
        if (link.dataset.group && !msg.value.trim()) msg.value = 'Хочу в группу: ' + link.dataset.group;
        setTimeout(() => $('#f-name').focus({ preventScroll: true }), 450);
    });

    const setFieldError = (name, text) => {
        const err = document.getElementById('f-' + name + '-err');
        if (!err) return;
        err.textContent = text || '';
        err.closest('.field').classList.toggle('invalid', !!text);
    };

    const validate = (d) => {
        const errs = {};
        if (d.name.length < 2 || d.name.length > 100) errs.name = 'Введите имя — от 2 до 100 символов';
        const n = digits(d.phone).length;
        if (n < 9 || n > 15) errs.phone = 'Введите номер телефона, например +996 700 123 456';
        if (d.message.length > 1000) errs.message = 'Комментарий не длиннее 1000 символов';
        return errs;
    };

    /** Текст заявки для WhatsApp */
    const leadText = (d) => [
        'Здравствуйте! Хочу записаться на курс.',
        'Имя: ' + d.name,
        'Телефон: ' + d.phone,
        'Направление: ' + (d.courseTitle || 'ещё не решил'),
        d.message && 'Комментарий: ' + d.message,
    ].filter(Boolean).join('\n');

    /** Отправка в Google Таблицу. Возвращает { ok, error? } */
    async function sendToSheet(d) {
        try {
            const res = await fetch(SITE.googleScriptUrl, {
                method: 'POST',
                // простой запрос без preflight — так Apps Script принимает его из браузера
                body: new URLSearchParams({
                    name: d.name, phone: d.phone, course: d.courseTitle, message: d.message,
                    website: d.website, page: location.href,
                }),
            });
            const data = await res.json().catch(() => ({}));
            return data.ok ? { ok: true } : { ok: false, error: data.error };
        } catch (_) {
            return { ok: false, error: 'Нет соединения с интернетом. Проверьте сеть и попробуйте снова.' };
        }
    }

    function showSent(d, viaWhatsApp) {
        form.classList.add('sent');
        form.innerHTML =
            '<div class="sent-icon"><span>✓</span></div>' +
            (viaWhatsApp
                ? '<h3>Почти готово</h3><p>Мы открыли WhatsApp с текстом заявки — нажмите там «Отправить».</p>'
                : '<h3>Заявка отправлена</h3><p>Мы позвоним по номеру <b></b>, ответим на вопросы и подберём группу.</p>');
        const b = form.querySelector('b');
        if (b) b.textContent = d.phone;
        form.setAttribute('tabindex', '-1');
        form.focus();
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const course = courseById(String(fd.get('course') || ''));
        const d = {
            name: String(fd.get('name') || '').trim(),
            phone: String(fd.get('phone') || '').trim(),
            courseTitle: course ? course.title : '',
            message: String(fd.get('message') || '').trim(),
            website: String(fd.get('website') || ''),
        };

        ['name', 'phone', 'message'].forEach((f) => setFieldError(f, ''));
        statusEl.textContent = '';
        statusEl.className = 'form-status';

        const errs = validate(d);
        if (Object.keys(errs).length) {
            Object.entries(errs).forEach(([f, t]) => setFieldError(f, t));
            form.querySelector('.invalid input, .invalid textarea')?.focus();
            return;
        }

        // Таблица ещё не подключена — отправляем через WhatsApp
        if (!SITE.googleScriptUrl) {
            if (!waNumber) {
                statusEl.textContent = 'Форма пока не подключена. Позвоните нам: ' + (S.phone || '');
                statusEl.classList.add('err');
                return;
            }
            window.open(waLink(leadText(d)), '_blank', 'noopener');
            showSent(d, true);
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Отправляем…';
        const res = await sendToSheet(d);
        btn.disabled = false;
        btn.textContent = 'Отправить заявку';

        if (res.ok) { showSent(d, false); return; }

        statusEl.innerHTML = '';
        statusEl.append(res.error || 'Не удалось отправить заявку.');
        if (waNumber) {
            const a = document.createElement('a');
            a.href = waLink(leadText(d));
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = 'Отправить через WhatsApp';
            statusEl.append(' ', a);
        }
        statusEl.classList.add('err');
    });

    /* ---------- Окно «Программа и проекты» ---------- */
    const dlg = $('#course-dialog');
    const monthWord = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'месяц' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'месяца' : 'месяцев');

    function renderProgram(c, p) {
        const facts = [
            ['Стоимость', `${money(c.price)} ${S.currency || ''} ${c.pricePeriod || ''}`],
            ['Длительность', c.duration],
            ['Занятия', c.lessons],
            ['Формат', c.format],
        ].filter(([, v]) => v && String(v).trim());
        const months = p.months || [];
        return `
        <div class="cdlg-in c-${esc(c.color)}">
            <header class="cdlg-head">
                <div>
                    <p class="dir-top"><span class="gem" aria-hidden="true"></span><span class="dir-stack">${esc(c.stack)}</span></p>
                    <h2 id="cdlg-title" tabindex="-1" autofocus>${esc(c.title)}</h2>
                </div>
                <button type="button" class="cdlg-close" data-close aria-label="Закрыть">×</button>
            </header>

            <dl class="cdlg-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>

            ${(p.outcomes || []).length ? `
            <section class="cdlg-sec">
                <h3>Чему научишься</h3>
                <ul class="cdlg-check">${p.outcomes.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
            </section>` : ''}

            ${months.length ? `
            <section class="cdlg-sec">
                <h3>Программа: ${months.length} ${monthWord(months.length)}</h3>
                <ol class="cdlg-months">
                    ${months.map((m, i) => `
                    <li>
                        <span class="cdlg-mn">Месяц ${i + 1}</span>
                        <div>
                            <h4>${esc(m.title)}</h4>
                            <ul class="cdlg-topics">${(m.topics || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
                            ${m.project ? `<p class="cdlg-proj"><b>Проект</b>${esc(m.project)}</p>` : ''}
                        </div>
                    </li>`).join('')}
                </ol>
            </section>` : ''}

            ${p.finalProject ? `
            <section class="cdlg-sec cdlg-final">
                <p class="cdlg-label">Итоговый проект</p>
                <h3>${esc(p.finalProject.title)}</h3>
                <p>${esc(p.finalProject.text)}</p>
            </section>` : ''}

            ${(p.requirements || []).length ? `
            <section class="cdlg-sec">
                <h3>Что нужно для старта</h3>
                <ul class="cdlg-req">${p.requirements.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
            </section>` : ''}

            <footer class="cdlg-foot">
                <span class="dir-price">${money(c.price)} ${esc(S.currency)} <small>${esc(c.pricePeriod)}</small></span>
                <a href="#zayavka" class="btn" data-course="${esc(c.id)}" data-close>Записаться на курс <span aria-hidden="true">→</span></a>
            </footer>
        </div>`;
    }

    function openProgram(id) {
        const c = courseById(id);
        const p = programs[id];
        if (!c || !p || typeof dlg.showModal !== 'function') return false;
        dlg.innerHTML = renderProgram(c, p);
        if (!dlg.open) dlg.showModal();
        dlg.scrollTop = 0;
        history.replaceState(null, '', '#programma-' + id);
        return true;
    }

    dlg.addEventListener('close', () => {
        if (location.hash.startsWith('#programma-')) history.replaceState(null, '', location.pathname + location.search);
    });
    // клик по затемнённому фону закрывает окно
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

    document.addEventListener('click', (e) => {
        const open = e.target.closest('[data-program]');
        if (open && openProgram(open.dataset.program)) { e.preventDefault(); return; }
        if (e.target.closest('[data-close]')) dlg.close();
    });

    // Прямая ссылка: …/#programma-mobile
    const fromHash = () => {
        const m = location.hash.match(/^#programma-([\w-]+)$/);
        if (m) openProgram(m[1]);
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();

    /* ---------- Копирование готовых текстов ---------- */
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.copy');
        if (!btn) return;
        const text = (SITE.texts[Number(btn.dataset.copy)] || {}).text || '';
        let copied = false;
        try {
            await navigator.clipboard.writeText(text);
            copied = true;
        } catch (_) {
            // запасной путь, если clipboard API недоступен (например, file://)
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
            ta.remove();
        }
        btn.textContent = copied ? 'Скопировано' : 'Не удалось — выделите текст вручную';
        btn.classList.toggle('done', copied);
        setTimeout(() => { btn.textContent = 'Копировать'; btn.classList.remove('done'); }, 2000);
    });
})();
