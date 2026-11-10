// Sober Counter: days, money saved, milestones. Stored on this device only.
(function () {
    var root = document.getElementById('counter');
    if (!root) return;
    var esc = SM.esc;

    var MILESTONES = [
        { d: 1, name: 'Day one', what: 'The decision. The hardest day there is.' },
        { d: 3, name: '3 days', what: 'Past the peak of withdrawal for most people.' },
        { d: 7, name: '1 week', what: 'Sleep starts to deepen. Appetite and hydration are coming back.' },
        { d: 14, name: '2 weeks', what: 'Thinking is noticeably clearer. Brain tissue is already recovering.' },
        { d: 30, name: '1 month', what: 'In studies of a month off alcohol, blood pressure, insulin resistance and liver markers all improve.' },
        { d: 60, name: '2 months', what: 'Mood is steadier. Cravings come less often and pass faster.' },
        { d: 90, name: '90 days', what: 'Attention and memory are measurably better. The highest-risk stretch is behind you.' },
        { d: 180, name: '6 months', what: 'The reward system is regaining sensitivity. Ordinary things feel good more often.' },
        { d: 365, name: '1 year', what: 'A full lap: every season, birthday and holiday done sober once.' },
        { d: 730, name: '2 years', what: 'Sober is no longer something you do. It is how you live.' },
        { d: 1825, name: '5 years', what: 'Long-term studies find sobriety is very stable from here.' },
    ];

    function fmtMoney(n) {
        return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    function span(days) {
        if (days < 14) return days + (days === 1 ? ' day' : ' days');
        if (days < 60) return Math.floor(days / 7) + ' weeks';
        if (days < 730) return Math.floor(days / 30.44) + ' months';
        return (days / 365.25).toFixed(1) + ' years';
    }

    function setup(state) {
        root.innerHTML =
            '<h2>' + (state ? 'Change your details' : 'Start your counter') + '</h2>' +
            '<form>' +
            '<div class="field"><label for="c-date">Your sober date</label><input type="date" id="c-date" required max="' + SM.dayKey() + '" value="' + esc(state ? state.date : SM.dayKey()) + '"><span class="hint">The first full day without it. Today counts.</span></div>' +
            '<div class="field"><label for="c-spend">What you used to spend each week (optional)</label><input type="number" id="c-spend" min="0" step="1" inputmode="numeric" placeholder="e.g. 150" value="' + (state && state.spend ? esc(state.spend) : '') + '"><span class="hint">Drinks, rounds, late-night food, rides home. Be honest; nobody else sees it.</span></div>' +
            '<div class="btn-row"><button class="btn" type="submit">' + (state ? 'Save' : 'Start counting') + '</button>' +
            (state ? '<button class="btn btn-ghost" type="button" data-cancel>Cancel</button>' : '') + '</div>' +
            '</form>';
        root.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
            var date = root.querySelector('#c-date').value;
            if (!date || SM.daysBetween(SM.parseDay(date), new Date()) < 0) { SM.toast('Pick today or an earlier date'); return; }
            var next = { date: date, spend: Math.max(0, Number(root.querySelector('#c-spend').value) || 0) };
            if (!SM.save('counter', next)) SM.toast('Could not save on this device, so it will reset when you leave');
            view(next);
        });
        var cancel = root.querySelector('[data-cancel]');
        if (cancel) cancel.addEventListener('click', function () { view(state); });
    }

    function view(state) {
        var start = SM.parseDay(state.date);
        var days = SM.daysBetween(start, new Date()) + 1; // day one is day 1
        var saved = state.spend ? Math.round((state.spend / 7) * days) : 0;
        var nextM = MILESTONES.filter(function (m) { return m.d > days; })[0];

        var html =
            '<div class="stat-row">' +
            '<div class="stat big"><span class="stat-value">' + days.toLocaleString() + '</span><span class="stat-label">' + (days === 1 ? 'day' : 'days') + ' sober</span></div>' +
            '</div><div class="stat-row">' +
            '<div class="stat"><span class="stat-value">' + esc(span(days)) + '</span><span class="stat-label">and counting</span></div>' +
            (saved ? '<div class="stat"><span class="stat-value">$' + fmtMoney(saved) + '</span><span class="stat-label">not spent</span></div>' : '') +
            (nextM ? '<div class="stat"><span class="stat-value">' + (nextM.d - days) + '</span><span class="stat-label">days to ' + esc(nextM.name) + '</span></div>' : '') +
            '</div>' +
            '<p style="text-align:center;color:var(--text-muted)">Since ' + esc(start.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })) + '</p>' +
            '<div class="btn-row" style="justify-content:center">' +
            '<button class="btn" type="button" data-act="share">Share my count</button>' +
            '<button class="btn btn-ghost" type="button" data-act="edit">Change details</button>' +
            '<button class="btn btn-ghost" type="button" data-act="reset">Reset</button></div>' +
            '<h3>Milestones</h3><ul class="milestones">' +
            MILESTONES.map(function (m) {
                var done = days >= m.d;
                var when = new Date(start); when.setDate(when.getDate() + m.d - 1);
                return '<li class="' + (done ? 'done' : nextM && m.d === nextM.d ? 'next' : '') + '">' +
                    '<span class="tick" aria-hidden="true">✓</span>' +
                    '<span><strong>' + esc(m.name) + '</strong><span class="m-what">' + esc(m.what) + '</span></span>' +
                    '<span class="m-when">' + (done ? 'Done' : esc(when.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }))) + '</span></li>';
            }).join('') + '</ul>';
        root.innerHTML = html;

        root.querySelector('[data-act="share"]').addEventListener('click', function () {
            SM.share(days.toLocaleString() + (days === 1 ? ' day' : ' days') + ' sober today.' + (saved ? ' $' + fmtMoney(saved) + ' not spent.' : '') + ' One day at a time.', location.href.split('#')[0]);
        });
        root.querySelector('[data-act="edit"]').addEventListener('click', function () { setup(state); });
        root.querySelector('[data-act="reset"]').addEventListener('click', function () {
            if (window.confirm('Clear your sober date from this device?')) { SM.remove('counter'); setup(null); }
        });
    }

    var state = SM.load('counter', null);
    if (state && state.date) view(state); else setup(null);
})();
