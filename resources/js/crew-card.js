// Crew Card: who I call and what I do when it gets hard. Stored on this device only.
(function () {
    var form = document.getElementById('crew-form');
    var card = document.getElementById('crew-card-view');
    if (!form || !card) return;
    var esc = SM.esc;
    var FIELDS = ['n1', 'p1', 'n2', 'p2', 'n3', 'p3', 'signs', 'helps', 'place', 'why'];

    function read() {
        var d = {};
        FIELDS.forEach(function (f) { d[f] = (form.elements[f].value || '').trim().slice(0, 400); });
        return d;
    }
    function fill(d) { FIELDS.forEach(function (f) { if (d[f]) form.elements[f].value = d[f]; }); }

    function tel(p) { return p.replace(/[^\d+]/g, ''); }
    function lines(t) { return esc(t).replace(/\n/g, '<br>'); }

    function render(d) {
        var people = [1, 2, 3].filter(function (i) { return d['n' + i]; });
        if (!people.length && !d.signs && !d.helps && !d.place && !d.why) { card.hidden = true; return; }
        card.hidden = false;
        card.innerHTML =
            '<h2>My Crew Card</h2>' +
            (d.why ? '<p style="font-family:var(--display);font-style:italic;font-size:1.35rem;color:var(--text)">“' + esc(d.why) + '”</p>' : '') +
            (people.length ? '<h3>I call</h3><ul class="help-list">' + people.map(function (i) {
                var p = d['p' + i];
                return '<li class="help-line"><strong>' + esc(d['n' + i]) + '</strong><span>' + esc(p || 'No number saved') + '</span>' +
                    (p ? '<div class="btn-row no-print"><a class="btn btn-sm" href="tel:' + esc(tel(p)) + '">Call</a><a class="btn btn-sm btn-ghost" href="sms:' + esc(tel(p)) + '">Text</a></div>' : '') + '</li>';
            }).join('') + '</ul>' : '') +
            (d.signs ? '<h3>My warning signs</h3><p>' + lines(d.signs) + '</p>' : '') +
            (d.helps ? '<h3>What works for me</h3><p>' + lines(d.helps) + '</p>' : '') +
            (d.place ? '<h3>Where I go</h3><p>' + lines(d.place) + '</p>' : '') +
            '<div class="btn-row no-print"><button type="button" class="btn" data-print>Print or save as PDF</button></div>';
        card.querySelector('[data-print]').addEventListener('click', function () { window.print(); });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = read();
        if (!SM.save('crew-card', d)) SM.toast('Could not save on this device'); else SM.toast('Saved on this device');
        render(d);
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // Print straight from the form: saves what is typed, then prints the card.
    document.getElementById('crew-print').addEventListener('click', function () {
        var d = read();
        render(d);
        if (card.hidden) { SM.toast('Fill in at least one thing first'); return; }
        SM.save('crew-card', d);
        window.print();
    });
    document.getElementById('crew-clear').addEventListener('click', function () {
        if (!window.confirm('Clear your Crew Card from this device?')) return;
        SM.remove('crew-card'); form.reset(); render({});
    });

    var saved = SM.load('crew-card', null);
    if (saved) { fill(saved); render(saved); }
})();
