// Home: pull today's reflection theme into the "Daily" card.
(function () {
    fetch('daily/today.json', { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) {
            var t = document.getElementById('home-daily-theme');
            var q = document.getElementById('home-daily-quote');
            if (t && d.reflection && d.reflection.theme) t.textContent = d.reflection.theme;
            if (q && d.reflection && d.reflection.quote) {
                q.textContent = '“' + d.reflection.quote + '” — ' + d.reflection.quoteAuthor;
            }
        })
        .catch(function () { /* keep the static text */ });
})();
