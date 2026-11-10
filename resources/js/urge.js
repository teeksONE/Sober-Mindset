// Urge Surf: a timer for riding out a craving, then somewhere to put the energy.
(function () {
    var root = document.getElementById('urge');
    if (!root) return;
    var esc = SM.esc;
    var R = 104, CIRC = 2 * Math.PI * R;
    var tick = null;

    var PROMPTS = [
        ['Name it', 'Say it, out loud if you can: “This is a craving. It will pass.”'],
        ['Find it', 'Where is it in your body? Chest, jaw, hands, stomach?'],
        ['Breathe with the circle', 'In as it grows. Out, slower, as it shrinks.'],
        ['Watch it move', 'Is it stronger or weaker than a minute ago? It never stays the same.'],
        ['Drop your shoulders', 'Unclench your jaw. Open your hands.'],
        ['Zoom out', 'Tomorrow morning, which version of tonight do you want to remember?'],
        ['Stay on the board', 'You are not stopping the wave. You are just not getting off.'],
        ['Check HALT', 'Hungry, angry, lonely or tired? One of them is usually underneath.'],
    ];

    var REDIRECTS = {
        home: ['20 push-ups, then 20 squats. Now.', 'Cold shower. Two full minutes.', 'Plank until you shake, rest, repeat three times.', 'Put on one loud song and shadow-box the whole thing.', 'Cook something that takes both hands and twenty minutes.'],
        outside: ['Run to the end of the street and back, flat out.', 'Walk fast for 15 minutes. No phone in your hand.', 'Find stairs or a hill. Up and down five times.', 'Get in the water: ocean, pool, river, whatever is closest.', 'Ride somewhere you have not been.'],
        out: ['Walk out the door and round the block. You can come back or not.', 'Order a soda and lime and get it in your hand.', 'Text your person: “Having a moment. Talk me down.”', 'Go to the bathroom, cold water on your wrists and face, ten slow breaths.', 'Leave. Nobody will remember that you went home early.'],
    };

    function count() { return SM.load('urges', { n: 0 }); }

    function intro() {
        clearInterval(tick);
        var c = count();
        root.innerHTML =
            '<h2>Got a craving right now?</h2>' +
            '<p>It will build, peak and pass. Most do within 15 to 30 minutes. You only have to stay on the board.</p>' +
            '<div class="field"><span class="label" id="u-int-label">How strong is it?</span>' + scale('before') + '</div>' +
            '<div class="field"><span class="label">How long do you want?</span><div class="options inline" data-mins>' +
            [5, 10, 15, 20].map(function (m) { return '<button type="button" class="option' + (m === 15 ? ' selected' : '') + '" data-m="' + m + '">' + m + ' min</button>'; }).join('') +
            '</div></div>' +
            '<div class="btn-row"><button type="button" class="btn btn-accent" data-start>Start surfing</button></div>' +
            (c.n ? '<p class="tool-foot" style="color:var(--text-muted)">Waves ridden out so far: <strong>' + c.n + '</strong></p>' : '');
        pick(root.querySelector('[data-scale="before"]'));
        pick(root.querySelector('[data-mins]'));
        root.querySelector('[data-start]').addEventListener('click', function () {
            var m = root.querySelector('[data-mins] .selected');
            var b = root.querySelector('[data-scale="before"] .selected');
            run(Number(m.getAttribute('data-m')), b ? Number(b.getAttribute('data-v')) : null);
        });
    }

    function scale(name) {
        var s = '<div class="scale" data-scale="' + name + '" style="grid-template-columns:repeat(10,1fr)">';
        for (var i = 1; i <= 10; i++) s += '<button type="button" class="option" data-v="' + i + '">' + i + '</button>';
        return s + '</div>';
    }
    function pick(group) {
        group.querySelectorAll('.option').forEach(function (b) {
            b.addEventListener('click', function () {
                group.querySelectorAll('.option').forEach(function (x) { x.classList.remove('selected'); x.setAttribute('aria-pressed', 'false'); });
                b.classList.add('selected'); b.setAttribute('aria-pressed', 'true');
            });
        });
    }

    function run(mins, before) {
        var total = mins * 60, end = Date.now() + total * 1000;
        root.innerHTML =
            '<div class="timer"><div class="timer-ring">' +
            '<svg viewBox="0 0 240 240" aria-hidden="true"><circle class="track" cx="120" cy="120" r="' + R + '"/><circle class="bar" cx="120" cy="120" r="' + R + '" stroke-dasharray="' + CIRC + '" stroke-dashoffset="0"/></svg>' +
            '<div class="timer-face"><div class="timer-time" role="timer" aria-live="off"></div><div class="timer-sub">stay on the board</div></div>' +
            '</div></div>' +
            '<div class="breath" aria-hidden="true"></div>' +
            '<div class="prompt-card" aria-live="polite" style="margin-top:18px"></div>' +
            '<div class="btn-row" style="justify-content:center"><button type="button" class="btn" data-passed>It has passed</button><a class="btn btn-ghost" href="crew-card.html">I need a person</a></div>';
        var time = root.querySelector('.timer-time'), bar = root.querySelector('.bar'), card = root.querySelector('.prompt-card');
        var shown = -1;

        function paint() {
            var left = Math.max(0, Math.round((end - Date.now()) / 1000));
            time.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
            bar.setAttribute('stroke-dashoffset', String(CIRC * (1 - left / total)));
            var idx = Math.floor((total - left) / 45) % PROMPTS.length;
            if (idx !== shown) {
                shown = idx;
                card.innerHTML = '<strong>' + esc(PROMPTS[idx][0]) + '</strong><span>' + esc(PROMPTS[idx][1]) + '</span>';
            }
            if (left <= 0) finish(before);
        }
        paint();
        tick = setInterval(paint, 1000);
        root.querySelector('[data-passed]').addEventListener('click', function () { finish(before); });
    }

    function finish(before) {
        clearInterval(tick);
        var c = count(); c.n = (c.n || 0) + 1; SM.save('urges', c);
        root.innerHTML =
            '<h2>You rode it out.</h2>' +
            '<p>That is wave number <strong>' + c.n + '</strong>. Each one you ride teaches your brain that the craving is not an order, and the next one arrives a little weaker.</p>' +
            '<div class="field"><span class="label">How strong is it now?</span>' + scale('after') + '<span class="hint" data-delta></span></div>' +
            '<h3>Now point the energy somewhere</h3>' +
            '<div class="options inline" data-where><button type="button" class="option" data-w="home">I’m at home</button><button type="button" class="option" data-w="outside">I can get outside</button><button type="button" class="option" data-w="out">I’m out with people</button></div>' +
            '<div class="prompt-card" data-redirect style="margin-top:12px" aria-live="polite"><span>Pick where you are.</span></div>' +
            '<div class="btn-row"><button type="button" class="btn btn-ghost" data-again>Another wave</button><a class="btn btn-ghost" href="check-in.html">Do a check-in</a></div>';
        var after = root.querySelector('[data-scale="after"]');
        pick(after);
        after.querySelectorAll('.option').forEach(function (b) {
            b.addEventListener('click', function () {
                var v = Number(b.getAttribute('data-v')), d = root.querySelector('[data-delta]');
                if (before == null) { d.textContent = ''; return; }
                d.textContent = v < before ? 'Down from ' + before + ' to ' + v + ', and you did not drink. That is the whole lesson.'
                    : v === before ? 'Still at ' + v + '. Some waves are long. Go again, or call someone.'
                    : 'Up from ' + before + '. That happens. Go again, or ring one of your people now.';
            });
        });
        var where = root.querySelector('[data-where]'), out = root.querySelector('[data-redirect]'), last = '';
        pick(where);
        where.querySelectorAll('.option').forEach(function (b) {
            b.addEventListener('click', function () {
                var list = REDIRECTS[b.getAttribute('data-w')], choice;
                do { choice = list[Math.floor(Math.random() * list.length)]; } while (choice === last && list.length > 1);
                last = choice;
                out.innerHTML = '<strong>' + esc(choice) + '</strong><span>Tap again for a different one.</span>';
            });
        });
        root.querySelector('[data-again]').addEventListener('click', intro);
    }

    intro();
})();
