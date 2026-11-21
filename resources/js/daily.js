// Daily page: a fixed calendar of readings, one per date (MM-DD), the same every year.
// Built by scripts/build-daily.js into daily/MM.json, daily/affirmations.json and
// daily/fallback.json. A date with no approved entry shows the fallback.
(function () {
    var esc = SM.esc;
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var el = {
        label: document.getElementById('reflection-date-display'),
        body: document.getElementById('reflection-body'),
        prev: document.getElementById('prev-date'),
        next: document.getElementById('next-date'),
        aff: document.getElementById('affirmations-body'),
        grat: document.getElementById('gratitude-body'),
        actions: document.getElementById('daily-actions'),
        share: document.getElementById('daily-share'),
        save: document.getElementById('daily-save'),
        form: document.getElementById('date-picker'),
        month: document.getElementById('pick-month'),
        day: document.getElementById('pick-day'),
        today: document.getElementById('pick-today'),
        savedSection: document.getElementById('saved-section'),
        savedList: document.getElementById('saved-list'),
    };

    var pad = function (n) { return String(n).padStart(2, '0'); };
    var todayKey = SM.dayKey().slice(5); // the visitor's local date
    var current = null;   // MM-DD on screen
    var shown = null;     // { title, isFallback } for the entry on screen
    var requestId = 0;

    function valid(key) {
        var m = /^(\d\d)-(\d\d)$/.exec(key || '');
        if (!m) return false;
        var mo = Number(m[1]), d = Number(m[2]);
        return mo >= 1 && mo <= 12 && d >= 1 && d <= DAYS[mo - 1];
    }
    function label(key) {
        return Number(key.slice(3)) + ' ' + MONTHS[Number(key.slice(0, 2)) - 1];
    }
    function step(key, delta) {
        var mo = Number(key.slice(0, 2)), d = Number(key.slice(3)) + delta;
        if (d < 1) { mo = mo === 1 ? 12 : mo - 1; d = DAYS[mo - 1]; }
        else if (d > DAYS[mo - 1]) { mo = mo === 12 ? 1 : mo + 1; d = 1; }
        return pad(mo) + '-' + pad(d);
    }
    function pageUrl(key) {
        return location.href.split(/[?#]/)[0] + '?date=' + key;
    }

    // ─── Data ────────────────────────────────────────
    var cache = {};
    function getJson(name) {
        if (!cache[name]) {
            cache[name] = fetch('daily/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
                if (!r.ok) throw new Error('not available');
                return r.json();
            });
            cache[name].catch(function () { delete cache[name]; });
        }
        return cache[name];
    }
    function entryFor(key) {
        return getJson(key.slice(0, 2)).then(function (month) {
            if (month && month[key]) return { entry: month[key], isFallback: false };
            return getJson('fallback').then(function (fb) { return { entry: fb, isFallback: true }; });
        });
    }

    // ─── Saved (this device only) ────────────────────
    function saved() {
        var list = SM.load('daily-saved', []);
        return Array.isArray(list) ? list.filter(function (s) { return s && valid(s.d); }) : [];
    }
    function isSaved(key) {
        return saved().some(function (s) { return s.d === key; });
    }
    function renderSaved() {
        var list = saved().sort(function (a, b) { return a.d < b.d ? -1 : 1; });
        el.savedSection.hidden = !list.length;
        el.savedList.innerHTML = list.map(function (s) {
            return '<li class="help-line"><strong>' + esc(s.t || label(s.d)) + '</strong><span>' + esc(label(s.d)) + '</span>' +
                '<div class="btn-row"><a class="btn btn-sm" href="?date=' + s.d + '" data-open="' + s.d + '">Open</a>' +
                '<button class="btn btn-sm btn-ghost" type="button" data-remove="' + s.d + '">Remove</button></div></li>';
        }).join('');
    }
    function paintSave() {
        var on = current && isSaved(current);
        el.save.textContent = on ? 'Saved' : 'Save';
        el.save.setAttribute('aria-pressed', String(!!on));
    }

    // ─── Rendering ───────────────────────────────────
    function fillDays() {
        var n = DAYS[Number(el.month.value) - 1], keep = Number(el.day.value) || 1, html = '';
        for (var d = 1; d <= n; d++) html += '<option value="' + pad(d) + '">' + d + '</option>';
        el.day.innerHTML = html;
        el.day.value = pad(Math.min(keep, n));
    }
    function render(key, data, affirmations) {
        var e = data.entry;
        shown = { title: e.title, isFallback: data.isFallback };
        el.body.innerHTML =
            '<h2 class="reflection-theme">' + esc(e.title) + '</h2>' +
            '<div class="reflection-reading">' + e.reading.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>';
        el.aff.innerHTML = e.affirmations.map(function (n, i) {
            return affirmations[n] ? '<div class="affirmation-card"><span class="affirmation-number">' + (i + 1) + '</span><p>' + esc(affirmations[n]) + '</p></div>' : '';
        }).join('');
        el.grat.innerHTML = '<div class="gratitude-card"><p class="prayer-text">' + esc(e.gratitude) + '</p></div>';
        el.actions.hidden = false;
        el.save.hidden = data.isFallback; // only a date's own reading can be saved
        paintSave();
    }

    // how: 'push' adds a history entry, 'replace' rewrites the address, anything else leaves it alone
    function show(key, how) {
        current = key;
        var id = ++requestId;
        el.label.textContent = (key === todayKey ? 'Today · ' : '') + label(key);
        el.month.value = key.slice(0, 2);
        fillDays();
        el.day.value = key.slice(3);
        el.today.hidden = key === todayKey;
        el.actions.hidden = true;
        el.body.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p>Loading…</p></div>';
        try {
            if (how === 'push') history.pushState({ date: key }, '', '?date=' + key);
            else if (how === 'replace') history.replaceState({ date: key }, '', '?date=' + key);
        } catch (e) { /* address bar stays as it is */ }

        Promise.all([entryFor(key), getJson('affirmations')]).then(
            function (r) { if (id === requestId) render(key, r[0], r[1]); },
            function () {
                if (id !== requestId) return;
                el.body.innerHTML = '<p class="ai-error">The reading could not be loaded. Check your connection and try again.</p>';
                el.aff.innerHTML = el.grat.innerHTML = '';
            }
        );
    }

    // ─── Controls ────────────────────────────────────
    el.month.innerHTML = MONTHS.map(function (m, i) { return '<option value="' + pad(i + 1) + '">' + m + '</option>'; }).join('');
    el.month.addEventListener('change', fillDays);
    el.prev.addEventListener('click', function () { show(step(current, -1), 'push'); });
    el.next.addEventListener('click', function () { show(step(current, 1), 'push'); });
    el.form.addEventListener('submit', function (e) {
        e.preventDefault();
        var key = el.month.value + '-' + el.day.value;
        if (!valid(key)) return;
        show(key, 'push');
        document.getElementById('main').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    el.today.addEventListener('click', function () {
        show(todayKey, 'push');
        document.getElementById('main').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    el.share.addEventListener('click', function () {
        if (!current || !shown) return;
        SM.share('“' + shown.title + '” · the Sober Mindset reading for ' + label(current), pageUrl(current));
    });
    el.save.addEventListener('click', function () {
        if (!current || !shown || shown.isFallback) return;
        var list = saved(), was = isSaved(current);
        list = list.filter(function (s) { return s.d !== current; });
        if (!was) list.push({ d: current, t: shown.title });
        if (!SM.save('daily-saved', list)) { SM.toast('Could not save on this device'); return; }
        SM.toast(was ? 'Removed from Saved' : 'Saved on this device');
        paintSave();
        renderSaved();
    });
    el.savedList.addEventListener('click', function (e) {
        var open = e.target.closest('[data-open]'), remove = e.target.closest('[data-remove]');
        if (open) {
            e.preventDefault();
            show(open.getAttribute('data-open'), 'push');
            document.getElementById('main').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (remove) {
            var d = remove.getAttribute('data-remove');
            SM.save('daily-saved', saved().filter(function (s) { return s.d !== d; }));
            paintSave();
            renderSaved();
        }
    });
    window.addEventListener('popstate', function () {
        var p = new URLSearchParams(location.search).get('date');
        show(valid(p) ? p : todayKey);
    });

    // ─── Start ───────────────────────────────────────
    var asked = new URLSearchParams(location.search).get('date');
    renderSaved();
    show(valid(asked) ? asked : todayKey);
})();
