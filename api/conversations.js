import alt        from "../alt";

class ConversationsApi {

  constructor() {
    this.bindEvents();
  }

  getAll(website_id, page = 1, search_query = {}) {
    return alt.client.read(["website", website_id, "conversations", page], {
      query : search_query
    })
    .then(res => {
      alt.getActions("ConversationsActions")
        .conversationsLoaded({
          website_id    : website_id,
          conversations : res.data,
          page          : page
        });
      return Promise.resolve(res.data);
    });
  }

  getOne(website_id, session_id) {
    return alt.client.read(["website", website_id, "conversation", session_id])
    .then(res => {
      alt.getActions("ConversationsActions")
        .conversationLoaded({
          website_id   : website_id,
          session_id   : session_id,
          conversation : res.data
        });
      return Promise.resolve(res.data);
    });
  }

  getFingerprint() {
    const __OFFSET  = 5;

    let str         = ("react-native-app" + Date.now());
    let fingerprint = 5381;

    for (let i = 0; i < str.length; i++) {
      let char = str.charCodeAt(i);

      fingerprint = (((fingerprint << __OFFSET) + fingerprint) + char);
    }

    return fingerprint;
  }

  setOpened(website_id, session_id, me) {
    alt.socket.emit("session:set_opened", {
      website_id      : website_id,
      session_id      : session_id,
      operator        : me
    });
  }

  markAsRead(website_id, session_id, fingerprints) {
    alt.socket.emit("message:acknowledge:read:send", {
      website_id      : website_id,
      session_id      : session_id,
      fingerprints    : fingerprints
    });
  }

  sendMessage(website_id, session_id, message) {
    alt.track({
      event_type : "Sent message",
      event_properties : {
        source : "mobile",
      }
    });

    alt.client.add(["website", website_id, "conversation", session_id,
      "message"], {
        body : message
      }
    );

    alt.getActions("ConversationsActions").messageReceived(message);
  }

  setState(website_id, session_id, state) {
    alt.track({
      event_type : "Updated conversation state",
      event_properties : {
        source : "mobile",
      }
    });

    alt.client.patch(["website", website_id, "conversation", session_id, "state"],
    {
      body : {
        state : state
      }
    });
  }

  deleteConversation(website_id, session_id) {
    alt.client.del(["website", website_id, "conversation", session_id]);
  }

  bindEvents() {
    alt.socket.on("message:received", message => {
      alt.getActions("ConversationsActions")
        .messageReceived(message);
    });
    alt.socket.on("message:send", message => {
      alt.getActions("ConversationsActions")
        .messageReceived(message);
    });
    alt.socket.on("message:compose:send", event => {
      alt.getActions("ConversationsActions")
        .messageComposing(event);
    });
    alt.socket.on("message:acknowledge:read:send", event => {
      alt.getActions("ConversationsActions")
        .readMessages(event, "send");
    });
    alt.socket.on("message:acknowledge:read:received", event => {
      alt.getActions("ConversationsActions")
        .readMessages(event, "received");
    });
    alt.socket.on("session:update_availability", event => {
      alt.getActions("ConversationsActions")
        .updateAvailability(event);
    });
    alt.socket.on("session:set_state", event => {
      alt.getActions("ConversationsActions")
        .updateState(event);
    });
    alt.socket.on("session:set_nickname", event => {
      alt.getActions("ConversationsActions")
        .updateNickname(event);
    });
    alt.socket.on("session:set_email", event => {
      alt.getActions("ConversationsActions")
        .updateEmail(event);
    });
    alt.socket.on("session:removed", event => {
      alt.getActions("ConversationsActions")
        .removeConversation(event);
    });
    alt.socket.on("session:sync:geolocation", event => {
      alt.getActions("ConversationsActions")
        .updateGeolocation(event);
    });
    alt.socket.on("session:sync:system", event => {
      alt.getActions("ConversationsActions")
        .updateSystem(event);
    });
    alt.socket.on("session:sync:pages", event => {
      alt.getActions("ConversationsActions")
        .updatePages(event);
    });
  }
}

export default new ConversationsApi();
