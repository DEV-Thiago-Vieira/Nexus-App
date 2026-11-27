import { test } from "node:test";
import assert from "node:assert/strict";
import { nextTheme, parseTheme, resolveTheme, THEME_KEY, themeScript } from "./theme.ts";

test("parseTheme aceita só light ou dark", () => {
  assert.equal(parseTheme("light"), "light");
  assert.equal(parseTheme("dark"), "dark");
  assert.equal(parseTheme("blue"), null);
  assert.equal(parseTheme(null), null);
});

test("resolveTheme: preferência salva vence; sem ela, segue o sistema", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme(null, false), "light");
  assert.equal(resolveTheme("lixo", true), "dark");
});

test("nextTheme alterna", () => {
  assert.equal(nextTheme("light"), "dark");
  assert.equal(nextTheme("dark"), "light");
});

const runScript = (saved: string | null, systemDark: boolean, storageFails = false) => {
  const attrs: Record<string, string> = {};
  const localStorage = {
    getItem: (key: string) => {
      if (storageFails) throw new Error("bloqueado");
      return key === THEME_KEY ? saved : null;
    },
  };
  const matchMedia = () => ({ matches: systemDark });
  const document = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
  new Function("localStorage", "matchMedia", "document", themeScript)(localStorage, matchMedia, document);
  return attrs["data-theme"];
};

test("themeScript aplica o mesmo tema que resolveTheme antes da página aparecer", () => {
  assert.equal(runScript("dark", false), "dark");
  assert.equal(runScript("light", true), "light");
  assert.equal(runScript(null, true), "dark");
  assert.equal(runScript(null, false), "light");
  assert.equal(runScript("lixo", false), "light");
  assert.equal(runScript(null, true, true), undefined);
});
