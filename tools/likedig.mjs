// likedig.mjs — "dig based on what you liked": your kind-7 likes -> people who liked the same notes
// -> notes those people liked recently that you haven't seen. Plain NIP-25 reactions, no server.
// usage: node likedig.mjs <npub> [nLikes=200]
import { SimplePool } from 'nostr-tools/pool'
import { nip19 } from 'nostr-tools'
const R = ['wss://relay.damus.io','wss://nos.lol','wss://relay.primal.net','wss://relay.snort.social','wss://nostr.wine']
const pk = nip19.decode(process.argv[2]).data, N = +(process.argv[3] || 200)
const p = new SimplePool(), lastE = e => e.tags.filter(t => t[0] === 'e').pop()?.[1]
const mine = (await p.querySync(R, { kinds: [7], authors: [pk], limit: N })).filter(e => e.content !== '-')
const liked = [...new Set(mine.map(lastE).filter(Boolean))]
console.log('my likes:', mine.length, '| distinct notes:', liked.length)
const co = await p.querySync(R, { kinds: [7], '#e': liked.slice(0, 150), limit: 3000 })
const score = {}; for (const e of co) if (e.pubkey !== pk && e.content !== '-') score[e.pubkey] = (score[e.pubkey] || 0) + 1
const peers = Object.entries(score).filter(([, s]) => s >= 2).sort((a, b) => b[1] - a[1]).slice(0, 40)
console.log('co-likers (>=2 shared likes):', peers.length)
const since = Math.floor(Date.now() / 1000) - 3 * 86400
const theirs = await p.querySync(R, { kinds: [7], authors: peers.map(x => x[0]), since, limit: 3000 })
const w = Object.fromEntries(peers), cand = {}
for (const e of theirs) { const id = lastE(e); if (id && !liked.includes(id) && e.content !== '-') cand[id] = (cand[id] || 0) + w[e.pubkey] }
const top = Object.entries(cand).sort((a, b) => b[1] - a[1]).slice(0, 10)
console.log('candidates (3 d):', Object.keys(cand).length)
for (const [id, s] of top) console.log(s, nip19.noteEncode(id))
p.close(R); process.exit(0)
