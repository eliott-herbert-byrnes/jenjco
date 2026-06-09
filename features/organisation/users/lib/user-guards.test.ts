import { describe, expect, it } from "vitest"
import { DEMO_ADMIN_EMAIL } from "@/features/auth/constants"
import {
  assertCanDeactivate,
  assertCanInvite,
  assertCanReactivate,
  assertCanRemove,
  assertCanUpdateUser,
  type GuardContext,
  type GuardUser,
} from "./user-guards"

const ctx: GuardContext = {
  adminCount: 2,
  demoAdminEmail: DEMO_ADMIN_EMAIL,
}

function user(overrides: Partial<GuardUser> & Pick<GuardUser, "id">): GuardUser {
  return {
    email: "user@example.com",
    role: "viewer",
    isActive: true,
    ...overrides,
  }
}

const admin = user({ id: "admin-1", email: "admin@example.com", role: "admin" })
const viewer = user({ id: "viewer-1", email: "viewer@example.com", role: "viewer" })
const inactiveAdmin = user({
  id: "inactive-admin",
  email: "inactive@example.com",
  role: "admin",
  isActive: false,
})
const demoAdmin = user({
  id: "demo-admin",
  email: DEMO_ADMIN_EMAIL,
  role: "admin",
})
const lastAdminCtx: GuardContext = { adminCount: 1, demoAdminEmail: DEMO_ADMIN_EMAIL }

describe("non-admin actor", () => {
  it("blocks invite", () => {
    expect(assertCanInvite(viewer, { email: "new@example.com", role: "viewer" })).toEqual({
      ok: false,
      code: "FORBIDDEN",
      message: "Admin access required",
    })
  })

  it("blocks update", () => {
    expect(
      assertCanUpdateUser(viewer, admin, { displayName: "Updated" }, ctx)
    ).toMatchObject({ ok: false, code: "FORBIDDEN" })
  })

  it("blocks deactivate", () => {
    expect(assertCanDeactivate(viewer, admin, ctx)).toMatchObject({
      ok: false,
      code: "FORBIDDEN",
    })
  })

  it("blocks reactivate", () => {
    expect(
      assertCanReactivate(viewer, user({ id: "inactive", isActive: false }))
    ).toMatchObject({ ok: false, code: "FORBIDDEN" })
  })

  it("blocks remove", () => {
    expect(assertCanRemove(viewer, admin, ctx)).toMatchObject({
      ok: false,
      code: "FORBIDDEN",
    })
  })
})

describe("inactive admin actor", () => {
  it("blocks invite", () => {
    expect(
      assertCanInvite(inactiveAdmin, { email: "new@example.com", role: "viewer" })
    ).toMatchObject({ ok: false, code: "INACTIVE_ACTOR" })
  })
})

describe("assertCanInvite", () => {
  it("allows active admin to invite", () => {
    expect(
      assertCanInvite(admin, { email: "new@example.com", role: "viewer" })
    ).toEqual({ ok: true })
  })
})

describe("assertCanUpdateUser", () => {
  it("allows admin to update another user", () => {
    expect(
      assertCanUpdateUser(admin, viewer, { role: "admin", displayName: "Pat" }, ctx)
    ).toEqual({ ok: true })
  })

  it("allows admin to update own display name", () => {
    expect(
      assertCanUpdateUser(admin, admin, { displayName: "Admin Name" }, ctx)
    ).toEqual({ ok: true })
  })

  it("blocks self role change", () => {
    expect(
      assertCanUpdateUser(admin, admin, { role: "viewer" }, ctx)
    ).toMatchObject({ ok: false, code: "SELF_ROLE_CHANGE" })
  })

  it("blocks demoting the last admin", () => {
    expect(
      assertCanUpdateUser(
        admin,
        user({ id: "solo-admin", role: "admin" }),
        { role: "viewer" },
        lastAdminCtx
      )
    ).toMatchObject({ ok: false, code: "LAST_ADMIN" })
  })

  it("blocks mutating the demo admin", () => {
    expect(
      assertCanUpdateUser(admin, demoAdmin, { displayName: "Hacked" }, ctx)
    ).toMatchObject({ ok: false, code: "DEMO_ADMIN_PROTECTED" })
  })
})

describe("assertCanDeactivate", () => {
  it("allows admin to deactivate another user", () => {
    expect(assertCanDeactivate(admin, viewer, ctx)).toEqual({ ok: true })
  })

  it("blocks self-deactivate", () => {
    expect(assertCanDeactivate(admin, admin, ctx)).toMatchObject({
      ok: false,
      code: "SELF_DEACTIVATE",
    })
  })

  it("blocks deactivating the demo admin", () => {
    expect(assertCanDeactivate(admin, demoAdmin, ctx)).toMatchObject({
      ok: false,
      code: "DEMO_ADMIN_PROTECTED",
    })
  })

  it("blocks deactivating the last admin", () => {
    expect(
      assertCanDeactivate(
        user({ id: "other-admin", role: "admin", email: "other@example.com" }),
        user({ id: "solo-admin", role: "admin" }),
        lastAdminCtx
      )
    ).toMatchObject({ ok: false, code: "LAST_ADMIN" })
  })
})

describe("assertCanReactivate", () => {
  it("allows admin to reactivate an inactive user", () => {
    expect(
      assertCanReactivate(admin, user({ id: "inactive", isActive: false }))
    ).toEqual({ ok: true })
  })

  it("fails if user is already active", () => {
    expect(assertCanReactivate(admin, viewer)).toMatchObject({
      ok: false,
      code: "ALREADY_ACTIVE",
    })
  })
})

describe("assertCanRemove", () => {
  it("allows admin to remove another user", () => {
    expect(assertCanRemove(admin, viewer, ctx)).toEqual({ ok: true })
  })

  it("blocks self-remove", () => {
    expect(assertCanRemove(admin, admin, ctx)).toMatchObject({
      ok: false,
      code: "SELF_REMOVE",
    })
  })

  it("blocks removing the demo admin", () => {
    expect(assertCanRemove(admin, demoAdmin, ctx)).toMatchObject({
      ok: false,
      code: "DEMO_ADMIN_PROTECTED",
    })
  })

  it("blocks removing the last admin", () => {
    expect(
      assertCanRemove(
        user({ id: "other-admin", role: "admin", email: "other@example.com" }),
        user({ id: "solo-admin", role: "admin" }),
        lastAdminCtx
      )
    ).toMatchObject({ ok: false, code: "LAST_ADMIN" })
  })
})
