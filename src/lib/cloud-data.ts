export const CLIENTS_STORAGE_KEY = "iptv-client-manager.clients.v1";
export const PANELS_STORAGE_KEY = "iptv-client-manager.panels.v1";

export const DEFAULT_PANELS = [
  "Atmos",
  "Cinemax",
  "Luma TV",
  "Nexus",
  "Espace One Play",
  "Slim Plus",
  "Aura TV+",
] as const;

export type PanelName = string;
export type CustomerAccountStatus = "active" | "inactive";

export type Client = {
  id: string;
  name: string;
  phone: string;
  panel: PanelName;
  panelNumber: string;
  username: string;
  password: string;
  purchaseDate: string;
  expirationDate: string;
  plan: string;
  app?: string;
  customerStatus?: CustomerAccountStatus;
  renewalLink?: string;
  price?: string;
  accountCreatedAt?: string;
  connections?: string;
  notes: string;
  createdAt: string;
};

export type ClientFields = Omit<Client, "id" | "createdAt">;

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: { id: string; email: string };
};

const SESSION_STORAGE_KEY = "iptv-client-manager.auth-session.v1";
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ??
  "https://jgzclfpkklxozwiysxoq.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "sb_publishable_f75B8TZoEgnH_gXMNqnQmQ_a5D25H3m";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: { id?: string; email?: string | null };
};

type ClientRow = {
  id: string;
  name: string;
  phone: string;
  panel: string;
  panel_number: string;
  username: string;
  password: string;
  purchase_date: string;
  expiration_date: string;
  plan: string;
  app: string | null;
  customer_status: CustomerAccountStatus;
  renewal_link: string | null;
  price: string | null;
  account_created_at: string | null;
  connections: string | null;
  notes: string;
  created_at: string;
};

type PanelRow = { name: string };

