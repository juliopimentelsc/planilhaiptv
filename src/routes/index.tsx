import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Check,
  ChevronDown, CircleAlert, Clock3, Copy, Database, Eye, EyeOff, LayoutDashboard,
  Menu, MessageCircle, Pencil, Plus, Search, Server, ShieldCheck, Trash2, Tv,
  UsersRound, X, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

export const Route = createFileRoute("/")({ component: Index });

const DEFAULT_PANELS = ["Atmos", "Cinemax", "Luma TV", "Nexus", "Espace One Play", "Slim Plus", "Aura TV+"] as const;
const STORAGE_KEY = "iptv-client-manager.clients.v1";
const PANELS_STORAGE_KEY = "iptv-client-manager.panels.v1";

type PanelName = string;
type Page = "overview" | "clients" | "panels";
type ClientStatus = "active" | "expiring" | "expired";
type StatusFilter = "all" | ClientStatus;
type CustomerAccountStatus = "active" | "inactive";
type CustomerAccountFilter = "all" | CustomerAccountStatus;

type Client = {
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

type ClientFields = Omit<Client, "id" | "createdAt">;

function todayIso() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

function toDateTimeLocal(value: string, endOfDay = false) {
  if (!value) return "";
  if (value.includes("T")) return value;
  return value + (endOfDay ? "T23:59:59" : "T00:00:00");
}

const EMPTY_FORM: ClientFields = {
  name: "", phone: "", panel: "Atmos", panelNumber: "", username: "", password: "",
  purchaseDate: todayIso(), expirationDate: "", plan: "", app: "", customerStatus: "active",
  renewalLink: "", price: "", accountCreatedAt: "", connections: "", notes: "",
};

function normalizePanelNames(value: unknown): PanelName[] {
  const unique = new Map<string, string>();
  DEFAULT_PANELS.forEach((panel) => unique.set(panel.toLocaleLowerCase("pt-BR"), panel));
  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item !== "string") return;
      const panel = item.trim().slice(0, 40);
      const key = panel.toLocaleLowerCase("pt-BR");
      if (panel && !unique.has(key)) unique.set(key, panel);
    });
  }
  return Array.from(unique.values());
}

