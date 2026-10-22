export const topics = [
  "All posts",
  "AI agents",
  "Building",
  "Community",
  "Memes",
] as const;
export type Topic = (typeof topics)[number];
export type Sort = "picks" | "newest";
export type View = "feed" | "saved";

export interface Post {
  id: string;
  author: string;
  handle: string;
  initials: string;
  date: string;
  excerpt: string;
  topics: Exclude<Topic, "All posts">[];
  source: string;
  context: string;
  avatar: "olive" | "sage" | "sand";
}

// A fixed editorial collection, not an X API response. Every ID was resolved
// from a public source link; dates are decoded from those canonical post IDs.
// These are short excerpts, not a reproduction of the complete conversations.
export const posts: Post[] = [
  {
    id: "2090686744920481869",
    author: "Meme Indexer",
    handle: "MemeIndexer",
    initials: "mi",
    date: "2026-08-21T06:25:37Z",
    excerpt:
      "An NFT-gated, community-owned AI inference network where compute is peer-to-peer, builders launch projects on-chain, and every project gets its own capital market",
    topics: ["AI agents", "Building"],
    source: "https://zamantika.com/MemeIndexer/status/2090686744920481869",
    context:
      "The big-picture thesis: a community connects AI compute, software builders and onchain markets through IMD. This is the author’s perspective on an experimental network.",
    avatar: "olive",
  },
  {
    id: "2090709529826558310",
    author: "Damián Et",
    handle: "damian_et",
    initials: "de",
    date: "2026-08-21T07:56:10Z",
    excerpt:
      "New onchain message with info on the NFT! $IMD Pepe's armed with AI",
    topics: ["Memes", "Community"],
    source: "https://zamantika.com/damian_et/status/2090709529826558310",
    context:
      "A short dispatch from the community, and the inspiration for our AI-equipped frog squad. The illustration on this site is original artwork, not media from this tweet.",
    avatar: "sage",
  },
  {
    id: "2089938015988719677",
    author: "Adam",
    handle: "surfcoderepeat",
    initials: "a",
    date: "2026-08-19T04:50:26Z",
    excerpt:
      'A "One token meme launchpad" Would love for ppl to fork it and use it for your community memes',
    topics: ["Building"],
    source: "https://zamantika.com/surfcoderepeat/status/2089938015988719677",
    context:
      "An invitation to experiment with a shared-token launchpad. Open the original for the full proposal and the surrounding discussion.",
    avatar: "sand",
  },
  {
    id: "2090762111030817073",
    author: "Mun1a",
    handle: "mun1aa",
    initials: "m",
    date: "2026-08-21T11:25:06Z",
    excerpt:
      "I pulled every Transfer event, rebuilt prices from raw tx data, and traced 392 holders across 205,306 NFT purchases",
    topics: ["Community"],
    source: "https://zamantika.com/mun1aa/status/2090762111030817073",
    context:
      "A community researcher looks at the people holding IdentityMD NFTs. The quoted figures describe that historical analysis, not current network totals.",
    avatar: "sage",
  },
  {
    id: "2090657057796198650",
    author: "Mirror",
    handle: "mirror_web3",
    initials: "mr",
    date: "2026-08-21T04:27:39Z",
    excerpt:
      "New update from @surfcoderepeat on $IMD Clear utility coming to Identity MD NFT holders",
    topics: ["AI agents", "Community"],
    source: "https://zamantika.com/mirror_web3/status/2090657057796198650",
    context:
      "A community reaction to an early project update. This is an archived opinion; it does not establish present-day NFT utility.",
    avatar: "olive",
  },
  {
    id: "2054845909448446401",
    author: "Cryptamurai",
    handle: "cryptamurai",
    initials: "c",
    date: "2026-05-14T08:46:56Z",
    excerpt:
      "Hmmmm I think @surfcoderepeat just launched a super interesting experiment. He transferred ownership of the collection to an agent",
    topics: ["AI agents"],
    source: "https://www.kucoin.com/news/insight/ETH/6a063797d064730007b59dc6",
    context:
      "An early reaction to the collection’s experiment with AI. The author speculates about what agent-controlled identities could become.",
    avatar: "sand",
  },
];

export const postUrl = (post: Post) =>
  `https://x.com/${post.handle}/status/${post.id}`;

const normalize = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();

export function selectPosts(
  query: string,
  topic: Topic,
  sort: Sort,
  savedOnly: boolean,
  saved: string[],
): Post[] {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const result = posts.filter((post) => {
    if (savedOnly && !saved.includes(post.id)) return false;
    if (topic !== "All posts" && !post.topics.includes(topic)) return false;
    const text = normalize(
      [
        post.author,
        post.handle,
        post.excerpt,
        post.context,
        ...post.topics,
      ].join(" "),
    );
    return terms.every((term) => text.includes(term));
  });
  return sort === "newest"
    ? result.sort((a, b) => b.date.localeCompare(a.date))
    : result;
}
