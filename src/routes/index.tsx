import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Dog,
  FileText,
  Footprints,
  Heart,
  ListChecks,
  PawPrint,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Video,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

const CHECKOUT_URL = "";

const steps = [
  {
    number: "01",
    days: "DIAS 1 A 3",
    title: "Atenção",
    description:
      "Seu cão aprende a voltar a atenção para você antes de sair puxando. O começo acontece em casa, com calma.",
    icon: Sparkles,
    tone: "mint",
  },
  {
    number: "02",
    days: "DIAS 4 A 10",
    title: "Guia frouxa",
    description:
      "Você pratica o caminhar ao seu lado primeiro dentro de casa e depois leva o treino para a rua.",
    icon: Footprints,
    tone: "sun",
  },
  {
    number: "03",
    days: "DIAS 11 A 14",
    title: "Distrações",
    description:
      "O protocolo avança para cheiros, barulhos e outros cães, respeitando o ritmo de vocês.",
    icon: Heart,
    tone: "rose",
  },
];

const deliverables = [
  {
    number: "01",
    label: "PRINCIPAL",
    title: "Protocolo de 14 Dias",
    description:
      "A tarefa de cada dia, na ordem certa. Abra, leia e saiba o que praticar no passeio.",
    icon: FileText,
  },
  {
    number: "02",
    label: "DENTRO DO GUIA",
    title: "Vídeos dos exercícios",
    description:
      "Demonstrações curtas para você ver cada exercício na prática e começar com mais segurança.",
    icon: Video,
  },
  {
    number: "03",
    label: "BÔNUS 1",
    title: "Guia dos Primeiros 3 Dias",
    description:
      "Um roteiro simples para saber por onde começar e o que fazer logo nos primeiros passeios.",
    icon: CalendarDays,
  },
  {
    number: "04",
    label: "BÔNUS 2",
    title: "Treino Expresso de 5 Minutos",
    description:
      "Uma versão curta do treino para encaixar na rotina quando o tempo estiver apertado.",
    icon: Clock3,
  },
  {
    number: "05",
    label: "BÔNUS 3",
    title: "Os 7 Erros Que Fazem o Cão Puxar Ainda Mais",
    description:
      "Veja quais hábitos evitar para não aumentar a tensão na guia durante o passeio.",
    icon: TriangleAlert,
  },
  {
    number: "06",
    label: "BÔNUS 4",
    title: "App/Planilha de Progresso",
    description:
      "Registre o avanço de cada dia e acompanhe o próximo passo do protocolo.",
    icon: ListChecks,
  },
];

const offerItems = [
  { title: "Protocolo de 14 Dias (PDF)", value: "R$ 97" },
  { title: "Vídeos dos exercícios", value: "R$ 57" },
  { title: "Guia dos Primeiros 3 Dias", value: "R$ 27" },
  { title: "Treino Expresso de 5 Minutos", value: "R$ 27" },
  { title: "Os 7 Erros", value: "R$ 27" },
  { title: "App/Planilha de Progresso", value: "R$ 61" },
];

function CheckoutAction({ label }: { label: string }) {
  if (CHECKOUT_URL) {
    return (
      <a className="sales-button" href={CHECKOUT_URL}>
        {label}
        <ArrowRight aria-hidden="true" size={18} />
      </a>
    );
  }

  return (
    <button className="sales-button" type="button" disabled>
      {label}
      <ArrowRight aria-hidden="true" size={18} />
    </button>
  );
}

function PriceCard() {
  return (
    <div className="price-card">
      <div className="price-card-heading">
        <div>
          <p className="price-eyebrow">ACESSO COMPLETO</p>
          <h3>Guia Não Puxa Mais</h3>
        </div>
        <div className="price-mark" aria-hidden="true">
          <PawPrint size={24} strokeWidth={1.8} />
        </div>
      </div>

      <ul className="offer-list">
        {offerItems.map((item) => (
          <li key={item.title}>
            <span className="offer-check">
              <Check aria-hidden="true" size={14} />
            </span>
            <span>{item.title}</span>
            <span className="offer-value">{item.value}</span>
          </li>
        ))}
      </ul>

      <div className="price-total">
        <span>Valor dos itens separados</span>
        <strong>R$ 296</strong>
      </div>

      <div className="price-now">
        <span>Hoje, à vista</span>
        <strong>
          <span className="currency">R$</span> 37
        </strong>
      </div>

      <CheckoutAction label="Sim, quero garantir por R$ 37" />
      <p className="checkout-note">
        O link de pagamento será conectado quando você informar o checkout.
      </p>
      <p className="price-guarantee">
        <ShieldCheck aria-hidden="true" size={16} />
        7 dias de garantia incondicional
      </p>
    </div>
  );
}

