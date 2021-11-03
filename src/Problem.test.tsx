import { sortMods } from "./Problem";

const rwVersion = "1.3";

const modIndex: Record<string, Mod> = {
  "brrainz.harmony": {
    path: "...",
    name: "Harmony",
    packageId: "brrainz.harmony",
    version: "1.1.1.0",
    author: "Andreas Pardeike",
    isCritical: false,
    deps: {
      engines: ["1.2", "1.3"],
      requires: [],
      loadBefore: [{ packageId: "ludeon.rimworld" }],
      loadAfter: [],
      incompatibilities: [],
    },
  },
  "me.samboycoding.betterloading": {
    path: "...",
    name: "BetterLoading",
    packageId: "me.samboycoding.betterloading",
    version: "3.2.0.1",
    author: "Samboy063",
    isCritical: false,
    deps: {
      engines: ["1.0", "1.1", "1.2", "1.3"],
      requires: [{ packageId: "brrainz.harmony" }],
      loadBefore: [
        { packageId: "core", operator: ">=", version: "1.0" },
        { packageId: "startupimpact" },
        { packageId: "ludeon.rimworld" },
        { packageId: "unlimitedhugs.hugslib" },
        { packageId: "automatic.startupimpact" },
      ],
      loadAfter: [{ packageId: "brrainz.harmony" }],
      incompatibilities: [],
    },
  },
  "ludeon.rimworld": {
    path: "...",
    name: "Core",
    packageId: "ludeon.rimworld",
    author: "Ludeon Studios",
    isCritical: true,
    deps: {
      engines: [],
      requires: [],
      loadBefore: [
        { packageId: "ludeon.rimworld.ideology" },
        { packageId: "ludeon.rimworld.royalty" },
      ],
      loadAfter: [],
      incompatibilities: [],
    },
  },
  "ludeon.rimworld.ideology": {
    path: "...",
    name: "Ideology",
    packageId: "ludeon.rimworld.ideology",
    author: "Ludeon Studios",
    isCritical: false,
    deps: {
      engines: ["1.3"],
      requires: [{ packageId: "ludeon.rimworld" }],
      loadBefore: [],
      loadAfter: [{ packageId: "ludeon.rimworld.royalty" }],
      incompatibilities: [],
    },
  },
  "unlimitedhugs.hugslib": {
    path: "...",
    name: "HugsLib",
    packageId: "unlimitedhugs.hugslib",
    author: "UnlimitedHugs",
    isCritical: false,
    deps: {
      engines: ["1.0", "1.1", "1.2", "1.3"],
      requires: [{ packageId: "brrainz.harmony" }],
      loadBefore: [],
      loadAfter: [
        { packageId: "ludeon.rimworld" },
        { packageId: "ludeon.rimworld.royalty" },
        { packageId: "brrainz.harmony" },
      ],
      incompatibilities: [],
    },
  },
  "fluffy.modmanager": {
    path: "...",
    name: "Mod Manager",
    packageId: "fluffy.modmanager",
    version: "3.8.1038",
    author: "Fluffy",
    isCritical: false,
    deps: {
      engines: ["1.0", "1.1", "1.2", "1.3"],
      requires: [
        { packageId: "brrainz.harmony" },
        { packageId: "ludeon.rimworld" },
      ],
      loadBefore: [],
      loadAfter: [{ packageId: "brrainz.harmony" }],
      incompatibilities: [],
    },
  },
  "standalone.a": {
    path: "...",
    name: "Standalone A",
    packageId: "standalone.a",
    version: "1.0",
    author: "n00b",
    isCritical: false,
    deps: {
      engines: [],
      requires: [],
      loadBefore: [],
      loadAfter: [],
      incompatibilities: [],
    },
  },
  "standalone.b": {
    path: "...",
    name: "Standalone B",
    packageId: "standalone.b",
    version: "1.0",
    author: "n00b",
    isCritical: false,
    deps: {
      engines: [],
      requires: [],
      loadBefore: [],
      loadAfter: [],
      incompatibilities: [],
    },
  },
  "standalone.dep": {
    path: "...",
    name: "Standalone Dep",
    packageId: "standalone.dep",
    version: "1.0",
    author: "n00b",
    isCritical: false,
    deps: {
      engines: [],
      requires: [{ packageId: "standalone.lib" }],
      loadBefore: [],
      loadAfter: [],
      incompatibilities: [],
    },
  },
  "badmod.liba": {
    path: "...",
    name: "Bad Mod A",
    packageId: "badmod.liba",
    version: "1.0",
    author: "n00b",
    isCritical: false,
    deps: {
      engines: [],
      requires: [{ packageId: "badmod.libb" }],
      loadBefore: [],
      loadAfter: [],
      incompatibilities: [],
    },
  },
  "badmod.libb": {
    path: "...",
    name: "Bad Mod B",
    packageId: "badmod.libb",
    version: "1.0",
    author: "n00b",
    isCritical: false,
    deps: {
      engines: [],
      requires: [{ packageId: "badmod.liba" }],
      loadBefore: [],
      loadAfter: [],
      incompatibilities: [],
    },
  },
};

