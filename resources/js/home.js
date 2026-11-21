// Home: show today's reading title and opening line on the "Daily" card.
(function () {
    var key = SM.dayKey().slice(5); // the visitor's local date, MM-DD
    function getJson(name) {
        return fetch('daily/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
            return r.ok ? r.json() : Promise.reject();
        });
    }
    getJson(key.slice(0, 2))
        .then(function (month) { return month && month[key] ? month[key] : getJson('fallback'); })
        .then(function (e) {
            var t = document.getElementById('home-daily-theme');
            var q = document.getElementById('home-daily-quote');
            if (t && e.title) t.textContent = e.title;
            if (q && e.reading && e.reading[0]) q.textContent = e.reading[0].split(/(?<=[.!?])\s/).slice(0, 2).join(' ');
        })
        .catch(function () { /* keep the static text */ });
})();
