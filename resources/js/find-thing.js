// Find Your Thing: match a kind of intensity to a sport.
(function () {
    var el = document.getElementById('thing-quiz');
    if (!el) return;
    var esc = SM.esc;

    var SPORTS = {
        surf: ['Surfing', 'Cold water, sunrise, and a thing you will never finish learning.'],
        lifesaving: ['Surf lifesaving', 'A crew, a qualification and a job that matters on the beach.'],
        dive: ['Freediving and spearfishing', 'One breath, total calm, a different world ten metres down.'],
        climb: ['Climbing and bouldering', 'Fear you can practise on, and strangers who become belay partners.'],
        mtb: ['Mountain biking', 'Speed, trees and the kind of focus that leaves no room for anything else.'],
        skate: ['Skateboarding', 'The cheapest way in. Falling over in public until you don’t.'],
        combat: ['Combat sports', 'Someone is trying to beat you. Nothing clears the head faster.'],
        trail: ['Trail running', 'Emptying the tank somewhere beautiful. Free, forever.'],
        sky: ['Skydiving', 'The biggest rush there is, and a tight community that takes safety seriously.'],
        snow: ['A snow season', 'Work on a mountain, ride every day, come home a different person.'],
    };

    function o(label, scores) { return { label: label, value: scores }; }

    var questions = [
        { q: 'Where do you want to be?', options: [
            o('In the water', { surf: 3, lifesaving: 3, dive: 3 }),
            o('In the mountains or the bush', { climb: 2, mtb: 3, trail: 3, snow: 3 }),
            o('In a gym or on the street', { combat: 3, skate: 3, climb: 2 }),
            o('In the air', { sky: 4 }),
        ] },
        { q: 'What kind of rush are you after?', options: [
            o('Speed', { mtb: 3, snow: 3, skate: 2, surf: 1 }),
            o('Height and exposure', { climb: 3, sky: 3 }),
            o('Contact. Someone trying to beat me', { combat: 4 }),
            o('Emptying the tank', { trail: 3, lifesaving: 2, combat: 1 }),
            o('Flow. Making it look easy', { surf: 3, skate: 3, dive: 2, snow: 1 }),
        ] },
        { q: 'How do you like to do things?', options: [
            o('On my own, in my own head', { trail: 2, skate: 2, dive: 1, surf: 2, climb: 1 }),
            o('With a small crew', { climb: 2, mtb: 2, surf: 1, sky: 2, snow: 2, dive: 2 }),
            o('In a club, with a role to play', { lifesaving: 4, combat: 2 }),
        ] },
        { q: 'What can you spend to get started?', options: [
            o('Close to nothing', { trail: 3, skate: 3, lifesaving: 2, combat: 1 }),
            o('A bit, for lessons or a membership', { surf: 2, climb: 2, combat: 2, dive: 1, mtb: 1 }),
            o('I’d save up for something big', { sky: 3, snow: 3, mtb: 1, dive: 1 }),
        ] },
        { q: 'How do you feel about being scared?', options: [
            o('I go looking for it', { sky: 3, mtb: 2, climb: 2, snow: 1 }),
            o('I want to learn to handle it', { climb: 2, combat: 2, dive: 2, surf: 2, lifesaving: 1 }),
            o('I’d take exhausted over scared', { trail: 3, lifesaving: 2, combat: 1 }),
        ] },
        { q: 'What do you want to have in twelve weeks?', options: [
            o('A skill I can show people', { skate: 3, surf: 2, climb: 2, combat: 1 }),
            o('A qualification', { lifesaving: 4, sky: 2, dive: 2 }),
            o('Fitness I can feel', { trail: 3, combat: 3, lifesaving: 1, mtb: 1 }),
            o('A story', { sky: 3, snow: 3, dive: 1, mtb: 1 }),
        ] },
    ];

    function done(answers, restart) {
        var totals = {};
        answers.forEach(function (a) { Object.keys(a.value).forEach(function (k) { totals[k] = (totals[k] || 0) + a.value[k]; }); });
        var ranked = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; }).slice(0, 4);
        SM.save('summer-picks', ranked);
        el.innerHTML =
            '<h2>Your four to sample</h2><p>Weeks one to four of First Summer are for trying things. These are yours, best match first. Book a coached intro for each.</p>' +
            ranked.map(function (k, i) {
                return '<div class="result"><p class="match">' + (i === 0 ? 'Best match' : 'Week ' + (i + 1)) + '</p><h3>' + esc(SPORTS[k][0]) + '</h3><p>' + esc(SPORTS[k][1]) + '</p><a class="btn btn-sm' + (i ? ' btn-ghost' : '') + '" href="first-summer-sports.html#' + k + '">Cost, first step, where to find people</a></div>';
            }).join('') +
            '<div class="btn-row"><a class="btn btn-accent" href="first-summer-plan.html">Put them in my 12-week plan</a><button type="button" class="btn btn-ghost" data-again>Start again</button></div>';
        el.querySelector('[data-again]').addEventListener('click', restart);
    }

    SM.quiz({ el: el, questions: questions, done: done });
})();
