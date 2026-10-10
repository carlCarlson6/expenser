import { afterEach, describe, expect, it } from "vitest";

import { requireAdminKey } from "@/shared/auth/admin";

function request(key: string | null) {
  return new Request("http://localhost:3000/api/admin", {
    method: "POST",
    headers: key === null ? {} : { "x-admin-key": key },
  });
}

afterEach(() => {
  delete process.env.ADMIN_API_KEY;
});

describe("requireAdminKey", () => {
  it("accepts the configured key", () => {
    process.env.ADMIN_API_KEY = "s3cret";
    expect(requireAdminKey(request("s3cret"))).toEqual({ ok: true });
  });

  it("rejects a wrong or missing key with 401", () => {
    process.env.ADMIN_API_KEY = "s3cret";
    expect(requireAdminKey(request("wrong"))).toEqual({
      ok: false,
      status: 401,
      error: "unauthorized",
    });
    expect(requireAdminKey(request(null))).toEqual({
      ok: false,
      status: 401,
      error: "unauthorized",
    });
  });

  it("rejects a key that is a prefix of the configured one", () => {
    process.env.ADMIN_API_KEY = "s3cret-long";
    expect(requireAdminKey(request("s3cret"))).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("disables the endpoint when no key is configured", () => {
    delete process.env.ADMIN_API_KEY;
    expect(requireAdminKey(request("anything"))).toEqual({
      ok: false,
      status: 503,
      error: "adminApiDisabled",
    });
  });
});