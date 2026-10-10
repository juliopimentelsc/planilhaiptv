import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Tv } from "lucide-react";

import { signIn, signUp, type AuthSession } from "@/lib/cloud-data";

type AuthScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      if (mode === "register") {
        const result = await signUp(email.trim(), password);
        if (result.session) {
          onAuthenticated(result.session);
        } else {
          setMessage("Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre no app.");
        }
      } else {
        onAuthenticated(await signIn(email.trim(), password));
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  const registering = mode === "register";

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand"><span className="brand-mark"><Tv size={21} strokeWidth={2.3} /></span><span className="brand-name">iptv<span>base</span></span></div>
        <div className="auth-intro">
          <span className="eyebrow">SUA OPERAÇÃO, EM QUALQUER LUGAR</span>
          <h1 id="auth-title">{registering ? "Crie sua conta" : "Entre na sua conta"}</h1>
          <p>{registering ? "Seus clientes e painéis ficam sincronizados entre seus dispositivos." : "Acesse sua base de clientes e continue de onde parou."}</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Acesso à conta">
          <button type="button" role="tab" aria-selected={!registering} className={!registering ? "auth-tab auth-tab-active" : "auth-tab"} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>Entrar</button>
          <button type="button" role="tab" aria-selected={registering} className={registering ? "auth-tab auth-tab-active" : "auth-tab"} onClick={() => { setMode("register"); setError(""); setMessage(""); }}>Criar conta</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>E-mail</span>
            <span className="auth-input"><Mail size={17} /><input autoComplete="email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" /></span>
          </label>
          <label className="field">
            <span>Senha</span>
            <span className="auth-input"><LockKeyhole size={17} /><input autoComplete={registering ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} required minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Pelo menos 8 caracteres" /><button type="button" className="field-action" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>
          </label>
          {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
          {message && <p className="auth-feedback auth-success" role="status">{message}</p>}
          <button type="submit" className="button button-primary auth-submit" disabled={busy}>{busy ? "Aguarde..." : registering ? "Criar conta" : "Entrar"}<ArrowRight size={16} /></button>
        </form>

        <div className="auth-privacy"><ShieldCheck size={16} /><span>Seus cadastros ficam separados e protegidos pela sua conta.</span></div>
      </section>
      <p className="auth-footer">IPTV Base · Gestão simples para sua operação</p>
    </main>
  );
}

