// AUDIT-C: the three consumption questions from the WHO AUDIT.
// Scored 0–12. Bands follow the widely used UK banding; many clinics also
// flag 3+ (women) or 4+ (men) as worth a conversation.
(function () {
    var el = document.getElementById('audit-quiz');
    if (!el) return;

    function opts(labels) { return labels.map(function (l, i) { return { label: l, value: i }; }); }

    var questions = [
        { q: 'How often do you have a drink containing alcohol?',
          options: opts(['Never', 'Monthly or less', '2 to 4 times a month', '2 to 3 times a week', '4 or more times a week']) },
        { q: 'How many standard drinks do you have on a typical day when you are drinking?',
          hint: 'A pint of full-strength beer is about 2. A pub glass of wine is about 1.5.',
          options: opts(['1 or 2', '3 or 4', '5 or 6', '7 to 9', '10 or more']) },
        { q: 'How often do you have six or more standard drinks on one occasion?',
          options: opts(['Never', 'Less than monthly', 'Monthly', 'Weekly', 'Daily or almost daily']) },
    ];

    var bands = [
        { max: 2, title: 'Lower risk',
          text: 'On these three questions your drinking sits in the lower-risk range. If something still made you take this, trust that. The signs further down this page matter more than a score.' },
        { max: 4, title: 'Lower risk, worth watching',
          text: 'You are in the lower-risk band overall, but many clinics treat a score of 3 or 4 as a prompt for a closer look, especially if most of your points came from the last question. Read the signs below.' },
        { max: 7, title: 'Increasing risk',
          text: 'Drinking at this level raises the odds of harm to your health, sleep, mood and decisions. This is the range where cutting back or stopping pays off fastest, and where it is easiest to do.' },
        { max: 10, title: 'Higher risk',
          text: 'This is a level that is likely to be doing damage already, whether or not it feels like it. A straight conversation with a GP is worth having soon.' },
        { max: 12, title: 'Possible dependence',
          text: 'A score this high suggests your body may have come to rely on alcohol. Please do not stop suddenly on your own. Read the page on stopping safely first, and talk to a doctor.' },
    ];

    function done(answers, restart) {
        var score = answers.reduce(function (n, a) { return n + a.value; }, 0);
        var band = bands.filter(function (b) { return score <= b.max; })[0];
        var daily = answers[0].value === 4 && answers[1].value >= 2;
        var html =
            '<div class="stat-row"><div class="stat big"><span class="stat-value">' + score + '</span><span class="stat-label">out of 12</span></div></div>' +
            '<div class="result"><p class="match">Your result</p><h3>' + band.title + '</h3><p>' + band.text + '</p></div>';
        if (score >= 8 || daily) {
            html += '<div class="callout warn"><p class="callout-label">Before you change anything</p><p>If you drink heavily most days, stopping suddenly can be dangerous. <a href="stopping-safely.html">Read how to stop safely</a>.</p></div>';
        }
        html += '<div class="btn-row">' +
            (score >= 5 ? '<a class="btn" href="first-days.html">What stopping looks like</a>' : '<a class="btn" href="crossroads.html">Keep reading</a>') +
            '<button type="button" class="btn btn-ghost" data-again>Start again</button></div>' +
            '<p class="hint" style="margin-top:14px;font-size:0.88rem;color:var(--text-muted)">This is a screening tool, not a diagnosis. Only a health professional who knows your situation can give you one.</p>';
        el.innerHTML = html;
        el.querySelector('[data-again]').addEventListener('click', restart);
    }

    SM.quiz({ el: el, questions: questions, done: done });
})();
