import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const { supabaseAdmin } = await import('../src/config/supabase.js');
const { getProfile } = await import('../src/services/auth.service.js');

test('creates a missing profile with a non-privileged role', async (t) => {
  const authUser = {
    id: 'user-id',
    email: 'user@example.com',
    user_metadata: { full_name: 'Test User', role: 'super_admin' },
  };
  let insertedProfile;
  let lookups = 0;

  t.mock.method(supabaseAdmin, 'from', () => {
    let isInsert = false;
    return {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      insert(profile) {
        isInsert = true;
        insertedProfile = profile;
        return this;
      },
      async maybeSingle() {
        if (isInsert) return { data: insertedProfile, error: null };
        lookups += 1;
        return { data: null, error: null };
      },
    };
  });

  const profile = await getProfile(authUser.id, authUser);

  assert.equal(lookups, 1);
  assert.deepEqual(insertedProfile, {
    id: 'user-id',
    full_name: 'Test User',
    email: 'user@example.com',
    phone: null,
    role: 'consumer',
    is_verified: false,
  });
  assert.equal(profile.id, authUser.id);
});

test('returns an existing profile without changing it', async (t) => {
  const existingProfile = { id: 'user-id', role: 'super_admin', is_active: true };
  let inserts = 0;

  t.mock.method(supabaseAdmin, 'from', () => ({
    select() {
      return this;
    },
    eq() {
      return this;
    },
    insert() {
      inserts += 1;
      return this;
    },
    async maybeSingle() {
      return { data: existingProfile, error: null };
    },
  }));

  assert.equal(await getProfile('user-id', { id: 'user-id' }), existingProfile);
  assert.equal(inserts, 0);
});
