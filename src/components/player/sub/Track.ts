import { ISubs } from '~/subs';

export class SubTrackComponent {
   is_visible: boolean = false;
   constructor(private data: ISubs = []) { }

   private last_timestamp: number = 0;
   private active_index: number = 0;
   private get active_sub() {
      return this.data[this.active_index] || [0, 0, ''];
   }
   get is_empty() {
      return this.data.length === 0;
   }

   display(is_visible: boolean = this.is_visible) {
      this.is_visible = is_visible;
   }

   tick(timestamp: number) {
      if (!timestamp || this.is_empty) { return; }
      const is_rewind = timestamp < this.last_timestamp;
      this.last_timestamp = timestamp;
      if (is_rewind) {
         this.active_index = search_index(this.data, this.last_timestamp);
         return;
      }
      const [_, end] = this.active_sub;
      if (end < timestamp) {
         this.active_index += 1;
      }
   }

   to_string(): string {
      if (!this.is_visible || this.is_empty) { return '&nbsp;'; }
      const [start, end, txt] = this.active_sub;
      if (this.last_timestamp < start || end < this.last_timestamp) { return '&nbsp;'; }
      return txt;
   }
}


/** Binary search actual caption's index */
function search_index(
   subs: ISubs,
   timestamp: number,
   left_index: number = 0,
   right_index = subs.length - 1
): number {
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