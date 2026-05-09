/**
 * PlaidService — Bank Account Linking via Plaid
 *
 * Live-only: requires PLAID_CLIENT_ID and PLAID_SECRET. Throws on missing creds
 * (no mock/stub fallback) because production cannot serve fake bank data.
 */
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";
import { ENV } from "../_core/env";

const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

function buildClient(): PlaidApi {
  if (!ENV.plaidClientId || !ENV.plaidSecret) {
    throw new Error(
      "Plaid is not configured: set PLAID_CLIENT_ID and PLAID_SECRET in environment.",
    );
  }
  const configuration = new Configuration({
    basePath:
      PLAID_ENV === "production"
        ? PlaidEnvironments.production
        : PLAID_ENV === "development"
          ? PlaidEnvironments.development
          : PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": ENV.plaidClientId,
        "PLAID-SECRET": ENV.plaidSecret,
      },
    },
  });
  return new PlaidApi(configuration);
}

let plaidClient: PlaidApi | null = null;
function getClient(): PlaidApi {
  if (!plaidClient) plaidClient = buildClient();
  return plaidClient;
}

// ─── Link Token ─────────────────────────────────────────────────────────────

export interface CreateLinkTokenParams {
  userId: string;
  clientName?: string;
  products?: Products[];
  redirectUri?: string;
}

export async function createLinkToken(params: CreateLinkTokenParams): Promise<{
  linkToken: string;
  expiration: string;
  requestId: string;
}> {
  const client = getClient();
  const response = await client.linkTokenCreate({
    user: { client_user_id: params.userId },
    client_name: params.clientName || "Stewardly AI",
    products: params.products || [Products.Transactions, Products.Auth],
    country_codes: [CountryCode.Us],
    language: "en",
    redirect_uri: params.redirectUri,
  });
  return {
    linkToken: response.data.link_token,
    expiration: response.data.expiration,
    requestId: response.data.request_id,
  };
}

// ─── Token Exchange ─────────────────────────────────────────────────────────

export async function exchangePublicToken(publicToken: string): Promise<{
  accessToken: string;
  itemId: string;
}> {
  const client = getClient();
  const response = await client.itemPublicTokenExchange({ public_token: publicToken });
  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  };
}

// ─── Accounts ───────────────────────────────────────────────────────────────

export interface PlaidAccount {
  accountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balanceCurrent: number | null;
  balanceAvailable: number | null;
  currencyCode: string | null;
}

export async function getAccounts(accessToken: string): Promise<{
  accounts: PlaidAccount[];
}> {
  const client = getClient();
  const response = await client.accountsGet({ access_token: accessToken });
  return {
    accounts: response.data.accounts.map((a) => ({
      accountId: a.account_id,
      name: a.name,
      officialName: a.official_name,
      type: a.type,
      subtype: a.subtype,
      mask: a.mask,
      balanceCurrent: a.balances.current,
      balanceAvailable: a.balances.available,
      currencyCode: a.balances.iso_currency_code,
    })),
  };
}

// ─── Transactions ───────────────────────────────────────────────────────────

export interface PlaidTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[];
  pending: boolean;
}

export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string,
): Promise<{
  transactions: PlaidTransaction[];
  totalTransactions: number;
}> {
  const client = getClient();
  const response = await client.transactionsGet({
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
    options: { count: 100, offset: 0 },
  });
  return {
    transactions: response.data.transactions.map((t) => ({
      transactionId: t.transaction_id,
      accountId: t.account_id,
      amount: t.amount,
      date: t.date,
      name: t.name,
      merchantName: t.merchant_name ?? null,
      category: t.category ?? [],
      pending: t.pending,
    })),
    totalTransactions: response.data.total_transactions,
  };
}

// ─── Balance ────────────────────────────────────────────────────────────────

export async function getBalances(accessToken: string): Promise<{
  accounts: PlaidAccount[];
}> {
  const client = getClient();
  const response = await client.accountsBalanceGet({ access_token: accessToken });
  return {
    accounts: response.data.accounts.map((a) => ({
      accountId: a.account_id,
      name: a.name,
      officialName: a.official_name,
      type: a.type,
      subtype: a.subtype,
      mask: a.mask,
      balanceCurrent: a.balances.current,
      balanceAvailable: a.balances.available,
      currencyCode: a.balances.iso_currency_code,
    })),
  };
}

// ─── Health Check ───────────────────────────────────────────────────────────

export function isPlaidConfigured(): boolean {
  return !!(ENV.plaidClientId && ENV.plaidSecret);
}

export function getPlaidEnvironment(): string {
  return PLAID_ENV;
}
