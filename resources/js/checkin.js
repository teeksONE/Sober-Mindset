// Daily check-in: HALT + mood + craving. Stored on this device only.
(function () {
    var root = document.getElementById('checkin');
    if (!root) return;
    var esc = SM.esc;
    var HALT = [
        ['hungry', 'Hungry', 'Eat something with protein in it before you do anything else. Hunger and craving feel almost identical.', 'nutrition.html', 'Food in recovery'],
        ['angry', 'Angry', 'Move first, think second. Walk hard for ten minutes, then write down what it is really about.', 'meditation.html', 'Working with anger'],
        ['lonely', 'Lonely', 'Message one person right now. “Thinking of you, how’s your week?” counts. Or drop into an online meeting.', 'find-your-crew.html', 'Find your crew'],
        ['tired', 'Tired', 'Everything is harder on no sleep. Make tonight an early one and make no big decisions today.', 'sleep.html', 'Fixing sleep'],
    ];
    var MOOD = ['Rough', 'Low', 'OK', 'Good', 'Great'];
    var CRAVE = ['None', 'Faint', 'There', 'Strong', 'Loud'];

    function all() { return SM.load('checkins', {}); }

    function streak(log) {
        var n = 0, d = new Date();
        if (!log[SM.dayKey(d)]) d.setDate(d.getDate() - 1);
        while (log[SM.dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
        return n;
    }

    function history(log) {
        var s = '<div class="day-grid" style="grid-template-columns:repeat(14,1fr)" aria-label="Last 14 days">';
        for (var i = 13; i >= 0; i--) {
            var d = new Date(); d.setDate(d.getDate() - i);
            var e = log[SM.dayKey(d)];
            s += '<span class="day' + (e ? ' done' : '') + (i === 0 ? ' today' : '') + '" style="cursor:default" title="' + esc(d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })) + (e ? ': ' + MOOD[e.mood - 1] : ': no check-in') + '">' + d.getDate() + '</span>';
        }
        return s + '</div>';
    }

    function form() {
        var log = all(), today = log[SM.dayKey()] || { halt: [], mood: 0, crave: 0, note: '' };
        root.innerHTML =
            '<h2>How are you, actually?</h2>' +
            '<div class="field"><span class="label">Right now I am…</span><span class="hint">Tap any that apply.</span><div class="options inline" data-halt>' +
            HALT.map(function (h) { return '<button type="button" class="option' + (today.halt.indexOf(h[0]) >= 0 ? ' selected' : '') + '" aria-pressed="' + (today.halt.indexOf(h[0]) >= 0) + '" data-k="' + h[0] + '">' + h[1] + '</button>'; }).join('') +
            '</div></div>' +
            '<div class="field"><span class="label">Mood</span>' + scale('mood', MOOD, today.mood) + '</div>' +
            '<div class="field"><span class="label">Cravings today</span>' + scale('crave', CRAVE, today.crave) + '</div>' +
            '<div class="field"><label for="ci-note">One thing I’m grateful for (optional)</label><input type="text" id="ci-note" maxlength="200" value="' + esc(today.note || '') + '"></div>' +
            '<div class="btn-row"><button type="button" class="btn" data-save>Save today’s check-in</button></div>' +
            '<div class="tool-foot"><p><strong>' + streak(log) + '</strong> day streak</p>' + history(log) + '</div>';

        root.querySelectorAll('[data-halt] .option').forEach(function (b) {
            b.addEventListener('click', function () {
                var on = b.classList.toggle('selected'); b.setAttribute('aria-pressed', String(on));
            });
        });
        root.querySelectorAll('.scale').forEach(function (g) {
            g.querySelectorAll('.option').forEach(function (b) {
                b.addEventListener('click', function () {
                    g.querySelectorAll('.option').forEach(function (x) { x.classList.remove('selected'); x.setAttribute('aria-pressed', 'false'); });
                    b.classList.add('selected'); b.setAttribute('aria-pressed', 'true');
                });
            });
        });
        root.querySelector('[data-save]').addEventListener('click', function () {
            var mood = root.querySelector('[data-scale="mood"] .selected');
            if (!mood) { SM.toast('Pick a mood first'); return; }
            var crave = root.querySelector('[data-scale="crave"] .selected');
            var entry = {
                halt: Array.prototype.map.call(root.querySelectorAll('[data-halt] .selected'), function (b) { return b.getAttribute('data-k'); }),
                mood: Number(mood.getAttribute('data-v')),
                crave: crave ? Number(crave.getAttribute('data-v')) : 1,
                note: root.querySelector('#ci-note').value.trim().slice(0, 200),
            };
            var log = all(); log[SM.dayKey()] = entry;
            // keep roughly a year
            var keys = Object.keys(log).sort(); while (keys.length > 370) delete log[keys.shift()];
            if (!SM.save('checkins', log)) SM.toast('Could not save on this device');
            result(entry, log);
        });
    }

    function scale(name, labels, current) {
        return '<div class="scale" data-scale="' + name + '">' + labels.map(function (l, i) {
            return '<button type="button" class="option' + (current === i + 1 ? ' selected' : '') + '" aria-pressed="' + (current === i + 1) + '" data-v="' + (i + 1) + '">' + l + '</button>';
        }).join('') + '</div>';
    }

    function result(e, log) {
        var html = '<h2>Checked in.</h2><p><strong>' + streak(log) + '</strong> day streak.</p>' + history(log);
        if (e.mood === 1 && e.crave >= 4) {
            html += '<div class="callout warn"><p class="callout-label">That is a hard combination</p><p>Rough mood and loud cravings together is the moment to reach for a person, not to tough it out. <a href="crew-card.html">Open your Crew Card</a> or go to <a href="help.html">Help now</a>.</p></div>';
        }
        if (e.crave >= 4) html += '<div class="result"><p class="match">Cravings are loud</p><p>Ride this one out with the timer. It will pass.</p><a class="btn btn-sm" href="urge-surf.html">Open Urge Surf</a></div>';
        HALT.forEach(function (h) {
            if (e.halt.indexOf(h[0]) >= 0) html += '<div class="result"><p class="match">' + h[1] + '</p><p>' + h[2] + '</p><a href="' + h[3] + '">' + h[4] + '</a></div>';
        });
        if (!e.halt.length && e.crave < 4) html += '<div class="result"><p>Nothing flashing red. Days like this are what the hard ones were for.</p></div>';
        html += '<div class="btn-row"><button type="button" class="btn btn-ghost" data-edit>Change today’s answers</button></div>';
        root.innerHTML = html;
        root.querySelector('[data-edit]').addEventListener('click', form);
    }

    form();
})();
