// seen.js
import {socket} from "./socket";
import {getAccessToken} from "./refreshTok";

let observer;
let debounceTimeout;

// Keep track of the highest‐seen timestamp per conversation
const lastSeenTimestamps = {};

/**
 * Initialize seen message observer.
 * @param {object} options
 * @param {string} options.containerId - ID of the chat messages container.
 * @param {string} options.event - socket event name, e.g., 'seen message'.
 */
export function initSeenObserver({
                                     containerId = 'chat-container',
                                     event       = 'seen message'
                                 } = {}) {
    const chatContainer = document.getElementById(containerId);
    if (!chatContainer) return;

    const conversationId =
        chatContainer.dataset.convID || chatContainer.dataset.convid;
    if (!conversationId) {
        console.warn('Conversation ID not found on container');
        return;
    }

    // Initialize lastSeenTimestamp for this conversation
    if (!lastSeenTimestamps[conversationId]) {
        // Seed from server‑provided seenBys if you like:
        // lastSeenTimestamps[conversationId] = Number(window.seenBys?.[conversationId]?.[window.currentUserId]Timestamp) || 0;
        lastSeenTimestamps[conversationId] = 0;
    }

    // Debounced emit of the last visible message ID
    function emitLastVisible(messageId) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            socket.emit(event, { conversationId, messageId });
        }, 100);
    }

    // IntersectionObserver callback
    function callback(entries) {
        // 1) collect all newly visible messages
        const visible = entries
            .filter(e => e.isIntersecting)
            .map(e => e.target)
            .filter(el =>
                !el.classList.contains('seen') &&
                !el.classList.contains('you')
            );

        if (!visible.length) return;

        // 2) pick the message furthest down in the scroll
        const lastVisible = visible.reduce((a, b) =>
            b.offsetTop > a.offsetTop ? b : a
        );

        const messageId    = lastVisible.dataset.messageId;
        const ts           = parseInt(lastVisible.dataset.timestamp, 10);
        const prevTs       = lastSeenTimestamps[conversationId] || 0;

        // 3) only proceed if this message is newer than any we've already seen
        if (!messageId || ts <= prevTs) {
            // still mark them as seen so we don't re-observe
            visible.forEach(el => {
                el.classList.add('seen');
                observer.unobserve(el);
            });
            return;
        }

        // 4) update our local “last seen timestamp” so we don’t go backwards
        lastSeenTimestamps[conversationId] = ts;

        // 5) mark them as seen and unobserve
        visible.forEach(el => {
            el.classList.add('seen');
            observer.unobserve(el);
        });

        // 6) emit only the newest one
        emitLastVisible(messageId);
    }

    // Create the observer with a low threshold so even a sliver counts
    observer = new IntersectionObserver(callback, { threshold: 0.1 });

    // Watch any unseen message elements
    function observeUnseen() {
        const msgs = chatContainer.querySelectorAll('.message:not(.seen)');
        msgs.forEach(m => observer.observe(m));
    }

    // Start observing
    observeUnseen();

    // Re‑observe whenever new messages arrive
    const mo = new MutationObserver(observeUnseen);
    mo.observe(chatContainer, { childList: true });
}
