import { describe, expect, it } from "vitest";
import { parsePublicEnvironment } from "../../lib/env/schema";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic",
};
const jwt = (role: string) =>
  `header.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;

describe("public Supabase environment boundary", () => {
  it("returns only allowlisted values", () => {
    expect(
      parsePublicEnvironment({
        ...valid,
        DEEPSEEK_API_KEY: "private-sentinel",
        SUPABASE_SECRET_KEY: "private-sentinel",
      }),
    ).toEqual(valid);
  });
  it("accepts local development anon keys", () => {
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt("anon"),
      }),
    ).not.toThrow();
  });
  it.each([
    "sb_secret_private-sentinel",
    jwt("service_role"),
    "not-a-key",
    "sb_publishable_replace_me",
  ])("rejects elevated or invalid key %s", (key) => {
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });
  it.each([
    "http://remote.example",
    "ftp://example.com",
    "https://user:secret@example.com",
    "https://example.com/path",
    "https://example.com?key=secret",
    "https://your-project.supabase.co",
  ])("rejects unsafe or placeholder URL %s", (url) => {
    expect(() =>
      parsePublicEnvironment({ ...valid, NEXT_PUBLIC_SUPABASE_URL: url }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });
  it("reports variable names without printing supplied secrets", () => {
    try {
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "private-sentinel",
      });
      expect.fail("Expected validation failure");
    } catch (error) {
      expect(String(error)).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect(String(error)).not.toContain("private-sentinel");
    }
  });
});
