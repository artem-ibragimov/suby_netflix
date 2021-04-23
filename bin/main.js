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
        this.active_index = 0;
    }
    get is_empty() {
        return this.data.length === 0;
    }
    state_change(timestamp, is_visible = this.is_visible) {
        this.is_visible = is_visible;
        if (!timestamp || this.is_empty) {
            return;
        }
        const [_start, end, _txt] = this.data[this.active_index];
        if (end < timestamp) {
            this.active_index += 1;
        }
    }
    to_string(timestamp) {
        if (!this.is_visible || this.is_empty) {
            return '';
        }
        const [start, end, txt] = this.data[this.active_index];
        console.log(timestamp, 'to_string', [start, end, txt]);
        if (timestamp < start || end < timestamp) {
            return '';
        }
        return txt;
    }
    seek(timestamp) {
        if (!timestamp || this.is_empty) {
            return;
        }
        this.active_index = search_index(this.data, timestamp);
        console.log('for timestamp', timestamp, ' closest sub is ', this.data[this.active_index]);
        console.log('another subs are', this.data[this.active_index - 1], this.data[this.active_index + 1]);
        this.state_change(timestamp, false);
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
        this.state_change = this.state_change.bind(this);
        // @ts-ignore
        chrome.runtime.onMessage.addListener(this.add_subs.bind(this));
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('track')) {
                this.captions_disabled = e.target.innerText === 'Off';
                if (this.captions_disabled && !this.primary_track.is_empty && !this.secondary_track.is_empty) {
                    this.clear_display();
                }
            }
        });
        this.create_container();
    }
    state_change({ video, primary_sub, secondary_sub }) {
        this.primary_track.state_change(video?.timestamp, primary_sub?.is_visible);
        this.secondary_track.state_change(video?.timestamp, secondary_sub?.is_visible);
        if (video) {
            const txt = [this.primary_track.to_string(video.timestamp), this.secondary_track.to_string(video.timestamp)];
            this.display_text(txt);
        }
    }
    seek(timestamp) {
        this.primary_track.seek(timestamp);
        this.secondary_track.seek(timestamp);
    }
    display_warn(txt) {
        this.display_text([txt], 'yellow');
    }
    clear_display() {
        this.container.innerHTML = '';
    }
    display_text(txt, color = '#ffffff') {
        if (txt.every((t) => t === '')) {
            return;
        }
        this.container.innerHTML = txt.map((t) => `<span style="font-size:17px; line-height:normal; font-weight:normal; color:${color}; text-shadow:#000000 0px 0px 7px; font-family:Netflix Sans,Helvetica Nueue,Helvetica,Arial,sans-serif;font-weight:bolder">
               ${t}
            </span>`)
            .join('');
    }
    add_subs(subs) {
        if (this.captions_disabled) {
            this.display_warn('Choose primary captions!');
            return;
        }
        if (!this.primary_track.is_empty && this.secondary_track.is_empty) {
            this.secondary_track = new SubTrackComponent(subs);
            this.display_warn('Secondary captions were added.\nTurn off captions!');
            return;
        }
        this.primary_track = new SubTrackComponent(subs);
        this.secondary_track = new SubTrackComponent();
        this.display_warn('Primary captions were added.\nChoose secondary ones!');
    }
    create_container() {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.bottom = '15%';
        this.container.style.left = '25%';
        this.container.style.width = '50%';
        this.container.style.textAlign = 'center';
        this.container.style.zIndex = '999999';
        document.body.appendChild(this.container);
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
            this._video_el.onseeked = this.onseeked.bind(this);
            this._video_el.ontimeupdate = this.ontimeupdate.bind(this);
        }
        return this._video_el;
    }
    state_change(state) {
        this.subs.state_change(state);
    }
    ontimeupdate() {
        if (!this.video_el) {
            return;
        }
        const state = { timestamp: this.video_el.currentTime };
        this.dispatch('timeupdate', state);
        this.subs.state_change({ video: state });
    }
    onseeked() {
        if (!this.video_el) {
            return;
        }
        this.dispatch('onseeked', { timestamp: this.video_el.currentTime });
        this.subs.seek(this.video_el.currentTime);
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
        this.onseeked = this.onseeked.bind(this);
        this.timeupdate = this.timeupdate.bind(this);
    }
    stepback() {
        this.start_timestamp = this.state.video.timestamp - this.step_size;
        if (this.end_timestamp < this.state.video.timestamp) {
            this.stepback_first(this.start_timestamp);
            return;
        }
        this.stepback_second(this.start_timestamp);
    }
    stepback_first(timestamp) {
        this.end_timestamp = this.state.video.timestamp;
        this.rewind();
        this.set_state({
            video: { timestamp },
            primary_sub: { is_visible: true },
            secondary_sub: { is_visible: false },
        });
    }
    stepback_second(timestamp) {
        this.end_timestamp = this.state.video.timestamp;
        this.rewind();
        this.set_state({
            video: { timestamp },
            primary_sub: { is_visible: true },
            secondary_sub: { is_visible: true },
        });
    }
    timeupdate({ timestamp }) {
        this.state.video.timestamp = timestamp;
        if (this.start_timestamp <= this.state.video.timestamp &&
            this.state.video.timestamp <= this.end_timestamp) {
            return;
        }
        this.hide_subs();
    }
    onseeked({ timestamp }) {
        if (timestamp === this.start_timestamp) {
            return;
        }
        this.start_timestamp = 0;
        this.end_timestamp = 0;
        // this.hide_subs();
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
    player_cmp.on('onseeked', player_ctrl.onseeked);
    player_cmp.on('timeupdate', player_ctrl.timeupdate);
    player_ctrl.on('state_change', player_cmp.state_change);
    const user_actions = new UserActions();
    user_actions.on('stepback', player_ctrl.stepback);
};
