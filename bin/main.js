'use strict';

class EventBus {
    constructor() {
        this.handlers = {};
    }
    dispatch(handler_name, arg) {
        if (!this.has(handler_name)) {
            return;
        }
        this.handlers[handler_name].forEach((c) => c(arg));
    }
    has(handler_name) {
        return handler_name in this.handlers;
    }
    on(handler_name, callback) {
        if (this.has(handler_name)) {
            this.handlers[handler_name].add(callback);
            return;
        }
        this.handlers[handler_name] = new Set([callback]);
    }
}

class SubTrackComponent {
    constructor(data = []) {
        this.data = data;
        this.is_visible = false;
        this.last_timestamp = 0;
        this.active_index = 0;
    }
    get active_sub() {
        return this.data[this.active_index];
    }
    get is_empty() {
        return this.data.length === 0;
    }
    display(is_visible = this.is_visible) {
        this.is_visible = is_visible;
    }
    tick(timestamp) {
        if (!timestamp || this.is_empty) {
            return;
        }
        const is_rewind = timestamp < this.last_timestamp;
        this.last_timestamp = timestamp;
        if (is_rewind) {
            this.seek();
            return;
        }
        const [_, end] = this.active_sub;
        if (end < timestamp) {
            this.active_index += 1;
        }
    }
    to_string() {
        if (!this.is_visible || this.is_empty) {
            return '&nbsp;';
        }
        const [start, end, txt] = this.active_sub;
        if (this.last_timestamp < start || end < this.last_timestamp) {
            return '&nbsp;';
        }
        return txt;
    }
    seek() {
        this.active_index = search_index(this.data, this.last_timestamp);
    }
}
/** Binary search actual caption's index */
function search_index(subs, timestamp, left_index = 0, right_index = subs.length - 1) {
    if (left_index >= right_index) {
        return left_index;
    }
    const middle_index = left_index + Math.floor((right_index - left_index) / 2);
    const [start, end] = subs[middle_index];
    if (start >= timestamp) {
        return search_index(subs, timestamp, left_index, middle_index - 1);
    }
    if (end <= timestamp) {
        return search_index(subs, timestamp, middle_index + 1, right_index);
    }
    return middle_index;
}
// var test: ISubs = [[0, 1, 'a'], [2, 3, 'b'], [4, 5, 'c']];
// console.assert(search_index(test, 0) === 0);
// console.assert(search_index(test, .5) === 0);
// console.assert(search_index(test, 1) === 0);
// console.assert(search_index(test, 1.5) === 0);
// console.assert(search_index(test, 2) === 1);
// console.assert(search_index(test, 2.5) === 1);
// console.assert(search_index(test, 3) === 1);
// console.assert(search_index(test, 4) === 2);
// console.assert(search_index(test, 6) === 2);

class SubsComponent {
    constructor() {
        this.primary_track = new SubTrackComponent();
        this.secondary_track = new SubTrackComponent();
        this.captions_disabled = true;
        this.display = this.display.bind(this);
        // @ts-ignore
        chrome.runtime.onMessage.addListener(this.add_subs.bind(this));
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('track')) {
                this.captions_disabled = e.target.innerText === 'Off';
                if (this.captions_disabled && !this.primary_track.is_empty && !this.secondary_track.is_empty) {
                    this.display_warn('');
                }
            }
        });
        this.warn_caption = this.create_caption_el('yellow');
        this.secondary_caption = this.create_caption_el('#eee');
        this.primary_caption = this.create_caption_el('#fff');
        this.container = this.create_container([this.warn_caption, this.primary_caption, this.secondary_caption]);
        document.body.appendChild(this.container);
    }
    display({ primary_sub, secondary_sub }) {
        this.primary_track.display(primary_sub?.is_visible);
        this.secondary_track.display(secondary_sub?.is_visible);
    }
    tick(timestamp) {
        this.primary_track.tick(timestamp);
        this.display_primary(this.primary_track.to_string());
        this.secondary_track.tick(timestamp);
        this.display_secondary(this.secondary_track.to_string());
    }
    display_warn(txt) {
        this.warn_caption.innerHTML = txt;
    }
    display_primary(txt) {
        this.primary_caption.innerHTML = txt;
    }
    display_secondary(txt) {
        this.secondary_caption.innerHTML = txt;
    }
    add_subs(subs) {
        if (this.captions_disabled) {
            this.display_warn('Netflix SUBS: Choose primary captions or disable me');
            return;
        }
        if (!this.primary_track.is_empty && this.secondary_track.is_empty) {
            this.secondary_track = new SubTrackComponent(subs);
            this.display_warn('Netflix SUBS: Secondary captions were added. Now, turn off all captions!');
            return;
        }
        this.primary_track = new SubTrackComponent(subs);
        this.secondary_track = new SubTrackComponent();
        this.display_warn('Netflix SUBS: Primary captions were added. Choose secondary ones!');
    }
    create_container(childs) {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '15%';
        container.style.left = '25%';
        container.style.width = '50%';
        container.style.textAlign = 'center';
        container.style.zIndex = '999999';
        childs.forEach((c) => { container.appendChild(c); });
        return container;
    }
    create_caption_el(color = '#fff') {
        const el = document.createElement('p');
        el.setAttribute('style', `font-size:17px;
         color:${color};
         text-shadow:#000000 0px 0px 7px;
         font-family:Netflix Sans,Helvetica Nueue,Helvetica,Arial,sans-serif;
         font-weight:bolder`);
        return el;
    }
}

