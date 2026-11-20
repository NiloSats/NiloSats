import { getReceiveSigningKeys } from './proofs/P2pkReceiveValidation.ts';
import { secp256k1 } from '@noble/curves/secp256k1.js';
const pk = (n: number) => Buffer.from(secp256k1.getPublicKey(new Uint8Array(32).fill(n), true)).toString('hex');
const MAIN = pk(1), REFUND = pk(2), L = 1_800_000_000;
const secret = (tags: string[][]) => JSON.stringify(['P2PK', { nonce: '00', data: MAIN, tags }]);
const withRefund = secret([['locktime', String(L)], ['refund', REFUND]]);
const noRefund = secret([['locktime', String(L)]]);
const show = (name: string, s: string, now: number) => {
  const k = getReceiveSigningKeys(s, now);
  console.log(name.padEnd(48), k.length === 0 ? '[] (no witness)' : k.map(x => x === MAIN ? 'MAIN' : x === REFUND ? 'REFUND' : x).join(','));
};
show('refund tag, wallet before locktime', withRefund, L - 60);
show('refund tag, wallet after locktime', withRefund, L + 60);
show('no refund tag, wallet before locktime', noRefund, L - 60);
show('no refund tag, wallet after locktime', noRefund, L + 60);
show('no refund tag, wallet exactly at locktime', noRefund, L);
