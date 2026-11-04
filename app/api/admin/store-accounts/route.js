import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdmin } from '@/lib/adminauth';
import { hashPassword } from '@/lib/storeauth';

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function newPassword() {
  let s = '';
  for (let i = 0; i < 10; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return s;
}

const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  if (!(await isAdmin())) return fail('Unauthorized', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('Invalid request');
  }

  const action = String(body.action || '');

  if (action === 'create') {
    const storeId = String(body.storeId || '');
    const username = String(body.username || '').trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
      return fail('Username must be 3-30 characters: letters, numbers, dot, dash or underscore');
    }

    const { data: store } = await supabaseAdmin.from('stores').select('id').eq('id', storeId).maybeSingle();
    if (!store) return fail('Store not found');

    const { data: existing } = await supabaseAdmin
      .from('store_accounts')
      .select('id')
      .eq('store_id', storeId)
      .maybeSingle();
    if (existing) return fail('This store already has an account');

    const password = newPassword();
    const { error } = await supabaseAdmin
      .from('store_accounts')
      .insert({ store_id: storeId, username, password_hash: hashPassword(password) });

    if (error) {
      if (error.code === '23505') return fail('Username already taken');
      return fail('Could not create account', 500);
    }
    return NextResponse.json({ username, password });
  }

  if (action === 'reset') {
    const accountId = String(body.accountId || '');
    const { data: account } = await supabaseAdmin
      .from('store_accounts')
      .select('id, username')
      .eq('id', accountId)
      .maybeSingle();
    if (!account) return fail('Account not found');

    const password = newPassword();
    const { error } = await supabaseAdmin
      .from('store_accounts')
      .update({ password_hash: hashPassword(password) })
      .eq('id', accountId);
    if (error) return fail('Could not reset password', 500);
    return NextResponse.json({ username: account.username, password });
  }

  if (action === 'toggle') {
    const accountId = String(body.accountId || '');
    const { data: account } = await supabaseAdmin
      .from('store_accounts')
      .select('id, is_active')
      .eq('id', accountId)
      .maybeSingle();
    if (!account) return fail('Account not found');

    const { error } = await supabaseAdmin
      .from('store_accounts')
      .update({ is_active: !account.is_active })
      .eq('id', accountId);
    if (error) return fail('Could not update account', 500);
    return NextResponse.json({ ok: true, is_active: !account.is_active });
  }

  return fail('Unknown action');
}
