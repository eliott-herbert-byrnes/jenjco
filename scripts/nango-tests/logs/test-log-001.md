# Stage 4 BYO Spike — Outcomes

**Date:** 2026-06-08  
**Nango integration id:** `google-drive`  
**Google app type:** Internal (Workspace)

## Test A — Session overrides
- **Result:** PASS
- **Notes:** `createConnectSession` with `oauth_client_id_override` + `oauth_client_secret_override` → OAuth completed

## Test B — Tag lookup
- **Result:** PASS 
- **organization_id used:** NANGO_SPIKE_ORG_ID
- **Connections returned:** 1
- **nango connection_id:** `b7d601e0-f63b-481c-9db6-ca8baa31db4c` (confirmed ≠ org uuid)
## full terminal note: 
`Test B — connection count: 1
Test B — connection: {
  id: 1793463,
  connection_id: 'b7d601e0-f63b-481c-9db6-ca8baa31db4c',
  provider_config_key: 'google-drive',
  provider: 'google-drive',
  errors: [],
  end_user: null,
  tags: {
    end_user_id: 'spike-admin',
    end_user_email: 'hello@navisdocs.com',
    organization_id: '98ad35ae-d557-4d08-89c8-617c80cfeb54'
  },
  metadata: null,
  created: '2026-06-08T11:33:53.182+00:00'
}

Saved connection_id to C:\Users\eliot\jenjco\scripts\nango-tests\.byo-spike-state.json
Confirm nango connection_id ≠ organization_id: yes`

## full terminal note: 'Test B — connection count: 1

## Test C — Reconnect
- **Result:** PASS 
- **Before reconnect:** 1 connection, id = `b7d601e0-f63b-481c-9db6-ca8baa31db4c`
- **After reconnect:** 1 connection, same id = `b7d601e0-f63b-481c-9db6-ca8baa31db4c`
## full terminal note:
`Test C-verify — connection count: 1
Test C-verify — connection: {
  id: 1793463,
  connection_id: 'b7d601e0-f63b-481c-9db6-ca8baa31db4c',
  provider_config_key: 'google-drive',
  provider: 'google-drive',
  errors: [],
  end_user: null,
  tags: {
    end_user_id: 'spike-admin',
    end_user_email: 'hello@navisdocs.com',
    organization_id: '98ad35ae-d557-4d08-89c8-617c80cfeb54'
  },
  metadata: null,
  created: '2026-06-08T11:33:53.182+00:00'
}
Before reconnect connection_id: b7d601e0-f63b-481c-9db6-ca8baa31db4c
After reconnect connection_id: b7d601e0-f63b-`

## Locked for implementation
- Shared Nango integration id: `google-drive`
- Store Nango `connection_id` in `org_connections.nango_connection_id`
- Re-pass BYO overrides from credentials on both connect and reconnect sessions