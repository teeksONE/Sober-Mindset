// Crew Pact: a shared challenge that travels as a link.
// The pact itself (name, length, start date) is encoded in the URL so a
// friend can open the same one. Each person's ticks stay on their own device.
(function () {
    var root = document.getElementById('pact');
    if (!root) return;
    var esc = SM.esc;
    var base = location.href.split('#')[0];

    function encode(p) {
        return btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function decode(s) {
        try {
            var p = JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
            var days = Math.round(Number(p.d));
            if (typeof p.n !== 'string' || !p.n.trim() || !(days >= 1 && days <= 366) || !/^\d{4}-\d{2}-\d{2}$/.test(p.s)) return null;
            return { n: p.n.trim().slice(0, 60), d: days, s: p.s, by: typeof p.by === 'string' ? p.by.trim().slice(0, 30) : '' };
        } catch (e) { return null; }
    }
    function all() { return SM.load('pacts', {}); }
    function link(code) { return base + '#p=' + code; }

    function fromHash() {
        var m = location.hash.match(/^#p=([\w-]+)$/);
        return m ? m[1] : null;
    }

    function create() {
        var mine = all(), codes = Object.keys(mine);
        root.innerHTML =
            (codes.length ? '<h2>Your pacts</h2><ul class="help-list" style="margin-bottom:26px">' + codes.map(function (c) {
                var p = decode(c); if (!p) return '';
                return '<li class="help-line"><strong>' + esc(p.n) + '</strong><span>' + mine[c].ticks.length + ' of ' + p.d + ' days ticked</span><div class="btn-row"><a class="btn btn-sm" href="#p=' + c + '">Open</a></div></li>';
            }).join('') + '</ul>' : '') +
            '<h2>Start a pact</h2>' +
            '<form>' +
            '<div class="field"><label for="p-name">What are you committing to?</label><input type="text" id="p-name" maxlength="60" required placeholder="e.g. No booze, 6 a.m. swim, a meeting a week"><div class="options inline" data-ideas style="margin-top:6px">' +
            ['30 days no booze', 'Move every day', 'Parkrun every Saturday', 'One meeting a week'].map(function (t) { return '<button type="button" class="option" style="font-size:0.88rem;padding:8px 10px">' + t + '</button>'; }).join('') + '</div></div>' +
            '<div class="field-row">' +
            '<div class="field"><label for="p-days">For how many days?</label><select id="p-days"><option value="7">7 days</option><option value="14">14 days</option><option value="30" selected>30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></div>' +
            '<div class="field"><label for="p-start">Starting</label><input type="date" id="p-start" required value="' + SM.dayKey() + '"></div>' +
            '</div>' +
            '<div class="field"><label for="p-by">Your first name (optional)</label><input type="text" id="p-by" maxlength="30" autocomplete="given-name"><span class="hint">Shown to whoever opens your link. Leave it blank to stay anonymous.</span></div>' +
            '<div class="btn-row"><button class="btn" type="submit">Create pact</button></div>' +
            '</form>';
        root.querySelectorAll('[data-ideas] .option').forEach(function (b) {
            b.addEventListener('click', function () { root.querySelector('#p-name').value = b.textContent; });
        });
        root.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            var p = { n: root.querySelector('#p-name').value.trim(), d: Number(root.querySelector('#p-days').value), s: root.querySelector('#p-start').value, by: root.querySelector('#p-by').value.trim() };
            var code = encode(p);
            if (!decode(code)) { SM.toast('Give it a name and a start date'); return; }
            join(code);
            location.hash = 'p=' + code;
        });
    }

    function join(code) {
        var mine = all();
        if (!mine[code]) { mine[code] = { ticks: [] }; SM.save('pacts', mine); }
    }

    function invite(code, p) {
        root.innerHTML =
            '<p class="kicker">You’ve been invited</p>' +
            '<h2>' + esc(p.n) + '</h2>' +
            '<p>' + (p.by ? '<strong>' + esc(p.by) + '</strong> wants you in. ' : '') + p.d + ' days, starting ' + esc(SM.parseDay(p.s).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })) + '.</p>' +
            '<p>Tick off each day you keep it. Your ticks stay on your phone; share your progress with each other whenever you like.</p>' +
            '<div class="btn-row"><button type="button" class="btn btn-accent" data-in>I’m in</button><a class="btn btn-ghost" href="#">Not this one</a></div>';
        root.querySelector('[data-in]').addEventListener('click', function () { join(code); track(code, p); });
    }

    function track(code, p) {
        var mine = all(), ticks = mine[code].ticks;
        var todayIdx = SM.daysBetween(SM.parseDay(p.s), new Date()); // 0 = first day
        var done = ticks.length;
        var finished = todayIdx >= p.d;

        var grid = '';
        for (var i = 0; i < p.d; i++) {
            grid += '<button type="button" class="day' + (ticks.indexOf(i) >= 0 ? ' done' : '') + (i === todayIdx ? ' today' : '') + '" data-i="' + i + '"' + (i > todayIdx ? ' disabled' : '') + ' aria-pressed="' + (ticks.indexOf(i) >= 0) + '" aria-label="Day ' + (i + 1) + '">' + (i + 1) + '</button>';
        }
        var status = todayIdx < 0 ? 'Starts in ' + (-todayIdx) + (todayIdx === -1 ? ' day' : ' days')
            : finished ? 'Finished' : 'Day ' + (todayIdx + 1) + ' of ' + p.d;

        root.innerHTML =
            '<p class="kicker">' + (p.by ? 'Started by ' + esc(p.by) + ' · ' : '') + esc(status) + '</p>' +
            '<h2>' + esc(p.n) + '</h2>' +
            '<div class="stat-row"><div class="stat"><span class="stat-value">' + done + '</span><span class="stat-label">days kept</span></div><div class="stat"><span class="stat-value">' + p.d + '</span><span class="stat-label">day pact</span></div><div class="stat"><span class="stat-value">' + Math.round((done / p.d) * 100) + '%</span><span class="stat-label">done</span></div></div>' +
            '<p class="hint" style="color:var(--text-muted);font-size:0.92rem">Tap a day to tick it. Missed one? Leave it blank and keep going. A pact with a gap in it still counts.</p>' +
            '<div class="day-grid">' + grid + '</div>' +
            (finished && done ? '<div class="result"><h3>That’s the pact done.</h3><p>' + done + ' of ' + p.d + ' days. Tell your crew, then start the next one.</p></div>' : '') +
            '<div class="btn-row">' +
            '<button type="button" class="btn" data-act="invite">Invite a mate</button>' +
            '<button type="button" class="btn btn-ghost" data-act="progress">Share my progress</button>' +
            '<a class="btn btn-ghost" href="#">All pacts</a>' +
            '<button type="button" class="btn btn-ghost" data-act="leave">Leave</button></div>';

        root.querySelectorAll('.day:not([disabled])').forEach(function (b) {
            b.addEventListener('click', function () {
                var i = Number(b.getAttribute('data-i')), m = all(), t = m[code].ticks, at = t.indexOf(i);
                if (at >= 0) t.splice(at, 1); else t.push(i);
                SM.save('pacts', m);
                track(code, p);
            });
        });
        root.querySelector('[data-act="invite"]').addEventListener('click', function () {
            SM.share('I’m doing “' + p.n + '” for ' + p.d + ' days. Do it with me:', link(code));
        });
        root.querySelector('[data-act="progress"]').addEventListener('click', function () {
            SM.share('“' + p.n + '”: ' + done + ' of ' + p.d + ' days kept' + (finished ? '. Done.' : ', ' + status.toLowerCase() + '.') + ' Your turn:', link(code));
        });
        root.querySelector('[data-act="leave"]').addEventListener('click', function () {
            if (!window.confirm('Remove this pact and your ticks from this device?')) return;
            var m = all(); delete m[code]; SM.save('pacts', m);
            location.hash = '';
        });
    }

    function route() {
        var code = fromHash();
        if (!code) { create(); return; }
        var p = decode(code);
        if (!p) { create(); SM.toast('That pact link doesn’t look right'); return; }
        if (all()[code]) track(code, p); else invite(code, p);
    }
    window.addEventListener('hashchange', route);
    route();
})();
