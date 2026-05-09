// Stripe smoke test. Run with: node scripts/stripe_smoke.mjs (after dotenv preload)
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
console.log('STRIPE_SECRET_KEY present?', !!key, key ? key.slice(0, 7) + '...' : '');
if (!key) {
  console.error('No STRIPE_SECRET_KEY in env. Aborting.');
  process.exit(2);
}

const stripe = new Stripe(key);

try {
  const acct = await stripe.accounts.retrieve();
  console.log('Account id:', acct.id);
  console.log('  charges_enabled:', acct.charges_enabled);
  console.log('  details_submitted:', acct.details_submitted);
  console.log('  country:', acct.country);
} catch (e) {
  console.log('accounts.retrieve error:', e.message);
}

try {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Stewardly Smoke Test' },
          unit_amount: 4900,
        },
        quantity: 1,
      },
    ],
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
    client_reference_id: 'smoke-1',
    metadata: { user_id: '1', customer_email: 'smoke@stewardly.app' },
    allow_promotion_codes: true,
  });
  console.log('Checkout session created:', session.id);
  console.log('URL:', session.url);
  console.log('Status:', session.status);
} catch (e) {
  console.log('checkout.sessions.create error:', e.message);
}
