// Things that need an outside service before they can work.
// Leave a value empty ('') and the site hides that feature or shows
// an honest "not open yet" note instead of a form that goes nowhere.

window.SM_CONFIG = {
    forms: {
        // Each of these takes a form endpoint URL that accepts a POST
        // (Formspree, Basin, Buttondown, a Netlify form, your own API…).
        email: '',   // daily email sign-up
        story: '',   // "share your story" submissions
        schools: '', // First Summer — schools / clubs / parents interest
    },

    // Invite link to a moderated group chat (Discord, WhatsApp community…).
    // When set, a "Join the chat" card appears on the Community page.
    communityChatUrl: '',
    communityChatName: '',
};