function Index() {
  return (
    <main className="sales-page" id="inicio">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="site-header">
        <a className="wordmark" href="#inicio" aria-label="Guia Não Puxa Mais">
          <span className="brand-symbol">
            <Footprints aria-hidden="true" size={21} />
          </span>
          <span>
            Guia <strong>Não Puxa Mais</strong>
          </span>
        </a>
        <p className="header-note">
          <span aria-hidden="true" />
          Um passo de cada vez, por 14 dias
        </p>
      </header>

      <div id="conteudo">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-mark" aria-hidden="true">
                <PawPrint size={15} />
              </span>
              UM PLANO PRÁTICO DE 14 DIAS
            </p>
            <h1 id="hero-title">
              Passeios mais leves começam com a <em>guia frouxa.</em>
            </h1>
            <p className="hero-lede">
              Tenha um passo a passo diário para ajudar seu cão a parar de puxar
              — mesmo que você já tenha tentado peitoral, coleira ou trancos.
            </p>
            <p className="hero-support">
              Copie a tarefa do dia e aplique já no próximo passeio, sem
              adestrador e sem equipamento caro.
            </p>
            <div className="hero-tags" aria-label="Características do protocolo">
              <span>
                <Check aria-hidden="true" size={14} /> Sem trancos
              </span>
              <span>
                <Check aria-hidden="true" size={14} /> Começa em casa
              </span>
              <span>
                <Check aria-hidden="true" size={14} /> Um dia por vez
              </span>
            </div>
          </div>

          <div
            className="hero-art"
            role="img"
            aria-label="Prévia de uma tarefa diária do protocolo de 14 dias"
          >
            <div className="art-orbit art-orbit-one" />
            <div className="art-orbit art-orbit-two" />
            <div className="walk-card">
              <div className="walk-card-top">
                <div className="walk-card-title">
                  <span className="walk-card-icon">
                    <CalendarDays aria-hidden="true" size={19} />
                  </span>
                  <span>
                    <small>SEU PLANO DE HOJE</small>
                    <strong>Dia 01 de 14</strong>
                  </span>
                </div>
                <span className="today-chip">COMECE</span>
              </div>

              <div className="walk-scene" aria-hidden="true">
                <span className="scene-sun" />
                <span className="scene-ground" />
                <span className="scene-route" />
                <span className="scene-person">
                  <Footprints size={42} strokeWidth={1.55} />
                </span>
                <span className="scene-leash" />
                <span className="scene-dog">
                  <Dog size={55} strokeWidth={1.55} />
                </span>
                <span className="scene-paw paw-one">
                  <PawPrint size={17} />
                </span>
                <span className="scene-paw paw-two">
                  <PawPrint size={13} />
                </span>
              </div>

              <div className="walk-task">
                <div className="task-check">
                  <Check aria-hidden="true" size={15} />
                </div>
                <div className="task-copy">
                  <strong>Pratique a atenção antes de sair</strong>
                  <span>Uma tarefa clara para começar com calma.</span>
                </div>
              </div>

              <div className="walk-progress">
                <div className="progress-label">
                  <span>Seu progresso</span>
                  <strong>1 de 14 dias</strong>
                </div>
                <div className="progress-track">
                  <span />
                </div>
              </div>
            </div>
            <div className="art-sticker">
              <Sparkles aria-hidden="true" size={17} />
              <span>Menos disputa.<br />Mais parceria.</span>
            </div>
          </div>
        </section>

        <section
          className="steps-section section-wrap"
          aria-labelledby="steps-title"
        >
          <div className="section-heading">
            <p className="eyebrow">UM CAMINHO EM TRÊS FASES</p>
            <h2 id="steps-title">
              Esses são os 3 passos para caminhar com a guia frouxa
            </h2>
            <p>
              O protocolo organiza o treino na ordem certa: primeiro a atenção,
              depois a caminhada e, por fim, as distrações da rua.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article className="step-card" key={step.number}>
                  <div className="step-top">
                    <span className={"step-icon " + step.tone}>
                      <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
                    </span>
                    <span className="step-number">{step.number}</span>
                  </div>
                  <p className="step-days">{step.days}</p>
                  <h3>{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </article>
              );
            })}
          </div>
          <div className="steps-footnote">
            <span className="steps-footnote-icon">
              <Clock3 aria-hidden="true" size={17} />
            </span>
            <p>
              Você sabe qual é a tarefa do dia — sem ficar pulando entre vídeos
              soltos.
            </p>
          </div>
        </section>

        <section className="pain-section" aria-labelledby="pain-title">
          <div className="pain-inner">
            <div className="pain-copy">
              <p className="eyebrow eyebrow-light">A GENTE ENTENDE</p>
              <h2 id="pain-title">
                O passeio devia ser um respiro, não mais uma disputa.
              </h2>
              <p>
                Você sai de casa já esperando o puxão. Volta com o braço
                dolorido, a paciência no fim e a sensação de que todo mundo na
                rua está olhando.
              </p>
              <div className="pain-quote">
                <span className="quote-mark">“</span>
                <p>
                  Trocar de coleira ou assistir a mais um vídeo solto pode
                  deixar você sem saber qual passo seguir.
                </p>
              </div>
            </div>
            <div className="pain-list">
              <p className="pain-list-title">Se isso parece familiar, você não está só:</p>
              <div className="pain-item">
                <span className="pain-item-icon">
                  <Check aria-hidden="true" size={16} />
                </span>
                <p>Seu braço e seu ombro ficam doloridos depois do passeio.</p>
              </div>
              <div className="pain-item">
                <span className="pain-item-icon">
                  <Check aria-hidden="true" size={16} />
                </span>
                <p>Você fica tenso ao cruzar com cães, pessoas ou cheiros novos.</p>
              </div>
              <div className="pain-item">
                <span className="pain-item-icon">
                  <Check aria-hidden="true" size={16} />
                </span>
                <p>Você quer ajudar, mas não sabe qual exercício fazer primeiro.</p>
              </div>
              <div className="pain-note">
                <PawPrint aria-hidden="true" size={19} />
                <span>Um roteiro claro pode tornar o próximo passo mais simples.</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="deliverables-section section-wrap"
          aria-labelledby="deliverables-title"
        >
          <div className="section-heading">
            <p className="eyebrow">TUDO ORGANIZADO PARA VOCÊ</p>
            <h2 id="deliverables-title">
              O que você recebe no Guia Não Puxa Mais
            </h2>
            <p>
              Materiais para entender o exercício, praticar e acompanhar o
              progresso sem adivinhar o que vem depois.
            </p>
          </div>

          <div className="deliverables-grid">
            {deliverables.map((item) => {
              const Icon = item.icon;
              return (
                <article className="deliverable-card" key={item.number}>
                  <div className="deliverable-top">
                    <span className="deliverable-icon">
                      <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
                    </span>
                    <span className="deliverable-label">{item.label}</span>
                    <span className="deliverable-number">{item.number}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>

          <div className="deliverables-cta">
            <div>
              <p className="cta-kicker">ACESSO IMEDIATO AO CONTEÚDO</p>
              <h3>Comece pelo próximo passeio.</h3>
            </div>
            <CheckoutAction label="Quero o protocolo, os vídeos e os 4 bônus" />
          </div>
          <p className="checkout-pending-note">
            O botão será ativado quando o link de pagamento estiver configurado.
          </p>
        </section>

        <section className="audience-section" aria-labelledby="audience-title">
          <div className="audience-inner">
            <div className="audience-copy">
              <p className="eyebrow">PARA QUEM É</p>
              <h2 id="audience-title">Para você que quer voltar a curtir o passeio.</h2>
              <p>
                Um roteiro prático para tutores de cães de qualquer porte que
                puxam a guia ou ficam agitados na rua.
              </p>
            </div>
            <div className="audience-list">
              <div>
                <span><Check aria-hidden="true" size={16} /></span>
                <p>Para quem termina o passeio com dor no braço ou no ombro.</p>
              </div>
              <div>
                <span><Check aria-hidden="true" size={16} /></span>
                <p>Para quem passa vergonha quando o cão puxa, pula ou late.</p>
              </div>
              <div>
                <span><Check aria-hidden="true" size={16} /></span>
                <p>Para quem quer um plano pronto e fácil de seguir em casa e na rua.</p>
              </div>
              <div>
                <span><Check aria-hidden="true" size={16} /></span>
                <p>Para quem quer treinar sem trancos e sem equipamento caro.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="offer-section" id="oferta" aria-labelledby="offer-title">
          <div className="offer-inner">
            <div className="offer-copy">
              <p className="eyebrow eyebrow-light">SEU PLANO COMPLETO</p>
              <h2 id="offer-title">
                Um protocolo simples para sair do improviso.
              </h2>
              <p>
                Você leva o passo a passo, as demonstrações em vídeo e os quatro
                bônus para aplicar o treino com mais clareza.
              </p>
              <div className="offer-promise">
                <span className="offer-promise-icon">
                  <ShieldCheck aria-hidden="true" size={21} />
                </span>
                <p>
                  <strong>Experimente por 7 dias.</strong>
                  <span>
                    Se o conteúdo não fizer sentido para você, peça o reembolso
                    integral dentro do prazo.
                  </span>
                </p>
              </div>
              <div className="access-steps">
                <p className="access-steps-title">Depois da compra:</p>
                <div><span>01</span> Finalize o pedido e receba o acesso por e-mail.</div>
                <div><span>02</span> Abra o protocolo e conheça a tarefa do dia.</div>
                <div><span>03</span> Aplique no próximo passeio e marque seu avanço.</div>
              </div>
            </div>
            <PriceCard />
          </div>
        </section>

        <section className="guarantee-section section-wrap">
          <div className="guarantee-icon">
            <ShieldCheck aria-hidden="true" size={34} strokeWidth={1.5} />
          </div>
          <div className="guarantee-copy">
            <p className="eyebrow">UM ACORDO SIMPLES</p>
            <h2>7 dias de garantia incondicional</h2>
            <p>
              Você tem 7 dias para conhecer o conteúdo. Se concluir que ele não
              faz sentido para você, solicite o reembolso de 100% do valor pago
              dentro desse prazo.
            </p>
          </div>
          <div className="guarantee-seal">
            <span>7</span>
            <small>DIAS</small>
            <ShieldCheck aria-hidden="true" size={17} />
          </div>
        </section>

        <section className="faq-section section-wrap" aria-labelledby="faq-title">
          <div className="faq-heading">
            <p className="eyebrow">DÚVIDAS FREQUENTES</p>
            <h2 id="faq-title">Antes de começar</h2>
            <p>O essencial para saber se o protocolo combina com vocês.</p>
          </div>
          <div className="faq-list">
            <details className="faq-item">
              <summary>
                Qual a diferença para um curso de adestramento?
                <ChevronDown aria-hidden="true" size={18} />
              </summary>
              <p>
                Um curso pode abordar adestramento em geral. Este guia foca em
                um problema específico: o cão que puxa a guia. É um material
                curto e prático, com tarefas para aplicar no dia a dia.
              </p>
            </details>
            <details className="faq-item">
              <summary>
                Meu cão é reativo ou agressivo. O protocolo serve?
                <ChevronDown aria-hidden="true" size={18} />
              </summary>
              <p>
                O protocolo é voltado a puxões e agitação na rua. Casos de
                agressividade, medo intenso ou risco de mordida precisam de
                acompanhamento individual de um adestrador qualificado ou de
                um veterinário comportamental.
              </p>
            </details>
            <details className="faq-item">
              <summary>
                Preciso usar trancos ou comprar equipamento caro?
                <ChevronDown aria-hidden="true" size={18} />
              </summary>
              <p>
                A proposta do guia é seguir um passo a passo sem trancos e sem
                depender de equipamento caro. Você pode começar com o que já
                tem, priorizando segurança e conforto para você e para o cão.
              </p>
            </details>
            <details className="faq-item">
              <summary>
                Como funciona a garantia de 7 dias?
                <ChevronDown aria-hidden="true" size={18} />
              </summary>
              <p>
                Se o conteúdo não fizer sentido para você, solicite o
                reembolso integral dentro dos primeiros 7 dias da compra.
              </p>
            </details>
          </div>
        </section>

        <section className="closing-section" aria-labelledby="closing-title">
          <div className="closing-inner">
            <div className="closing-copy">
              <span className="closing-paw" aria-hidden="true">
                <PawPrint size={22} />
              </span>
              <p className="eyebrow">O PRÓXIMO PASSEIO PODE SER DIFERENTE</p>
              <h2 id="closing-title">
                Troque a tentativa e erro por um passo a passo.
              </h2>
              <p>
                Você pode continuar improvisando a cada puxão ou começar com
                uma tarefa clara para hoje.
              </p>
            </div>
            <PriceCard />
          </div>
        </section>
      </div>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#inicio">
          <span className="brand-symbol">
            <Footprints aria-hidden="true" size={19} />
          </span>
          <span>
            Guia <strong>Não Puxa Mais</strong>
          </span>
        </a>
        <p>
          Passeios mais leves começam com atenção, prática e um passo de cada vez.
        </p>
        <a className="back-to-top" href="#inicio">
          Voltar ao início <ArrowRight aria-hidden="true" size={15} />
        </a>
      </footer>
    </main>
  );
}