function getErrorMessage(body: unknown, fallback: string) {
  if (typeof body === "object" && body !== null) {
    const error = body as Record<string, unknown>;
    const message = error["msg"] ?? error["message"] ?? error["error_description"] ?? error["error"];
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

async function readResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function authRequest(path: string, body: Record<string, unknown>) {
  if (!isSupabaseConfigured) throw new Error("O banco de dados ainda não foi configurado.");

  const response = await fetch(supabaseUrl + "/auth/v1/" + path, {
    method: "POST",
    headers: { apikey: supabaseKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(result, "Não foi possível concluir o acesso."));
  return result as AuthResponse;
}

function saveSession(data: AuthResponse): AuthSession | null {
  const user = data.user;
  if (!data.access_token || !data.refresh_token || !user?.id) return null;

  const session: AuthSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: (data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600)) * 1000,
    user: { id: user.id, email: user.email ?? "" },
  };
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

function readSession(): AuthSession | null {
  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as AuthSession;
    return session.accessToken && session.refreshToken && session.user?.id ? session : null;
  } catch {
    return null;
  }
}

function clearSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function signIn(email: string, password: string) {
  const response = await authRequest("token?grant_type=password", { email, password });
  const session = saveSession(response);
  if (!session) throw new Error("O acesso foi concluído, mas a sessão não foi retornada. Tente novamente.");
  return session;
}

export async function signUp(email: string, password: string) {
  const response = await authRequest("signup", { email, password });
  const session = saveSession(response);
  return { session, confirmationRequired: !session };
}

let refreshInProgress: Promise<AuthSession | null> | null = null;

async function refreshSession(session: AuthSession): Promise<AuthSession | null> {
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = (async () => {
    try {
      const response = await authRequest("token?grant_type=refresh_token", {
        refresh_token: session.refreshToken,
      });
      return saveSession(response);
    } catch {
      clearSession();
      return null;
    } finally {
      refreshInProgress = null;
    }
  })();

  return refreshInProgress;
}

export async function restoreSession() {
  const session = readSession();
  if (!session) return null;
  if (session.expiresAt > Date.now() + 60_000) return session;
  return refreshSession(session);
}

async function currentSession() {
  const session = readSession();
  if (!session) throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  if (session.expiresAt > Date.now() + 60_000) return session;

  const refreshed = await refreshSession(session);
  if (!refreshed) throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  return refreshed;
}

export async function signOut() {
  const session = readSession();
  clearSession();
  if (!session || !isSupabaseConfigured) return;

  try {
    await fetch(supabaseUrl + "/auth/v1/logout?scope=local", {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: "Bearer " + session.accessToken,
      },
    });
  } catch {
    // The local session is already cleared, so logout still completes offline.
  }
}

async function databaseRequest<T>(table: string, query: string, init: RequestInit = {}): Promise<T> {
  const session = await currentSession();
  const headers = new Headers(init.headers);
  headers.set("apikey", supabaseKey);
  headers.set("Authorization", "Bearer " + session.accessToken);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (init.method && init.method !== "GET") {
    const preferences = headers.get("Prefer");
    headers.set("Prefer", preferences ? preferences + ",return=representation" : "return=representation");
  }

  const response = await fetch(supabaseUrl + "/rest/v1/" + table + query, { ...init, headers });
  const result = await readResponse(response);
  if (!response.ok) throw new Error(getErrorMessage(result, "Não foi possível sincronizar seus dados."));
  return result as T;
}

function fromClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    panel: row.panel,
    panelNumber: row.panel_number,
    username: row.username,
    password: row.password,
    purchaseDate: row.purchase_date,
    expirationDate: row.expiration_date.replace(" ", "T"),
    plan: row.plan,
    app: row.app ?? "",
    customerStatus: row.customer_status,
    renewalLink: row.renewal_link ?? "",
    price: row.price ?? "",
    accountCreatedAt: row.account_created_at?.replace(" ", "T") ?? "",
    connections: row.connections ?? "",
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function toClientRow(client: ClientFields) {
  return {
    name: client.name,
    phone: client.phone,
    panel: client.panel,
    panel_number: client.panelNumber,
    username: client.username,
    password: client.password,
    purchase_date: client.purchaseDate,
    expiration_date: client.expirationDate.replace("T", " "),
    plan: client.plan,
    app: client.app || null,
    customer_status: client.customerStatus ?? "active",
    renewal_link: client.renewalLink || null,
    price: client.price || null,
    account_created_at: client.accountCreatedAt?.replace("T", " ") || null,
    connections: client.connections || null,
    notes: client.notes,
  };
}

export async function loadCloudData() {
  const [clientRows, panelRows] = await Promise.all([
    databaseRequest<ClientRow[]>("clients", "?select=*&order=created_at.desc"),
    databaseRequest<PanelRow[]>("panels", "?select=name&order=created_at.asc"),
  ]);
  return { clients: clientRows.map(fromClientRow), panels: panelRows.map((panel) => panel.name) };
}

export async function createClient(fields: ClientFields) {
  const rows = await databaseRequest<ClientRow[]>("clients", "?select=*", {
    method: "POST",
    body: JSON.stringify(toClientRow(fields)),
  });
  const row = rows[0];
  if (!row) throw new Error("O cadastro não foi retornado pelo banco.");
  return fromClientRow(row);
}

export async function updateClient(client: Client) {
  const rows = await databaseRequest<ClientRow[]>("clients", "?id=eq." + encodeURIComponent(client.id) + "&select=*", {
    method: "PATCH",
    body: JSON.stringify(toClientRow(client)),
  });
  const row = rows[0];
  if (!row) throw new Error("O cadastro não foi encontrado para atualização.");
  return fromClientRow(row);
}

export async function removeClient(clientId: string) {
  await databaseRequest<null>("clients", "?id=eq." + encodeURIComponent(clientId), { method: "DELETE" });
}

export async function createPanel(panelName: string) {
  const rows = await databaseRequest<PanelRow[]>("panels", "?select=name", {
    method: "POST",
    body: JSON.stringify({ name: panelName }),
  });
  if (!rows[0]) throw new Error("O painel não foi retornado pelo banco.");
  return rows[0].name;
}

export async function importLocalData(clients: Client[], panelNames: string[], existingPanels: string[]) {
  const existing = new Set(existingPanels.map((name) => name.toLocaleLowerCase("pt-BR")));
  const panelsToAdd: string[] = [];
  for (const name of [...panelNames, ...clients.map((client) => client.panel)]) {
    const normalized = name.trim();
    if (!normalized || existing.has(normalized.toLocaleLowerCase("pt-BR"))) continue;
    panelsToAdd.push(normalized);
    existing.add(normalized.toLocaleLowerCase("pt-BR"));
  }

  if (panelsToAdd.length > 0) {
    await databaseRequest<PanelRow[]>("panels", "?on_conflict=user_id,name&select=name", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify(panelsToAdd.map((name) => ({ name }))),
    });
  }

  if (clients.length === 0) return [];
  const rows = await databaseRequest<ClientRow[]>("clients", "?select=*", {
    method: "POST",
    body: JSON.stringify(clients.map((client) => toClientRow(client))),
  });
  return rows.map(fromClientRow);
}

export function readLegacyData() {
  let clients: Client[] = [];
  let panels: string[] = [...DEFAULT_PANELS];

  try {
    const savedClients = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (savedClients) {
      const parsed = JSON.parse(savedClients) as unknown;
      if (Array.isArray(parsed)) {
        clients = parsed.filter((client): client is Client => {
          if (typeof client !== "object" || client === null) return false;
          const value = client as Partial<Client>;
          return typeof value.id === "string" && typeof value.name === "string" &&
            typeof value.panel === "string" && typeof value.username === "string" &&
            typeof value.password === "string" && typeof value.expirationDate === "string";
        });
      }
    }
  } catch {
    // Invalid legacy data is left untouched and is never uploaded automatically.
  }

  try {
    const savedPanels = window.localStorage.getItem(PANELS_STORAGE_KEY);
    if (savedPanels) {
      const parsed = JSON.parse(savedPanels) as unknown;
      if (Array.isArray(parsed)) {
        const names = new Set<string>(DEFAULT_PANELS.map((panel) => panel.toLocaleLowerCase("pt-BR")));
        for (const item of parsed) {
          if (typeof item !== "string") continue;
          const name = item.trim().slice(0, 40);
          const key = name.toLocaleLowerCase("pt-BR");
          if (name && !names.has(key)) {
            panels.push(name);
            names.add(key);
          }
        }
      }
    }
  } catch {
    // Invalid legacy data is left untouched and is never uploaded automatically.
  }

  return { clients, panels };
}

