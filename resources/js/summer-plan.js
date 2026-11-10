// First Summer: 12-week tracker. Stored on this device only.
(function () {
    var root = document.getElementById('summer-plan');
    if (!root) return;
    var esc = SM.esc;

    var NAMES = { surf: 'Surfing', lifesaving: 'Surf lifesaving', dive: 'Freediving', climb: 'Climbing', mtb: 'Mountain biking', skate: 'Skateboarding', combat: 'Combat sports', trail: 'Trail running', sky: 'Skydiving', snow: 'Snow' };
    var picks = (SM.load('summer-picks', []) || []).filter(function (k) { return NAMES[k]; });

    function taste(i) {
        return picks[i] ? 'Taster: ' + NAMES[picks[i]] : 'Taster ' + (i + 1);
    }

    var WEEKS = [
        ['Sample', taste(0), 'Book a coached intro session and go. Borrow or hire the gear. Write down one thing that surprised you.'],
        ['Sample', taste(1), 'Something from a different family to last week. If week one was water, make this one mountain, mat or wheels.'],
        ['Sample', taste(2), 'Take a mate this time. Notice the people as much as the sport. Could you see yourself with them?'],
        ['Sample', taste(3), 'Last taster. Tonight, rank the four. The winner is the one you were still thinking about two days later.'],
        ['Commit', 'Pick one and join', 'Sign up properly: the club, the gym, the lesson block. Tell them you are new and want to get good.'],
        ['Commit', 'Twice a week, minimum', 'Same sessions each week so the same faces see you. Learn three people’s names.'],
        ['Commit', 'Get the first ticket', 'Whatever the entry-level marker is in your sport, start working toward it: a belay check, a stripe, a Bronze, a clean drop-in.'],
        ['Commit', 'Set the goal', 'Choose your week-twelve Send with your coach or crew. Something with a date on it that scares you slightly.'],
        ['Send', 'Train for it', 'Build the week around the goal. Sleep and food start to matter here. You will notice what a big night costs you.'],
        ['Send', 'Bring someone in', 'Take a mate who has not tried it to a beginner session. Teaching the basics shows you how far you have come.'],
        ['Send', 'Dress rehearsal', 'A practice run of the Send at about 80 percent. Fix what goes wrong.'],
        ['Send', 'The Send', 'Do the thing. Then sit down with your crew and decide what next season looks like.'],
    ];

    function render() {
        var state = SM.load('summer-plan', { done: [], start: '' });
        var done = state.done || [];

        root.innerHTML =
            '<div class="stat-row"><div class="stat"><span class="stat-value">' + done.length + '</span><span class="stat-label">of 12 weeks done</span></div>' +
            '<div class="stat"><span class="stat-value">' + (done.length >= 12 ? 'Sent' : done.length >= 8 ? 'Send' : done.length >= 4 ? 'Commit' : 'Sample') + '</span><span class="stat-label">phase</span></div></div>' +
            (picks.length ? '' : '<p class="hint" style="color:var(--text-muted)">Do the <a href="find-your-thing.html">Find Your Thing</a> quiz first and your four tasters will be filled in here.</p>') +
            '<ul class="week-plan">' +
            WEEKS.map(function (w, i) {
                return '<li><label><input type="checkbox" data-i="' + i + '"' + (done.indexOf(i) >= 0 ? ' checked' : '') + '><span><span class="wk">Week ' + (i + 1) + ' · ' + w[0] + '</span><span class="wk-title">' + esc(w[1]) + '</span><span class="wk-text">' + esc(w[2]) + '</span></span></label></li>';
            }).join('') +
            '</ul>' +
            '<div class="btn-row"><button type="button" class="btn" data-share>Share my progress</button><button type="button" class="btn btn-ghost" data-print>Print the plan</button><button type="button" class="btn btn-ghost" data-reset>Reset</button></div>';

        root.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var s = SM.load('summer-plan', { done: [] }), i = Number(cb.getAttribute('data-i')), at = s.done.indexOf(i);
                if (cb.checked && at < 0) s.done.push(i);
                if (!cb.checked && at >= 0) s.done.splice(at, 1);
                SM.save('summer-plan', s);
                render();
            });
        });
        root.querySelector('[data-share]').addEventListener('click', function () {
            SM.share('First Summer: ' + done.length + ' of 12 weeks done.' + (picks[0] ? ' Top pick: ' + NAMES[picks[0]] + '.' : '') + ' Do it with me:', location.href.split('#')[0].replace('first-summer-plan', 'first-summer'));
        });
        root.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
        root.querySelector('[data-reset]').addEventListener('click', function () {
            if (window.confirm('Clear your plan from this device?')) { SM.remove('summer-plan'); render(); }
        });
    }
    render();
})();
