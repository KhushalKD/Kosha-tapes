/*
    Contact form handling for the Kosha Tapes website.

    The same form can be sent two ways:
      WhatsApp - opens wa.me with the message pre-filled.
      Email    - posts the enquiry to Web3Forms, which delivers it to the
                 inbox the access key below was created for. Nothing opens on
                 the visitor's machine - no mail app, no new tab.

    No password, app password or SMTP setting is stored in this file, and none
    is needed. To change where email enquiries arrive:
      1. Open https://web3forms.com and enter the destination email address.
      2. Click the confirmation link Web3Forms emails to that address.
      3. Paste the access key it gives you into WEB3FORMS_ACCESS_KEY below.

    The access key is safe to keep in this public file. It can only deliver
    mail TO the address it was created for - it cannot be used to send mail as
    that address, or to read anything.
*/
(function () {
    'use strict';

    var WEB3FORMS_ACCESS_KEY = '4bd0974e-d119-46d9-a904-b01dfa16c109';

    // Shown to the visitor if the message cannot be sent.
    var CONTACT_EMAIL = 'kosha.tapes@gmail.com';

    var form = document.getElementById('contactForm');
    if (!form) return;

    var waButton = document.getElementById('waButton');
    var emailButton = document.getElementById('emailButton');
    var statusBox = document.getElementById('formStatus');
    var honeypot = document.getElementById('website');

    function value(id) {
        var field = document.getElementById(id);
        return field ? field.value.trim() : '';
    }

    function setStatus(text, type) {
        if (!statusBox) return;
        var tone = type === 'error' ? 'text-danger' : type === 'success' ? 'text-success' : 'text-muted';
        statusBox.className = 'col-12 mb-0 ' + tone;
        statusBox.textContent = text;
    }

    function enquiryLines(name, email, subject, message) {
        return 'Name: ' + (name || '-') + '\n' +
               'Email: ' + (email || '-') + '\n' +
               'Subject: ' + (subject || '-') + '\n' +
               'Message: ' + (message || '-') + '\n\n' +
               '---\n' +
               'Sent from the Kosha Tapes website';
    }

    /* WhatsApp: unchanged behaviour, an empty form still sends a general enquiry. */
    function sendOnWhatsApp() {
        if (!waButton) return;

        var phone = waButton.getAttribute('data-whatsapp-number');
        var name = value('name');
        var email = value('email');
        var subject = value('subject');
        var message = value('message');
        var text;

        if (!name && !email && !subject && !message) {
            text = 'Hi Kosha Tapes,\n\n' +
                   'I visited your website and I\'m interested in your adhesive tape ' +
                   'products. Please share more details.';
        } else {
            text = 'Hi Kosha Tapes,\n\n' + enquiryLines(name, email, subject, message);
        }

        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
    }

    if (waButton) waButton.addEventListener('click', sendOnWhatsApp);

    /*
        If the send fails, offer the visitor a choice instead of launching
        anything. Most people have no mail app set up, so opening one for them
        is a dead end - here they can pick WhatsApp, or copy the address.
    */
    function offerAlternatives(name, email, subject, message) {
        if (!statusBox) return;

        var mailHref = 'mailto:' + CONTACT_EMAIL +
                       '?subject=' + encodeURIComponent(subject) +
                       '&body=' + encodeURIComponent(enquiryLines(name, email, subject, message));

        var mailLink = '<a href="' + mailHref + '" class="fw-bold">' + CONTACT_EMAIL + '</a>';

        statusBox.className = 'col-12 mb-0 text-danger';

        if (!waButton) {
            statusBox.innerHTML =
                'Sorry, your message could not be sent just now. ' +
                'Please write to us at ' + mailLink + ' instead.';
            return;
        }

        statusBox.innerHTML =
            'Sorry, your message could not be sent just now. Please ' +
            '<a href="#" id="waFallback" class="fw-bold">send it on WhatsApp</a> instead, ' +
            'or write to us at ' + mailLink + '.';

        var link = document.getElementById('waFallback');
        if (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                sendOnWhatsApp();
            });
        }
    }

    /* Email: the form's own submit, so the browser validates required fields first. */
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Hidden field a person never sees; only bots fill it in.
        if (honeypot && honeypot.value) return;

        var name = value('name');
        var email = value('email');
        var message = value('message');
        var subject = value('subject') || ('Website enquiry from ' + (name || 'a visitor'));

        if (!name || !email || !message) {
            setStatus('Please fill in your name, email and message.', 'error');
            return;
        }

        if (WEB3FORMS_ACCESS_KEY.indexOf('PASTE-') === 0) {
            offerAlternatives(name, email, subject, message);
            return;
        }

        if (emailButton) emailButton.disabled = true;
        setStatus('Sending your message...', 'info');

        function finish() {
            if (emailButton) emailButton.disabled = false;
        }

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                access_key: WEB3FORMS_ACCESS_KEY,
                from_name: 'Kosha Tapes Website',
                subject: subject,
                name: name,
                email: email,
                message: message
            })
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (result) {
                if (!result.success) throw new Error(result.message || 'Send failed');
                setStatus('Thank you. Your message has been sent - we will reply to ' + email + ' shortly.', 'success');
                form.reset();
                finish();
            })
            .catch(function () {
                finish();
                offerAlternatives(name, email, subject, message);
            });
    });
})();
