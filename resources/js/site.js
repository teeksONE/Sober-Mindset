// Shared behaviour for every page: menu, small helpers, forms.
(function () {
    'use strict';

    var cfg = window.SM_CONFIG || { forms: {} };

    // ─── Helpers used by the tool pages ──────────────
    var SM = (window.SM = {
        // localStorage that never throws (private mode, blocked storage…)
        load: function (key, fallback) {
            try {
                var v = localStorage.getItem('sm:' + key);
                return v === null ? fallback : JSON.parse(v);
            } catch (e) {
                return fallback;
            }
        },
        save: function (key, value) {
            try {
                localStorage.setItem('sm:' + key, JSON.stringify(value));
                return true;
            } catch (e) {
                return false;
            }
        },
        remove: function (key) {
            try { localStorage.removeItem('sm:' + key); } catch (e) { /* nothing to remove */ }
        },
        // Local calendar date as YYYY-MM-DD (not UTC — a day is the user's day)
        dayKey: function (d) {
            d = d || new Date();
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        },
        parseDay: function (s) {
            var p = String(s).split('-').map(Number);
            return new Date(p[0], p[1] - 1, p[2]);
        },
        daysBetween: function (a, b) {
            var x = new Date(a.getFullYear(), a.getMonth(), a.getDate());
            var y = new Date(b.getFullYear(), b.getMonth(), b.getDate());
            return Math.round((y - x) / 86400000);
        },
        esc: function (s) {
            return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        },
        toast: function (msg) {
            var t = document.querySelector('.toast');
            if (!t) {
                t = document.createElement('div');
                t.className = 'toast';
                t.setAttribute('role', 'status');
                document.body.appendChild(t);
            }
            t.textContent = msg;
            t.classList.add('show');
            clearTimeout(SM._toastTimer);
            SM._toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
        },
        // Share via the device share sheet, falling back to the clipboard.
        share: function (text, url) {
            var full = url ? text + ' ' + url : text;
            if (navigator.share) {
                navigator.share(url ? { text: text, url: url } : { text: text }).catch(function () {});
                return;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(full).then(
                    function () { SM.toast('Copied — paste it wherever you like'); },
                    function () { window.prompt('Copy this:', full); }
                );
            } else {
                window.prompt('Copy this:', full);
            }
        },
        config: cfg,

        // A one-question-at-a-time quiz.
        // opts: { el, questions:[{q, options:[{label, value}]}], done(answers, restart) }
        quiz: function (opts) {
            var el = opts.el, qs = opts.questions, answers = [], i = 0;
            function restart() { answers = []; i = 0; show(); }
            function show() {
                if (i >= qs.length) { el.innerHTML = ''; opts.done(answers, restart); return; }
                var q = qs[i];
                el.innerHTML =
                    '<div class="quiz-progress"><span style="width:' + Math.round((i / qs.length) * 100) + '%"></span></div>' +
                    '<p class="quiz-count">Question ' + (i + 1) + ' of ' + qs.length + '</p>' +
                    '<p class="quiz-q" tabindex="-1">' + SM.esc(q.q) + '</p>' +
                    (q.hint ? '<p class="hint" style="margin:-8px 0 14px;color:var(--text-muted);font-size:0.92rem">' + SM.esc(q.hint) + '</p>' : '') +
                    '<div class="options">' +
                    q.options.map(function (o, n) {
                        return '<button type="button" class="option" data-n="' + n + '">' + SM.esc(o.label) + '</button>';
                    }).join('') +
                    '</div>' +
                    (i > 0 ? '<div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" data-back>Back</button></div>' : '');
                el.querySelectorAll('.option').forEach(function (b) {
                    b.addEventListener('click', function () {
                        answers[i] = q.options[Number(b.getAttribute('data-n'))];
                        i++;
                        show();
                    });
                });
                var back = el.querySelector('[data-back]');
                if (back) back.addEventListener('click', function () { i--; show(); });
                if (i > 0) { var h = el.querySelector('.quiz-q'); if (h) h.focus({ preventScroll: true }); }
            }
            show();
        },
    });

    // ─── Mobile menu ─────────────────────────────────
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(open));
        });
    }

    // ─── Small dynamic bits ──────────────────────────
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });

    document.querySelectorAll('[data-years-since]').forEach(function (el) {
        var d = SM.parseDay(el.getAttribute('data-years-since'));
        var now = new Date();
        var y = now.getFullYear() - d.getFullYear();
        if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) y--;
        el.textContent = y;
    });

    document.querySelectorAll('[data-share]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            SM.share(btn.getAttribute('data-share'), btn.getAttribute('data-share-url') || location.href.split('#')[0]);
        });
    });

    // Keep the current stage chip in view on small screens.
    var cur = document.querySelector('.stage-rail a[aria-current]');
    if (cur && cur.scrollIntoView) {
        try { cur.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { /* older browsers */ }
    }

    // ─── Config-gated features ───────────────────────
    // data-needs="forms.email"  → shown only when that setting has a value
    // data-unless="forms.email" → shown only when it does not
    function lookup(path) {
        return path.split('.').reduce(function (o, k) { return o && o[k]; }, cfg);
    }
    document.querySelectorAll('[data-needs]').forEach(function (el) {
        el.hidden = !lookup(el.getAttribute('data-needs'));
    });
    document.querySelectorAll('[data-unless]').forEach(function (el) {
        el.hidden = !!lookup(el.getAttribute('data-unless'));
    });
    document.querySelectorAll('[data-config-href]').forEach(function (el) {
        var v = lookup(el.getAttribute('data-config-href'));
        if (v) el.setAttribute('href', v);
    });
    document.querySelectorAll('[data-config-text]').forEach(function (el) {
        var v = lookup(el.getAttribute('data-config-text'));
        if (v) el.textContent = v;
    });

    // Forms: <form data-form="story"> posts to SM_CONFIG.forms.story
    document.querySelectorAll('form[data-form]').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var endpoint = cfg.forms && cfg.forms[form.getAttribute('data-form')];
            var status = form.querySelector('[data-form-status]');
            var say = function (msg) { if (status) status.textContent = msg; else SM.toast(msg); };
            if (!endpoint) { say('This form is not open yet.'); return; }
            var btn = form.querySelector('[type="submit"]');
            if (btn) btn.disabled = true;
            say('Sending…');
            fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
                .then(function (r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    form.reset();
                    say(form.getAttribute('data-success') || 'Sent. Thank you.');
                })
                .catch(function () {
                    say('That did not send. Check your connection and try again.');
                })
                .then(function () { if (btn) btn.disabled = false; });
        });
    });
})();
