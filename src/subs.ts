export function parse(text: string): ISubs {
   return text
      .split('\n')
      .map((line) => /begin="(\d+)t" end="(\d+)t" [^<]*>(.+)<\/.*/.exec(line) as string[] | null)
      .filter((result): result is string[] => result !== null && result.length === 4)
      .map(([_, start, end, txt]) => [Number(start) / 10000000, Number(end) / 10000000, removeTags(txt)]);
}

function removeTags(s: string): string {
   return s.replace(new RegExp('<[^>]*>', 'gi'), "\n");
}

type Timestamp = number;
type Sub = string;
export type ISubs = [Timestamp, Timestamp, Sub][];