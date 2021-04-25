export function parse(text: string): ISubs {
   return text
      .split('\n')
      .map((line) => /begin="(\d+)t" end="(\d+)t".*>([^[>|<|/]+)<.*/.exec(line) as string[] | null)
      .filter((result): result is string[] => result !== null)
      .filter((result) => result.length === 4)
      .map(([_, start, end, txt]) => [Number(start) / 10000000, Number(end) / 10000000, txt]);
}

type Timestamp = number;
type Sub = string;
export type ISubs = [Timestamp, Timestamp, Sub][];