function dateOrdinal(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Math.floor(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

function daysUntil(value: string) {
  return dateOrdinal(value) - dateOrdinal(todayIso());
}

function getClientStatus(client: Client): ClientStatus {
  const remaining = daysUntil(client.expirationDate);
  if (remaining < 0) return "expired";
  if (remaining <= 7) return "expiring";
  return "active";
}

function formatDate(value: string) {
  if (!value) return "—";
  const [date, time] = value.split("T");
  const [year, month, day] = (date ?? value).split("-");
  return day + "/" + month + "/" + year + (time ? " " + time : "");
}

function safeHttpUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function expirationLabel(value: string) {
  const remaining = daysUntil(value);
  if (remaining < 0) {
    const days = Math.abs(remaining);
    return "Expirou há " + days + (days === 1 ? " dia" : " dias");
  }
  if (remaining === 0) return "Vence hoje";
  if (remaining === 1) return "Vence amanhã";
  return "Vence em " + remaining + " dias";
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "CL";
}

function isClient(value: unknown): value is Client {
  if (typeof value !== "object" || value === null) return false;
  const client = value as Record<string, unknown>;
  return typeof client["id"] === "string" &&
    typeof client["name"] === "string" &&
    typeof client["panel"] === "string" &&
    client["panel"] !== "" &&
    typeof client["phone"] === "string" &&
    typeof client["panelNumber"] === "string" &&
    typeof client["username"] === "string" &&
    typeof client["password"] === "string" &&
    typeof client["purchaseDate"] === "string" &&
    typeof client["expirationDate"] === "string" &&
    typeof client["plan"] === "string" &&
    (typeof client["app"] === "undefined" || typeof client["app"] === "string") &&
    (typeof client["customerStatus"] === "undefined" || client["customerStatus"] === "active" || client["customerStatus"] === "inactive") &&
    (typeof client["renewalLink"] === "undefined" || typeof client["renewalLink"] === "string") &&
    (typeof client["price"] === "undefined" || typeof client["price"] === "string") &&
    (typeof client["accountCreatedAt"] === "undefined" || typeof client["accountCreatedAt"] === "string") &&
    (typeof client["connections"] === "undefined" || typeof client["connections"] === "string") &&
    typeof client["notes"] === "string" &&
    typeof client["createdAt"] === "string";
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + "-" + Math.random().toString(36).slice(2, 10);
}

function CustomerStatusBadge({ status }: { status: CustomerAccountStatus }) {
  const active = status === "active";
  const Icon = active ? Check : CircleAlert;
  return <span className={"status-badge " + (active ? "status-active" : "status-inactive")}><Icon size={13} strokeWidth={2.3} />{active ? "Ativo" : "Inativo"}</span>;
}

type ClientTableProps = {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onCreate: () => void;
  compact?: boolean;
};

function ClientTable({ clients, onView, onEdit, onDelete, onCreate, compact = false }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><UsersRound size={22} /></div>
        <h3>Nenhum cliente por aqui</h3>
        <p>Cadastre seu primeiro cliente para acompanhar painel, acesso e vencimento.</p>
        <button className="button button-primary button-small" onClick={onCreate}><Plus size={16} /> Cadastrar cliente</button>
      </div>
    );
  }
  return (
    <div className={"table-wrap" + (compact ? " table-compact" : "")}>
      <table className="client-table">
        <thead><tr><th>Cliente</th><th>Painel</th><th>Plano</th><th>Vencimento</th><th>Situação</th><th><span className="sr-only">Ações</span></th></tr></thead>
        <tbody>
          {clients.map((client) => {
            return (
              <tr key={client.id} onClick={() => onView(client)}>
                <td><div className="customer-cell"><div className="customer-avatar">{initials(client.name)}</div><div className="customer-copy"><strong>{client.name}</strong><span>{client.phone || client.username}</span></div></div></td>
                <td><span className="panel-cell"><span className="panel-dot"><Tv size={13} /></span>{client.panel}</span>{client.panelNumber && <span className="sub-cell">Painel {client.panelNumber}</span>}</td>
                <td><span className="plan-cell">{client.plan || "—"}</span></td>
                <td><strong className="date-cell">{formatDate(client.expirationDate)}</strong><span className="sub-cell">{expirationLabel(client.expirationDate)}</span></td>
                <td><CustomerStatusBadge status={client.customerStatus ?? "active"} /></td>
                <td><div className="row-actions" onClick={(event) => event.stopPropagation()}>
                  <button className="icon-button" aria-label={"Editar " + client.name} title="Editar" onClick={() => onEdit(client)}><Pencil size={15} /></button>
                  <button className="icon-button icon-button-danger" aria-label={"Excluir " + client.name} title="Excluir" onClick={() => onDelete(client)}><Trash2 size={15} /></button>
                </div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type ClientFormModalProps = {
  client: Client | null;
  panels: PanelName[];
  onClose: () => void;
  onSave: (fields: ClientFields, client: Client | null) => void;
};

function ClientFormModal({ client, panels, onClose, onSave }: ClientFormModalProps) {
  const [form, setForm] = useState<ClientFields>(() => client ? {
    name: client.name, phone: client.phone, panel: client.panel, panelNumber: client.panelNumber,
    username: client.username, password: client.password, purchaseDate: client.purchaseDate,
    expirationDate: toDateTimeLocal(client.expirationDate, true), plan: client.plan, app: client.app ?? "",
    customerStatus: client.customerStatus ?? "active", renewalLink: client.renewalLink ?? "",
    price: client.price ?? "", accountCreatedAt: client.accountCreatedAt ?? "",
    connections: client.connections ?? "", notes: client.notes,
  } : { ...EMPTY_FORM, purchaseDate: todayIso() });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  function update<K extends keyof ClientFields>(key: K, value: ClientFields[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (toDateTimeLocal(form.expirationDate, true) < toDateTimeLocal(form.purchaseDate)) {
      setFormError("A data de vencimento precisa ser igual ou posterior à compra.");
      return;
    }
    onSave(form, client);
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card client-form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modal-heading"><div><span className="eyebrow">{client ? "ATUALIZE OS DADOS" : "NOVO CADASTRO"}</span><h2 id="form-title">{client ? "Editar cliente" : "Cadastrar cliente"}</h2><p>Preencha as informações do acesso e do plano contratado.</p></div><button className="icon-button modal-close" aria-label="Fechar" onClick={onClose}><X size={19} /></button></div>
        <form onSubmit={submit}>
          <div className="form-section">
            <div className="form-section-title"><span className="form-step">01</span><div><strong>Dados do cliente</strong><small>Como você identifica este cadastro?</small></div></div>
            <div className="form-grid">
              <label className="field field-span-2"><span>Nome do cliente <b>*</b></span><input autoFocus required maxLength={90} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ex.: Ana Souza" /></label>
              <label className="field"><span>WhatsApp / telefone</span><input type="tel" maxLength={30} value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="(11) 99999-9999" /></label>
              <label className="field"><span>Situação do cliente <b>*</b></span><span className="select-wrap"><select required value={form.customerStatus ?? "active"} onChange={(event) => update("customerStatus", event.target.value as CustomerAccountStatus)}><option value="active">Ativo</option><option value="inactive">Inativo</option></select><ChevronDown size={16} /></span></label>
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-title"><span className="form-step">02</span><div><strong>Painel e acesso</strong><small>Dados usados para localizar a conta.</small></div></div>
            <div className="form-grid">
              <label className="field"><span>Painel <b>*</b></span><span className="select-wrap"><select required value={form.panel} onChange={(event) => update("panel", event.target.value)}>{panels.map((panel) => <option key={panel} value={panel}>{panel}</option>)}</select><ChevronDown size={16} /></span></label>
              <label className="field"><span>Nº do painel <b>*</b></span><input required maxLength={40} value={form.panelNumber} onChange={(event) => update("panelNumber", event.target.value)} placeholder="Ex.: 01 ou servidor 2" /></label>
              <label className="field"><span>Login / usuário <b>*</b></span><input required maxLength={100} autoComplete="off" value={form.username} onChange={(event) => update("username", event.target.value)} placeholder="Usuário de acesso" /></label>
              <label className="field"><span>Senha <b>*</b></span><span className="input-with-action"><input required maxLength={120} autoComplete="new-password" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="Senha de acesso" /><button type="button" className="field-action" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-title"><span className="form-step">03</span><div><strong>Plano e período</strong><small>Informe o plano contratado, a compra e o próximo vencimento.</small></div></div>
            <div className="form-grid">
              <label className="field"><span>Plano comprado <b>*</b></span><input required maxLength={60} value={form.plan} onChange={(event) => update("plan", event.target.value)} placeholder="Ex.: 30 dias, 3 meses, anual" /></label>
              <label className="field"><span>Preço do plano</span><input inputMode="decimal" maxLength={40} value={form.price ?? ""} onChange={(event) => update("price", event.target.value)} placeholder="Ex.: R$ 132,00" /></label>
              <label className="field"><span>Data da compra <b>*</b></span><input required type="date" value={form.purchaseDate} onChange={(event) => update("purchaseDate", event.target.value)} /></label>
              <label className="field"><span>Criado em</span><input type="datetime-local" step={1} value={form.accountCreatedAt ?? ""} onChange={(event) => update("accountCreatedAt", event.target.value)} /></label>
              <label className="field"><span>Vencimento <b>*</b></span><input required type="datetime-local" step={1} min={toDateTimeLocal(form.purchaseDate)} value={toDateTimeLocal(form.expirationDate, true)} onChange={(event) => update("expirationDate", event.target.value)} /></label>
              <label className="field"><span>Conexões</span><input type="number" min={1} step={1} max={99} value={form.connections ?? ""} onChange={(event) => update("connections", event.target.value)} placeholder="Ex.: 1" /></label>
              <label className="field field-span-2"><span>Link de renovação</span><input type="url" maxLength={300} value={form.renewalLink ?? ""} onChange={(event) => update("renewalLink", event.target.value)} placeholder="https://..." /></label>
              <label className="field"><span>Aplicativo utilizado pelo cliente</span><input maxLength={80} value={form.app ?? ""} onChange={(event) => update("app", event.target.value)} placeholder="Ex.: Smart IPTV, XCIPTV" /></label>
              <label className="field field-span-2"><span>Observações</span><textarea rows={2} maxLength={300} value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Anotações internas sobre este cliente (opcional)" /></label>
            </div>
            {formError && <p className="form-error"><AlertTriangle size={15} />{formError}</p>}
          </div>
          <div className="form-footer"><span className="required-note"><b>*</b> Campos obrigatórios</span><div className="form-buttons"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary"><Check size={16} />{client ? "Salvar alterações" : "Salvar cliente"}</button></div></div>
        </form>
      </section>
    </div>
  );
}

type PanelFormModalProps = {
  onClose: () => void;
  onSave: (panel: string) => boolean;
};

function PanelFormModal({ onClose, onSave }: PanelFormModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const panel = name.trim();
    if (!panel) {
      setError("Digite o nome do painel.");
      return;
    }
    if (panel.length > 40) {
      setError("Use até 40 caracteres.");
      return;
    }
    if (!onSave(panel)) {
      setError("Já existe um painel com esse nome.");
      return;
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card panel-form-modal" role="dialog" aria-modal="true" aria-labelledby="panel-form-title">
        <div className="modal-heading">
          <div><span className="eyebrow">PERSONALIZE SUA BASE</span><h2 id="panel-form-title">Adicionar painel</h2><p>O painel ficará disponível nos cadastros e filtros de clientes.</p></div>
          <button className="icon-button modal-close" aria-label="Fechar" onClick={onClose}><X size={19} /></button>
        </div>
        <form onSubmit={submit}>
          <label className="field panel-name-field">
            <span>Nome do painel <b>*</b></span>
            <input autoFocus required maxLength={40} value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="Ex.: Meu novo painel" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-footer"><span className="required-note"><b>*</b> Campo obrigatório</span><div className="form-buttons"><button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary"><Plus size={16} />Adicionar painel</button></div></div>
        </form>
      </section>
    </div>
  );
}

type ClientDetailModalProps = {
  client: Client;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onCopy: (label: string, value: string) => void;
};

function ClientDetailModal({ client, onClose, onEdit, onDelete, onCopy }: ClientDetailModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const status = getClientStatus(client);
  const renewalUrl = safeHttpUrl(client.renewalLink);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="detail-cover"><button className="icon-button detail-close" aria-label="Fechar" onClick={onClose}><X size={19} /></button><div className="detail-avatar">{initials(client.name)}</div><span className="eyebrow">FICHA DO CLIENTE</span><h2 id="detail-title">{client.name}</h2><p>{client.phone || "Telefone não informado"}</p><CustomerStatusBadge status={client.customerStatus ?? "active"} /></div>
        <div className="detail-body">
          <div className="detail-section">
            <div className="detail-section-heading"><span className="detail-icon"><Tv size={17} /></span><div><strong>Painel e plano</strong><small>Informações do cadastro</small></div></div>
            <div className="detail-grid">
              <div className="detail-item"><span>Painel</span><strong>{client.panel}</strong></div>
              <div className="detail-item"><span>Nº do painel</span><strong>{client.panelNumber || "—"}</strong></div>
              <div className="detail-item"><span>Plano comprado</span><strong>{client.plan || "—"}</strong></div>
              <div className="detail-item"><span>Preço do plano</span><strong>{client.price || "—"}</strong></div>
              <div className="detail-item"><span>Aplicativo</span><strong>{client.app || "—"}</strong></div>
              <div className="detail-item"><span>Criado em</span><strong>{formatDate(client.accountCreatedAt ?? "")}</strong></div>
              <div className="detail-item"><span>Compra</span><strong>{formatDate(client.purchaseDate)}</strong></div>
              <div className="detail-item"><span>Vencimento</span><strong>{formatDate(client.expirationDate)}</strong></div>
              <div className="detail-item"><span>Situação do plano</span><strong className={"detail-status-text text-" + status}>{expirationLabel(client.expirationDate)}</strong></div>
              <div className="detail-item"><span>Conexões</span><strong>{client.connections || "—"}</strong></div>
              <div className="detail-item detail-item-wide"><span>Link de renovação</span><strong>{renewalUrl ? <a href={renewalUrl} target="_blank" rel="noopener noreferrer">Abrir link de renovação</a> : client.renewalLink || "—"}</strong></div>
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-section-heading"><span className="detail-icon"><ShieldCheck size={17} /></span><div><strong>Dados de acesso</strong><small>Visíveis somente ao abrir esta ficha</small></div></div>
            <div className="credential-row"><span>Login / usuário</span><strong>{client.username || "—"}</strong><button className="icon-button" aria-label="Copiar login" title="Copiar login" onClick={() => onCopy("Login", client.username)}><Copy size={15} /></button></div>
            <div className="credential-row"><span>Senha</span><strong className="credential-password">{showPassword ? client.password : "••••••••••"}</strong><button className="icon-button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button><button className="icon-button" aria-label="Copiar senha" title="Copiar senha" onClick={() => onCopy("Senha", client.password)}><Copy size={15} /></button></div>
          </div>
          {client.notes && <div className="notes-panel"><span>OBSERVAÇÕES</span><p>{client.notes}</p></div>}
        </div>
        <div className="detail-footer"><button className="button button-danger-ghost" onClick={() => onDelete(client)}><Trash2 size={16} />Excluir</button><div className="form-buttons"><button className="button button-secondary" onClick={onClose}>Fechar</button><button className="button button-primary" onClick={() => onEdit(client)}><Pencil size={16} />Editar cadastro</button></div></div>
      </section>
    </div>
  );
}

function Index() {
  const [page, setPage] = useState<Page>("overview");
  const [clients, setClients] = useState<Client[]>([]);
  const [panels, setPanels] = useState<PanelName[]>([...DEFAULT_PANELS]);
  const [loaded, setLoaded] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [customerStatusFilter, setCustomerStatusFilter] = useState<CustomerAccountFilter>("all");
  const [selectedPanel, setSelectedPanel] = useState<PanelName | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [panelFormOpen, setPanelFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setClients(parsed.filter(isClient));
      }
    } catch {
      setStorageWarning(true);
    }
    try {
      const savedPanels = window.localStorage.getItem(PANELS_STORAGE_KEY);
      if (savedPanels) setPanels(normalizePanelNames(JSON.parse(savedPanels)));
    } catch {
      setStorageWarning(true);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || storageWarning) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
      window.localStorage.setItem(PANELS_STORAGE_KEY, JSON.stringify(panels));
    } catch {
      setStorageWarning(true);
    }
  }, [clients, panels, loaded, storageWarning]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const counts = useMemo(() => {
    const panelClients = selectedPanel === "all" ? clients : clients.filter((client) => client.panel === selectedPanel);
    const scopedClients = customerStatusFilter === "all"
      ? panelClients
      : panelClients.filter((client) => (client.customerStatus ?? "active") === customerStatusFilter);
    const result = { all: scopedClients.length, active: 0, expiring: 0, expired: 0 };
    scopedClients.forEach((client) => { result[getClientStatus(client)] += 1; });
    return result;
  }, [clients, customerStatusFilter, selectedPanel]);

  const panelCounts = useMemo(() => {
    const result: Record<PanelName, number> = {};
    panels.forEach((panel) => { result[panel] = 0; });
    clients.forEach((client) => { result[client.panel] = (result[client.panel] ?? 0) + 1; });
    return result;
  }, [clients, panels]);

  const visibleClients = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("pt-BR");
    return clients
      .filter((client) => statusFilter === "all" || getClientStatus(client) === statusFilter)
      .filter((client) => selectedPanel === "all" || client.panel === selectedPanel)
      .filter((client) => customerStatusFilter === "all" || (client.customerStatus ?? "active") === customerStatusFilter)
      .filter((client) => !query || [client.name, client.phone, client.panel, client.panelNumber, client.username, client.plan].some((value) => value.toLocaleLowerCase("pt-BR").includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [clients, customerStatusFilter, searchTerm, selectedPanel, statusFilter]);

  const recentClients = useMemo(() => [...clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [clients]);

  function openCreate() {
    setEditingClient(null);
    setFormOpen(true);
  }

  function addPanel(panelName: string) {
    const normalized = panelName.trim().toLocaleLowerCase("pt-BR");
    if (normalized === "all" || panels.some((panel) => panel.toLocaleLowerCase("pt-BR") === normalized)) {
      return false;
    }
    setPanels((current) => [...current, panelName.trim()]);
    setToast("Painel adicionado.");
    return true;
  }

  function openEdit(client: Client) {
    setViewingClient(null);
    setDeleteTarget(null);
    setEditingClient(client);
    setFormOpen(true);
  }

  function saveClient(fields: ClientFields, original: Client | null) {
    if (original) {
      setClients((current) => current.map((client) => client.id === original.id ? { ...client, ...fields } : client));
      setToast("Cadastro atualizado.");
    } else {
      setClients((current) => [{ ...fields, id: makeId(), createdAt: new Date().toISOString() }, ...current]);
      setToast("Cliente cadastrado.");
    }
    setFormOpen(false);
    setEditingClient(null);
  }

  function deleteClient() {
    if (!deleteTarget) return;
    setClients((current) => current.filter((client) => client.id !== deleteTarget.id));
    setToast("Cliente excluído.");
    setDeleteTarget(null);
    setViewingClient(null);
  }

  async function copyValue(label: string, value: string) {
    if (!value) {
      setToast(label + " não informado.");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setToast(label + " copiado.");
    } catch {
      setToast("Não foi possível copiar neste navegador.");
    }
  }

  function goToClients(panel: PanelName | "all" = "all", filter: StatusFilter = "all") {
    setSelectedPanel(panel);
    setStatusFilter(filter);
    setCustomerStatusFilter("all");
    setPage("clients");
    setMobileNavOpen(false);
  }

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setMobileNavOpen(false);
    if (nextPage !== "clients") {
      setSelectedPanel("all");
      setStatusFilter("all");
      setCustomerStatusFilter("all");
    }
  }

  const pageContent: Record<Page, { eyebrow: string; title: string; description: string }> = {
    overview: { eyebrow: "SEU NEGÓCIO, EM ORDEM", title: "Visão geral", description: "Acompanhe seus clientes, planos e vencimentos em um só lugar." },
    clients: {
      eyebrow: "BASE DE CLIENTES",
      title: selectedPanel === "all" ? "Clientes" : selectedPanel,
      description: selectedPanel === "all" ? "Gerencie cadastros, dados de acesso e renovações." : "Clientes cadastrados no painel " + selectedPanel + ".",
    },
    panels: { eyebrow: "ORGANIZE SUA OPERAÇÃO", title: "Painéis", description: "Acesse rapidamente os clientes de cada painel." },
  };

  const heading = pageContent[page];
  const navItems: { key: Page; label: string; icon: LucideIcon; count?: number }[] = [
    { key: "overview", label: "Visão geral", icon: LayoutDashboard },
    { key: "clients", label: "Clientes", icon: UsersRound, count: clients.length },
    { key: "panels", label: "Painéis", icon: Server },
  ];

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobileNavOpen(false)} />}
      <aside className={"sidebar" + (mobileNavOpen ? " sidebar-open" : "")}>
        <div className="brand"><span className="brand-mark"><Tv size={21} strokeWidth={2.3} /></span><span className="brand-name">iptv<span>base</span></span></div>
        <div className="workspace-switch"><span className="workspace-avatar">IP</span><span className="workspace-copy"><strong>Minha operação</strong><small>Área de trabalho</small></span><ChevronDown size={15} /></div>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="primary-nav" aria-label="Menu principal">
          {navItems.map(({ key, label, icon: Icon, count }) => <button key={key} className={"nav-link" + (page === key ? " nav-link-active" : "")} onClick={() => navigate(key)}><Icon size={18} strokeWidth={1.9} /><span>{label}</span>{count !== undefined && <small>{count}</small>}</button>)}
        </nav>
        <div className="sidebar-panels-heading"><div className="nav-label panels-label">PAINÉIS</div><button className="sidebar-add-panel" aria-label="Adicionar painel" title="Adicionar painel" onClick={() => setPanelFormOpen(true)}><Plus size={14} /></button></div>
        <nav className="panel-nav" aria-label="Painéis de clientes">
          {panels.map((panel) => <button key={panel} className={"panel-nav-link" + (page === "clients" && selectedPanel === panel ? " panel-nav-active" : "")} onClick={() => goToClients(panel)}><span className="panel-nav-dot" /><span>{panel}</span><small>{panelCounts[panel] ?? 0}</small></button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-mode-card"><span className="local-mode-icon"><Database size={16} /></span><div><strong>{storageWarning ? "Armazenamento indisponível" : "Modo neste navegador"}</strong><small>{storageWarning ? "Não foi possível salvar os dados" : "Os dados ficam salvos aqui"}</small></div><span className={"storage-indicator" + (storageWarning ? " storage-error" : "")} /></div>
          <div className="sidebar-user"><span className="user-avatar">AD</span><span className="user-copy"><strong>Administrador</strong><small>Gestão de clientes</small></span><ChevronDown size={15} /></div>
        </div>
      </aside>

      <main className="main-column">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu-button icon-button" aria-label="Abrir menu" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>IPTV Base</span><ArrowRight size={13} /><strong>{heading.title}</strong></div></div>
          <div className="topbar-right">
            <label className="global-search"><Search size={17} /><input aria-label="Buscar clientes" placeholder="Buscar cliente, login ou plano..." value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); if (event.target.value) setPage("clients"); }} />{searchTerm && <button type="button" aria-label="Limpar busca" onClick={() => setSearchTerm("")}><X size={15} /></button>}</label>
            <span className="topbar-date"><CalendarDays size={15} />{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
            <button className="button button-primary topbar-create" onClick={openCreate}><Plus size={16} /> Novo cliente</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading"><div><span className="eyebrow">{heading.eyebrow}</span><h1>{heading.title}</h1><p>{heading.description}</p></div>{page === "panels" ? <button className="button button-primary page-create" onClick={() => setPanelFormOpen(true)}><Plus size={16} /> Adicionar painel</button> : page === "clients" && <button className="button button-primary page-create" onClick={openCreate}><Plus size={16} /> Cadastrar cliente</button>}</div>
          {storageWarning
            ? <div className="storage-alert"><AlertTriangle size={17} /><span>O navegador não permitiu salvar os dados. Seus cadastros podem ser perdidos ao fechar esta página.</span></div>
            : <div className="local-data-notice"><ShieldCheck size={15} /><span>Os dados são salvos somente neste navegador e não sincronizam entre dispositivos.</span><span className="notice-dot" /><span>Senhas armazenadas localmente</span></div>}

          {page === "overview" && <>
            <section className="stats-grid" aria-label="Resumo dos clientes">
              <button className="stat-card stat-total" onClick={() => goToClients("all", "all")}><span className="stat-icon"><UsersRound size={19} /></span><span className="stat-label">Total de clientes</span><strong>{counts.all}</strong><span className="stat-foot"><span>Base cadastrada</span><ArrowUpRight size={14} /></span></button>
              <button className="stat-card stat-active" onClick={() => goToClients("all", "active")}><span className="stat-icon"><Check size={19} /></span><span className="stat-label">Planos vigentes</span><strong>{counts.active}</strong><span className="stat-foot"><span>Mais de 7 dias até vencer</span><ArrowUpRight size={14} /></span></button>
              <button className="stat-card stat-expiring" onClick={() => goToClients("all", "expiring")}><span className="stat-icon"><Clock3 size={19} /></span><span className="stat-label">Vencem em breve</span><strong>{counts.expiring}</strong><span className="stat-foot"><span>Nos próximos 7 dias</span><ArrowDownRight size={14} /></span></button>
              <button className="stat-card stat-expired" onClick={() => goToClients("all", "expired")}><span className="stat-icon"><CircleAlert size={19} /></span><span className="stat-label">Expirados</span><strong>{counts.expired}</strong><span className="stat-foot"><span>Precisam de renovação</span><ArrowDownRight size={14} /></span></button>
            </section>
            <div className="dashboard-grid">
              <section className="content-card recent-card">
                <div className="card-heading"><div><h2>Clientes recentes</h2><p>Os últimos cadastros adicionados à sua base.</p></div><button className="text-button" onClick={() => goToClients()}>Ver todos <ArrowRight size={15} /></button></div>
                <ClientTable clients={recentClients} onView={setViewingClient} onEdit={openEdit} onDelete={setDeleteTarget} onCreate={openCreate} compact />
              </section>
              <section className="content-card panel-summary-card">
                <div className="card-heading"><div><h2>Clientes por painel</h2><p>Distribuição dos seus cadastros.</p></div><span className="card-heading-icon"><Server size={17} /></span></div>
                <div className="panel-summary-list">{panels.map((panel) => {
                  const panelCount = panelCounts[panel] ?? 0;
                  const percent = clients.length ? Math.round((panelCount / clients.length) * 100) : 0;
                  return <button className="panel-summary-row" key={panel} onClick={() => goToClients(panel)}><span className="panel-summary-dot" /><span className="panel-summary-name">{panel}</span><span className="panel-summary-track"><span style={{ width: String(percent) + "%" }} /></span><strong>{panelCount}</strong></button>;
                })}</div>
                <button className="panel-summary-footer" onClick={() => navigate("panels")}>Ver todos os painéis <ArrowRight size={15} /></button>
              </section>
            </div>
            <section className="help-strip"><span className="help-strip-icon"><MessageCircle size={18} /></span><div><strong>Comece organizando sua base</strong><p>Cadastre um cliente para acompanhar o acesso e não perder a data de renovação.</p></div><button className="button button-secondary button-small" onClick={openCreate}>Adicionar cliente <ArrowRight size={15} /></button></section>
          </>}

          {page === "clients" && <section className="content-card clients-card">
            <div className="card-heading clients-card-heading"><div><h2>{selectedPanel === "all" ? "Todos os clientes" : "Painel " + selectedPanel}</h2><p>{visibleClients.length} {visibleClients.length === 1 ? "cadastro encontrado" : "cadastros encontrados"}</p></div><div className="clients-heading-filters"><label className="filter-select"><span className="sr-only">Filtrar por painel</span><select value={selectedPanel} onChange={(event) => setSelectedPanel(event.target.value)}><option value="all">Todos os painéis</option>{panels.map((panel) => <option key={panel} value={panel}>{panel}</option>)}</select><ChevronDown size={15} /></label><label className="filter-select"><span className="sr-only">Filtrar por situação do cliente</span><select value={customerStatusFilter} onChange={(event) => setCustomerStatusFilter(event.target.value as CustomerAccountFilter)}><option value="all">Todos os clientes</option><option value="active">Clientes ativos</option><option value="inactive">Clientes inativos</option></select><ChevronDown size={15} /></label></div></div>
            <div className="status-filters" role="group" aria-label="Filtrar por situação do plano">
              {([["all", "Todos", counts.all], ["active", "Vigentes", counts.active], ["expiring", "Vencem em breve", counts.expiring], ["expired", "Expirados", counts.expired]] as const).map(([filter, label, count]) => <button key={filter} className={"filter-tab" + (statusFilter === filter ? " filter-tab-active" : "")} onClick={() => setStatusFilter(filter)}>{label}<span>{count}</span></button>)}
            </div>
            <ClientTable clients={visibleClients} onView={setViewingClient} onEdit={openEdit} onDelete={setDeleteTarget} onCreate={openCreate} />
          </section>}

          {page === "panels" && <>
            <section className="panel-cards-grid">{panels.map((panel, index) => {
              const colors = ["mint", "blue", "violet", "amber", "rose", "teal", "slate"];
              return <button className="panel-card" key={panel} onClick={() => goToClients(panel)}><span className={"panel-card-icon tone-" + colors[index % colors.length]}><Tv size={20} /></span><span className="panel-card-title">{panel}</span><strong>{panelCounts[panel] ?? 0}</strong><span className="panel-card-caption">{panelCounts[panel] === 1 ? "cliente cadastrado" : "clientes cadastrados"}</span><span className="panel-card-arrow"><ArrowRight size={16} /></span></button>;
            })}<button className="panel-card panel-card-add" onClick={() => setPanelFormOpen(true)}><span className="panel-card-icon"><Plus size={20} /></span><span className="panel-card-title">Adicionar painel</span><span className="panel-card-caption">Cadastre outro painel para organizar seus clientes.</span><span className="panel-card-arrow"><ArrowRight size={16} /></span></button></section>
            <section className="content-card panels-note"><span className="detail-icon"><Server size={17} /></span><div><strong>Painéis em uma única base</strong><p>Selecione um painel para consultar, editar ou cadastrar clientes vinculados a ele.</p></div><button className="button button-primary button-small" onClick={() => setPanelFormOpen(true)}><Plus size={15} /> Adicionar painel</button></section>
          </>}
        </div>
        <footer className="app-footer"><span>IPTV Base</span><span>Gestão simples para sua operação</span></footer>
      </main>

      {formOpen && <ClientFormModal key={editingClient?.id ?? "new"} client={editingClient} panels={panels} onClose={() => { setFormOpen(false); setEditingClient(null); }} onSave={saveClient} />}
      {panelFormOpen && <PanelFormModal onClose={() => setPanelFormOpen(false)} onSave={addPanel} />}
      {viewingClient && <ClientDetailModal client={viewingClient} onClose={() => setViewingClient(null)} onEdit={openEdit} onDelete={setDeleteTarget} onCopy={copyValue} />}
      {deleteTarget && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeleteTarget(null)}><section className="modal-card delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span className="delete-icon"><Trash2 size={21} /></span><h2 id="delete-title">Excluir cadastro?</h2><p>O cadastro de <strong>{deleteTarget.name}</strong> será removido deste navegador. Esta ação não pode ser desfeita.</p><div className="form-buttons delete-buttons"><button className="button button-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button><button className="button button-danger" onClick={deleteClient}><Trash2 size={16} />Excluir cliente</button></div></section></div>}
      {toast && <div className="toast-message" role="status"><Check size={16} />{toast}</div>}
    </div>
  );
}
