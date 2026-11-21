// Site-wide settings. Edit here, then run `npm run build`.

export default {
    siteName: "Sober Mindset",
    tagline: "A bigger life, not a smaller one.",

    // The public address of the site, with a trailing slash. Used for
    // canonical links, the sitemap and social-share previews.
    // Change this if the site moves to a custom domain.
    siteUrl: "https://yoursobermindset.com/",

    // Date the author got sober — drives the "N years sober" counters.
    soberDate: "2014-11-12",

    nav: [
        { label: "The Path", href: "path.html", section: "path" },
        { label: "Tools", href: "tools.html", section: "tools" },
        { label: "Community", href: "community.html", section: "community" },
        { label: "First Summer", href: "first-summer.html", section: "summer" },
        { label: "Science", href: "science.html", section: "science" },
        { label: "Daily", href: "daily.html", section: "daily" },
    ],

    // The Path: recovery in stages. Each stage has a hub page (`slug`)
    // followed by its pages, in reading order. The order here drives the
    // stage rail, the "next step" links and the hub page listings.
    stages: [
        {
            n: 1,
            slug: "questioning",
            name: "Question",
            pages: ["am-i-drinking-too-much", "crossroads", "sobriety-myths"],
        },
        {
            n: 2,
            slug: "first-days",
            name: "First days",
            pages: ["stopping-safely", "first-72-hours", "first-week-sober"],
        },
        {
            n: 3,
            slug: "first-90-days",
            name: "Find your people",
            pages: ["meetings", "first-meeting", "beyond-the-rooms", "cravings", "support"],
        },
        {
            n: 4,
            slug: "rebuild",
            name: "Rebuild",
            pages: [
                "brain-recovery",
                "health",
                "sleep",
                "nutrition",
                "fitness",
                "meditation",
                "hobbies",
                "sober-social-life",
                "relapse",
            ],
        },
        {
            n: 5,
            slug: "live-big",
            name: "Live big",
            pages: ["adventures", "giving-back"],
        },
    ],

    // Other reading sequences (first slug is the hub). `then` is where the
    // last page hands off to.
    sequences: {
        path: { label: "The Path", then: "community" },
        summer: {
            label: "First Summer",
            pages: [
                "first-summer",
                "first-summer-science",
                "find-your-thing",
                "first-summer-sports",
                "first-summer-plan",
                "first-summer-schools",
            ],
            then: "find-your-crew",
        },
        tools: {
            label: "Tools",
            pages: ["tools", "sober-counter", "urge-surf", "check-in", "crew-card"],
            then: "community",
        },
        community: {
            label: "Community",
            pages: ["community", "find-your-room", "find-your-crew", "crew-pact", "stories", "for-families"],
            then: "path",
        },
    },
};
