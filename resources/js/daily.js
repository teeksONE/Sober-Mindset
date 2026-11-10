// Daily page: reflection (with archive navigation), affirmations, gratitude.
// Content is generated once a day into daily/today.json and daily/YYYY-MM-DD.json.
(function () {
    var esc = SM.esc;
    var el = {
        label: document.getElementById('reflection-date-display'),
        body: document.getElementById('reflection-body'),
        prev: document.getElementById('prev-date'),
        next: document.getElementById('next-date'),
        aff: document.getElementById('affirmations-body'),
        grat: document.getElementById('gratitude-body'),
    };
    var latest = null; // Date of the newest content available
    var current = null;

    function fmt(d) {
        return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    function loading(msg) {
        el.body.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p>' + esc(msg) + '</p></div>';
    }
    function getJson(url) {
        return fetch(url, { cache: 'no-cache' }).then(function (r) {
            if (!r.ok) throw new Error('not available');
            return r.json();
        });
    }

    function renderReflection(r) {
        el.body.innerHTML =
            '<h2 class="reflection-theme">' + esc(r.theme) + '</h2>' +
            '<blockquote class="reflection-quote"><p>“' + esc(r.quote) + '”</p><cite>' + esc(r.quoteAuthor) + '</cite></blockquote>' +
            '<div class="reflection-reading">' +
            String(r.reading).split('\n').filter(function (p) { return p.trim(); }).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
            '</div>' +
            '<div class="reflection-meditation"><strong>Try this:</strong> ' + esc(r.meditation) + '</div>';
    }
    function renderExtras(d) {
        el.aff.innerHTML = (d.affirmations || []).map(function (a, i) {
            return '<div class="affirmation-card"><span class="affirmation-number">' + (i + 1) + '</span><p>' + esc(a) + '</p></div>';
        }).join('');
        el.grat.innerHTML = d.gratitude
            ? '<div class="gratitude-card"><p class="prayer-text">' + esc(d.gratitude.prayer) + '</p><p class="prayer-closing">' + esc(d.gratitude.closing) + '</p></div>'
            : '';
    }

    function show(date, data) {
        current = date;
        el.label.textContent = fmt(date);
        el.next.disabled = SM.daysBetween(date, latest) <= 0;
        if (data) { renderReflection(data.reflection); renderExtras(data); return; }
        loading('Loading ' + fmt(date) + '…');
        getJson('daily/' + SM.dayKey(date) + '.json').then(
            function (d) { if (current === date) { renderReflection(d.reflection); renderExtras(d); } },
            function () {
                if (current !== date) return;
                el.body.innerHTML = '<p class="ai-error">Nothing saved for this date. The archive builds up one day at a time.</p>';
            }
        );
    }

    function step(delta) {
        var d = new Date(current);
        d.setDate(d.getDate() + delta);
        if (SM.daysBetween(d, latest) < 0) return;
        show(d);
    }
    el.prev.addEventListener('click', function () { step(-1); });
    el.next.addEventListener('click', function () { step(1); });

    loading('Loading today’s reflection…');
    getJson('daily/today.json').then(
        function (d) {
            latest = d.date ? SM.parseDay(d.date) : new Date();
            show(latest, d);
        },
        function () {
            el.label.textContent = fmt(new Date());
            el.body.innerHTML = '<p class="ai-error">Today’s reflection isn’t available right now. Try again a little later.</p>';
            el.aff.innerHTML = el.grat.innerHTML = '';
            el.prev.disabled = el.next.disabled = true;
        }
    );
})();
