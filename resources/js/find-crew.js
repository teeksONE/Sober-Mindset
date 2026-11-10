// Find Your Crew: filter the directory cards by tag.
(function () {
    var bar = document.getElementById('crew-filter');
    var cards = document.querySelectorAll('#crew-list [data-tags]');
    var empty = document.getElementById('crew-empty');
    if (!bar || !cards.length) return;

    function apply(tag) {
        var shown = 0;
        cards.forEach(function (c) {
            var on = tag === 'all' || c.getAttribute('data-tags').split(' ').indexOf(tag) >= 0;
            c.hidden = !on;
            if (on) shown++;
        });
        if (empty) empty.hidden = shown > 0;
        bar.querySelectorAll('.option').forEach(function (b) {
            var sel = b.getAttribute('data-tag') === tag;
            b.classList.toggle('selected', sel);
            b.setAttribute('aria-pressed', String(sel));
        });
    }
    bar.querySelectorAll('.option').forEach(function (b) {
        b.addEventListener('click', function () { apply(b.getAttribute('data-tag')); });
    });
    apply('all');
})();