const makeList = (ids: Array<string | [string, boolean]>) =>
  ids.map((x) =>
    typeof x === "string" ? ([x, true] as [string, boolean]) : x
  );

describe("sortMods", () => {
  it("works", () => {
    const mods = makeList([
      "brrainz.harmony",
      "unlimitedhugs.hugslib",
      "ludeon.rimworld",
    ]);
    // Note that the loadBefores
    const expected = makeList([
      "brrainz.harmony",
      // Added because it's loadBefore ludeon.rimworld
      ["me.samboycoding.betterloading", false],
      "ludeon.rimworld",
      // Added because hugslib is loadAfter it.
      ["ludeon.rimworld.royalty", false],
      "unlimitedhugs.hugslib",
    ]);
    const actual = sortMods(mods, modIndex, rwVersion);
    expect(actual).toEqual(expected);
  });

  it("preserves relative order 1", () => {
    const mods = makeList(["standalone.a", "standalone.b"]);
    const expected = makeList(["standalone.a", "standalone.b"]);
    const actual = sortMods(mods, modIndex, rwVersion);
    expect(actual).toEqual(expected);
  });
  it("preserves relative order 2", () => {
    const mods = makeList(["standalone.b", "standalone.a"]);
    const expected = makeList(["standalone.b", "standalone.a"]);
    const actual = sortMods(mods, modIndex, rwVersion);
    expect(actual).toEqual(expected);
  });

  it("handles circular dependencies", () => {
    const mods = makeList(["badmod.liba", "badmod.libb"]);
    // It rotates the list around, but doesn't break.
    const expected = makeList(["badmod.libb", "badmod.liba"]);
    const actual = sortMods(mods, modIndex, rwVersion);
    expect(actual).toEqual(expected);
  });

  it("activates hidden mods", () => {
    const mods = makeList([
      ["brrainz.harmony", false],
      "me.samboycoding.betterloading",
    ]);
    const expected = makeList([
      "brrainz.harmony",
      "me.samboycoding.betterloading",
    ]);
    const actual = sortMods(mods, modIndex, rwVersion);
    expect(actual).toEqual(expected);
  });

  it("enables missing mods", () => {
    const mods = makeList(["me.samboycoding.betterloading"]);
    const expected = makeList([
      "brrainz.harmony",
      "me.samboycoding.betterloading",
    ]);
    const actual = sortMods(mods, modIndex, rwVersion);
    expect(actual).toEqual(expected);
  });

  it("enables uninstalled mods", () => {
    const mods = makeList(["standalone.dep"]);
    const expected = makeList(["standalone.lib", "standalone.dep"]);
    const actual = sortMods(mods, modIndex, rwVersion);
    expect(actual).toEqual(expected);
  });
});
