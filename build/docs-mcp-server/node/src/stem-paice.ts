// Paice/Lancaster stemmer — an iterative, rule-table-driven stemmer, more
// aggressive than Porter (heavier conflation, editable rules). Included to
// bake off against Porter (src/stem.ts) on the retrieval eval.
//
// Rules use Paice's compact notation, one per line: the leading letters are the
// ending REVERSED; optional `*` = apply only while the word is still intact;
// digits = characters to remove; trailing letters = characters to append;
// `>` = continue (re-scan), `.` = stop. Rule set is the widely-published
// Lancaster default (as used by NLTK's LancasterStemmer).

const RAW_RULES = [
  "ai*2.", "a*1.", "bb1.", "city3s.", "ci2>", "cn1t>", "dd1.", "dei3y>",
  "deec2ss.", "dee1.", "de2>", "dooh4>", "e1>", "feil1v.", "fi2>", "gni3>",
  "gai3y.", "ga2>", "gg1.", "ht*2.", "hsiug5ct.", "hsi3>", "i*1.", "i1y>",
  "ji1d.", "juf1s.", "ju1d.", "jo1d.", "jeh1r.", "jrev1t.", "jsim2t.", "jn1d.",
  "j1s.", "lbaifi6.", "lbai4y.", "lba3>", "lbi3.", "lib2l>", "lc1.", "lufi4y.",
  "luf3>", "lu2.", "lai3>", "lau3>", "la2>", "ll1.", "mui3.", "mu*2.", "msi3>",
  "mm1.", "nois4j>", "noix4ct.", "noi3>", "nai3>", "na2>", "nee0.", "ne2>",
  "nn1.", "pihs4>", "pp1.", "re2>", "rae0.", "ra2.", "ro2>", "ru2>", "rr1.",
  "rt1>", "rei3y>", "sei3y>", "sis2.", "si2>", "ssen4>", "ss0.", "suo3>",
  "su*2.", "s*1>", "s0.", "tacilp4y.", "ta2>", "tnem4>", "tne3>", "tna3>",
  "tpir2b.", "tpro2b.", "tcud1.", "tpmus2.", "tpec2iv.", "tulo2v.", "tsis0.",
  "tsi3>", "tt1.", "uqi3.", "ugo1.", "vis3j>", "vie0.", "vi2>", "ylb1>",
  "yli3y>", "ylp0.", "yl2>", "ygo1.", "yhp1.", "ymo1.", "ypo1.", "yti3>",
  "yte3>", "ytl2.", "yrtsi5.", "yra3>", "yro3>", "yfi3.", "ycn2t>", "yca3>",
  "zi2>", "zy1s.",
];

interface Rule {
  end: string; // actual ending (un-reversed)
  intact: boolean; // apply only if the word is unmodified
  remove: number;
  append: string;
  cont: boolean; // continue re-scanning after applying
}

function parseRule(s: string): Rule {
  let i = 0;
  let rev = "";
  while (i < s.length && s[i] >= "a" && s[i] <= "z") rev += s[i++];
  const intact = s[i] === "*";
  if (intact) i++;
  let num = "";
  while (i < s.length && s[i] >= "0" && s[i] <= "9") num += s[i++];
  let append = "";
  while (i < s.length && s[i] >= "a" && s[i] <= "z") append += s[i++];
  return {
    end: rev.split("").reverse().join(""),
    intact,
    remove: parseInt(num || "0", 10),
    append,
    cont: s[i] === ">",
  };
}

// Group rules by the word's last character (= last char of the ending) for
// fast lookup, preserving Paice's rule order within each group.
const RULES_BY_LAST: Map<string, Rule[]> = (() => {
  const m = new Map<string, Rule[]>();
  for (const raw of RAW_RULES) {
    const r = parseRule(raw);
    const key = r.end[r.end.length - 1];
    (m.get(key) ?? m.set(key, []).get(key)!).push(r);
  }
  return m;
})();

function acceptable(stem: string): boolean {
  if (stem.length === 0) return false;
  if ("aeiou".includes(stem[0])) return stem.length >= 2;
  // consonant start: need >= 3 chars and at least one vowel (y counts)
  if (stem.length < 3) return false;
  for (const c of stem) if ("aeiouy".includes(c)) return true;
  return false;
}

export function stem(word: string): string {
  let w = word.toLowerCase();
  let intact = true;
  for (let guard = 0; guard < 50; guard++) {
    const rules = RULES_BY_LAST.get(w[w.length - 1]);
    if (!rules) return w;
    let applied = false;
    for (const r of rules) {
      if (!w.endsWith(r.end)) continue;
      if (r.intact && !intact) continue;
      const candidate = w.slice(0, w.length - r.remove);
      if (!acceptable(candidate)) return w; // matched ending but unacceptable → stop
      w = candidate + r.append;
      intact = false;
      if (!r.cont) return w;
      applied = true;
      break; // re-scan with the shortened word
    }
    if (!applied) return w;
  }
  return w;
}