class PlayerComponent extends EventBus {
    constructor(video_el_selector) {
        super();
        this.video_el_selector = video_el_selector;
        this.subs = new SubsComponent();
        this.state_change = this.state_change.bind(this);
        this.check_video_el = this.check_video_el.bind(this);
        this.check_video_el();
    }
    ;
    check_video_el() {
        if (this.video_el) {
            return;
        }
        setTimeout(this.check_video_el, 1000);
    }
    get video_el() {
        if (!this._video_el) {
            this._video_el = document.querySelector(this.video_el_selector);
            if (!this._video_el) {
                return null;
            }
            this._video_el.ontimeupdate = this.ontimeupdate.bind(this);
        }
        return this._video_el;
    }
    state_change(state) {
        this.subs.display(state);
    }
    ontimeupdate() {
        if (!this.video_el) {
            return;
        }
        this.subs.tick(this.video_el.currentTime);
        this.dispatch('timeupdate', { timestamp: this.video_el.currentTime });
    }
}

class UserActions extends EventBus {
    constructor() {
        super();
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                this.dispatch('stepback');
            }
        });
    }
}

class PlayerController extends EventBus {
    constructor(
    /** Rewind original video */
    rewind) {
        super();
        this.rewind = rewind;
        /** Step size in seconds */
        this.step_size = 10;
        /** Timestamp before rewind */
        this.end_timestamp = 0;
        this.start_timestamp = 0;
        this.state = {
            video: { timestamp: 0 },
            primary_sub: { is_visible: false },
            secondary_sub: { is_visible: false },
        };
        this.stepback = this.stepback.bind(this);
        this.timeupdate = this.timeupdate.bind(this);
        this.stepback_second = this.stepback_second.bind(this);
    }
    stepback() {
        if (this.end_timestamp < this.state.video.timestamp) {
            this.stepback_first();
            return;
        }
        this.stepback_second();
    }
    stepback_first() {
        this.end_timestamp = this.state.video.timestamp;
        this.start_timestamp = this.state.video.timestamp - this.step_size;
        this.rewind();
        this.set_state({
            video: { timestamp: this.start_timestamp },
            primary_sub: { is_visible: true },
            secondary_sub: { is_visible: false },
        });
    }
    stepback_second() {
        this.start_timestamp = this.state.video.timestamp - this.step_size;
        this.rewind();
        this.set_state({
            video: { timestamp: this.start_timestamp },
            primary_sub: { is_visible: true },
            secondary_sub: { is_visible: true },
        });
    }
    timeupdate({ timestamp }) {
        this.state.video.timestamp = timestamp;
        if (this.start_timestamp <= timestamp && timestamp <= this.end_timestamp) {
            return;
        }
        this.hide_subs();
    }
    hide_subs() {
        if (!this.state.primary_sub.is_visible && !this.state.secondary_sub.is_visible) {
            return;
        }
        this.set_state({
            primary_sub: { is_visible: false },
            secondary_sub: { is_visible: false }
        });
    }
    set_state(state) {
        this.state = { ...this.state, ...state };
        this.dispatch('state_change', state);
    }
}

window.onload = () => {
    /** hide original captions */
    document.head.innerHTML += '<style>.player-timedtext { visibility: hidden; } </style>';
    const rewind = () => { document.querySelector('.button-nfplayerBackTen')?.click(); };
    const player_ctrl = new PlayerController(rewind);
    const player_cmp = new PlayerComponent('div.VideoContainer video');
    player_cmp.on('timeupdate', player_ctrl.timeupdate);
    player_ctrl.on('state_change', player_cmp.state_change);
    const user_actions = new UserActions();
    user_actions.on('stepback', player_ctrl.stepback);
};
