# SkillID Integration URLs

## Base URL

Production SkillID lives at whatever `PUBLIC_BASE_URL` is set to in the
environment. For production funnels:

```
PUBLIC_BASE_URL=https://skillid.possibletraining.com
```

Every URL below is relative to that base. Use `server/urls.ts` (`pathUrl`,
`handoffUrl`) server-side if you need to build these in code.

## Free-claim → Integration Hub

SkillID never calls RealSkill directly. When `/gateway` decides a visit is a
`free_claim`, it calls the helper `grantSkillIdAccessViaHub(user, path)`
([server/hub.ts](../server/hub.ts)) before any session update. Only on
success does SkillID set `freeSkillIdClaimed=true` and push the path slug
into `ownedSkillIds`, then redirect to `/challenge/:slug`. On failure the
user is sent back to `/paths/:slug?access=grant_failed` with a retry
message.

### Future real request

```
POST ${INTEGRATION_HUB_URL}/api/skillid/grant-access
Authorization: Bearer ${INTEGRATION_HUB_API_KEY}
Content-Type: application/json

{
  "realskillUserId": "<sub>",
  "email": "<email>",
  "skillPathSlug": "<path.slug>",
  "courseSlug": "<path.courseSlug>",
  "source": "skillid_free_claim"
}
```

`courseSlug` lives on each Skill Path in [server/paths.ts](../server/paths.ts)
and tells Hub which RealSkill course to grant (e.g. `manipulationmastery`).

### Stub mode

If either `INTEGRATION_HUB_URL` or `INTEGRATION_HUB_API_KEY` is unset, the
helper logs the payload and returns mock success. Local and preview
environments run in stub mode by default.

## Two RealSkill destinations

SkillID sends users to two different RealSkill URLs depending on their
entitlement state:

### Blocked → "Unlock This Skill Path" CTA (`REALSKILL_REACTIVATE_URL`)

When a user hits a blocked Skill Path (already claimed their free one, not a
member, no ownership), the "Unlock This Skill Path" CTA on `/paths/:slug`
sends them to `REALSKILL_REACTIVATE_URL`:

```
REALSKILL_REACTIVATE_URL=https://possibletraining.com/pages/free-courses
```

That page is the Skill ID catalog where non-members can claim or purchase
access.

### Allowed → "Train Inside RealSkill" CTA (per-day `realskillUrl`)

When a user is actively training a Skill Path they have access to, the
primary CTA on the current-day card links to `day.realskillUrl`. For the
current registry, every Skill ID points to the RealSkill Skill ID dashboard:

```
https://app.possibletraining.com/dashboard/skill-id
```

This is the RealSkill destination for users who already have access and are
executing training. Edit per-day in [server/paths.ts](../server/paths.ts) if
a specific day needs to deep-link to a different page.

## 1. Shopify → SkillID (public, no auth)

From the Shopify Skill ID sales page or any public marketing surface, link
directly to the public path page. No token, no session required.

```
https://skillid.possibletraining.com/paths/<slug>
```

Examples:

```
https://skillid.possibletraining.com/paths/one-skill-at-a-time
https://skillid.possibletraining.com/paths/handles-foundation
```

The CTA on that page ("Start Your Skill Path") routes the visitor through
`/gateway`, which handles auth + access checks and drops them into
`/challenge/<slug>`.

## 2. RealSkill → SkillID (authenticated handoff)

When a user is already signed in to RealSkill (trial, member, or entitled via
Shopify purchase), RealSkill mints a short-lived HS256 JWT signed with the
shared `REALSKILL_JWT_SECRET` and redirects the browser to:

```
https://skillid.possibletraining.com/auth/exchange?t=<TOKEN>&next=<ENCODED_NEXT>
```

### Required token claims

```
{
  "sub": "<realskill-user-id>",
  "email": "<user email>",
  "iss": "realskill",
  "aud": "skillid",
  "exp": <unix-seconds, 5 min out>,
  "jti": "<uuid>",
  "access": {
    "state": "trial" | "member" | "expired" | "none",
    "freeSkillIdClaimed": <boolean>,
    "ownedSkillIds": ["<slug>", ...]
  }
}
```

### Entitlement rules applied by `/gateway`

- `state=member` → access to any path.
- `state=trial` → access to the onboarding path (the one flagged `isOnboarding`) plus any `ownedSkillIds`.
- `state=expired` or `state=none` → access only to paths in `ownedSkillIds`.
- If `freeSkillIdClaimed=false` and `ownedSkillIds` is empty, the selected path is granted as the user's one free Skill Path and added to `ownedSkillIds` in the SkillID session.
- If `freeSkillIdClaimed=true` and the selected path is not in `ownedSkillIds`, the gateway sends the user back to `/paths/:slug?access=blocked` with an access message.

### Canonical handoff URL format

To drop the user directly into a specific Skill Path:

```
/auth/exchange?t=<TOKEN>&next=%2Fgateway%3Fpath%3D<slug>
```

The `next` parameter must be URL-encoded — note `%2F` for `/` and `%3F` for
`?`, `%3D` for `=`. Decoded, `next` equals:

```
/gateway?path=<slug>
```

Full production example:

```
https://skillid.possibletraining.com/auth/exchange
  ?t=eyJhbGciOiJIUzI1NiIs...
  &next=%2Fgateway%3Fpath%3Done-skill-at-a-time
```

After exchange, SkillID sets its own `skillid_session` cookie and 302s to the
`next` URL.

## 3. Local testing

Mint a valid dev token and print a ready-to-open URL:

```
REALSKILL_JWT_SECRET=test-secret npm run mint-token
```

Defaults: `state=trial`, `freeSkillIdClaimed=false`, `ownedSkillIds=[]`, path
`one-skill-at-a-time`. Override with env vars to exercise each routing
branch:

```
# expired user with no purchases — first visit is a free claim
TEST_STATE=expired TEST_FREE_CLAIMED=false TEST_OWNED= npm run mint-token

# expired user who already claimed free — blocked on a non-owned path
TEST_STATE=expired TEST_FREE_CLAIMED=true TEST_OWNED= TEST_PATH=handles-foundation npm run mint-token

# expired user who owns a specific path
TEST_STATE=expired TEST_FREE_CLAIMED=true TEST_OWNED=handles-foundation TEST_PATH=handles-foundation npm run mint-token

# member — access to anything
TEST_STATE=member TEST_PATH=handles-foundation npm run mint-token
```

Paste the printed URL into a browser running against `http://localhost:3000`.
