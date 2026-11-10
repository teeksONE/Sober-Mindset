// Find Your Room: match a person to kinds of recovery support.
(function () {
    var el = document.getElementById('room-quiz');
    if (!el) return;
    var esc = SM.esc;

    var ROOMS = {
        aa: { name: 'AA or NA meetings', why: 'Free, everywhere, every day, with people who have decades of experience and will give you their phone number.', next: 'Try six different meetings before you decide.', href: 'meetings.html', cta: 'How meetings work' },
        ypaa: { name: 'Young people’s meetings', why: 'The same fellowship, with a room full of people your own age. Most cities have them, and there are plenty online.', next: 'Search your local AA or NA site for “young people”.', href: 'meetings.html#meeting-finders', cta: 'Meeting finders' },
        smart: { name: 'SMART Recovery', why: 'Practical, secular and skills-based. A facilitator takes the group through tools for urges, thoughts and motivation.', next: 'Join one online meeting this week to see the format.', href: 'beyond-the-rooms.html', cta: 'About SMART' },
        dharma: { name: 'Recovery Dharma', why: 'Peer-led, built around meditation. Quiet, reflective, and no need to be Buddhist.', next: 'Find an online sit and stay for the discussion.', href: 'beyond-the-rooms.html', cta: 'About Recovery Dharma' },
        lifering: { name: 'LifeRing', why: 'Secular and conversational. People talk through their week and the group responds.', next: 'Their online meetings run across most time zones.', href: 'beyond-the-rooms.html', cta: 'About LifeRing' },
        online: { name: 'Online communities', why: 'Awake at 3 a.m., anonymous, and in your pocket. A good first step when a door feels like too much.', next: 'Read r/stopdrinking tonight. Post when you’re ready.', href: 'find-your-crew.html', cta: 'Online options' },
        pro: { name: 'A counsellor or GP', why: 'One-to-one and private, and able to work on what is underneath the drinking. Also the route to medication if you want it.', next: 'Book a long appointment with a GP and tell them the real number.', href: 'beyond-the-rooms.html', cta: 'Professional options' },
        crew: { name: 'An activity crew', why: 'You connect by doing. A club or gym gives you people, a schedule and a reason to be up in the morning.', next: 'Pick one and turn up to the same session three weeks running.', href: 'find-your-crew.html', cta: 'Find your crew' },
    };

    function o(label, scores) { return { label: label, value: scores }; }

    var questions = [
        { q: 'How do you feel about the spiritual side of recovery?', options: [
            o('I’m into it', { aa: 3, ypaa: 2, dharma: 2 }),
            o('Open to it, loosely', { aa: 2, ypaa: 2, dharma: 2, lifering: 1 }),
            o('Not for me', { smart: 3, lifering: 3, pro: 2, crew: 1 }),
        ] },
        { q: 'What sounds most like what you need?', options: [
            o('Hearing from people who’ve been through it', { aa: 3, ypaa: 3, online: 1 }),
            o('Practical techniques I can use', { smart: 3, pro: 2 }),
            o('Quiet. Somewhere to settle my head', { dharma: 3, pro: 1 }),
            o('Doing something physical with other people', { crew: 4 }),
        ] },
        { q: 'Who do you want around you?', options: [
            o('People my own age', { ypaa: 4, crew: 2, online: 1 }),
            o('People with years of experience', { aa: 3, smart: 1 }),
            o('It doesn’t matter', { aa: 1, smart: 1, lifering: 1, dharma: 1 }),
            o('Just one person, privately', { pro: 4 }),
        ] },
        { q: 'In person or online?', options: [
            o('In person. I need to be in a room', { aa: 2, ypaa: 1, crew: 2 }),
            o('Online. A door is too much right now', { online: 3, smart: 1, lifering: 2, dharma: 1 }),
            o('Either', { aa: 1, smart: 1 }),
        ] },
        { q: 'How much structure do you want?', options: [
            o('A set programme to work through', { aa: 2, ypaa: 1, smart: 2, dharma: 1 }),
            o('Open conversation', { lifering: 3, online: 2 }),
            o('A professional guiding it', { pro: 3, smart: 1 }),
            o('None. I just want to be around people', { crew: 3, online: 1 }),
        ] },
        { q: 'When is it hardest?', options: [
            o('Late at night', { online: 3, aa: 1 }),
            o('Evenings after work or study', { aa: 2, ypaa: 1, crew: 2, smart: 1 }),
            o('Weekends', { crew: 3, ypaa: 1, aa: 1 }),
            o('All the time, honestly', { pro: 3, aa: 2 }),
        ] },
    ];

    function done(answers, restart) {
        var totals = {};
        answers.forEach(function (a) { Object.keys(a.value).forEach(function (k) { totals[k] = (totals[k] || 0) + a.value[k]; }); });
        var ranked = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; }).slice(0, 3);
        el.innerHTML =
            '<h2>Start with these</h2><p>Your top match first. Most people who stay sober end up using two or three kinds of support, so the others are worth a look too.</p>' +
            ranked.map(function (k, i) {
                var r = ROOMS[k];
                return '<div class="result"><p class="match">' + (i === 0 ? 'Best match' : 'Also worth a try') + '</p><h3>' + esc(r.name) + '</h3><p>' + esc(r.why) + '</p><p><strong>First step:</strong> ' + esc(r.next) + '</p><a class="btn btn-sm' + (i ? ' btn-ghost' : '') + '" href="' + r.href + '">' + esc(r.cta) + '</a></div>';
            }).join('') +
            '<div class="btn-row"><button type="button" class="btn btn-ghost" data-again>Start again</button></div>';
        el.querySelector('[data-again]').addEventListener('click', restart);
    }

    SM.quiz({ el: el, questions: questions, done: done });
})();
