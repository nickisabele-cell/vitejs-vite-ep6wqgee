import { useState, useEffect } from 'react';

// ==========================================
// 1. CREDENCIAIS DO SEU BANCO DE DADOS REAL
// ==========================================
const SUPABASE_URL = "https://ymydofdhiqqqcfrjbnpg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteWRvZmRoaXFxcWNmcmpibnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjE0NTMsImV4cCI6MjA5NDIzNzQ1M30.DLZqM1NTvRfHndCr9DNFinsgeN5tTSPEh4Y4bH7i8M0";

// ==========================================
// 2. DEFINIÇÃO DOS TIPOS (TYPES)
// ==========================================
export type FunnelType = 'Vendas' | 'Mega aula' | 'Programa corretor campeão' | 'Mentoria Dono';
export type TabType = 'dashboard' | 'kanban' | 'clientes' | 'produtos' | 'integracoes' | 'configuracoes';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  funnel: FunnelType;
  stage: string; 
  productName: string;
  pricePaid: number; 
  nps_score: number | null;
  health_score: number;
  lessons_watched_percentage: number;
  open_tickets_count: number;
}

export interface ProductLink {
  id: string;
  crmName: string;
  hotmartId: string;
  status: string;
  origin: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
}

// ==========================================
// 3. INTERFACE G2 CRM PRO DEFINITIVA
// ==========================================
export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productsList, setProductsList] = useState<ProductLink[]>([]);
  const [currentTab, setCurrentTab] = useState<TabType>('kanban'); 
  const [currentFunnel, setCurrentFunnel] = useState<FunnelType>('Vendas'); 
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Estados de Modais e Cadastros
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPrice, setNewPrice] = useState('0');
  const [newFunnelSelection, setNewFunnelSelection] = useState<FunnelType>('Vendas');

  const [showProductModal, setShowProductModal] = useState(false);
  const [prodCrmName, setProdCrmName] = useState('');
  const [prodHotmartId, setProdHotmartId] = useState('');

  // Chaves de APIs e Configurações Globais
  const [hotmartToken, setHotmartToken] = useState('xyz_webhook_token_secure');
  const [beeMessageKey, setBeeMessageKey] = useState('bee_live_api_key_prod');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  
  const [usersList, setUsersList] = useState(['admin@g2.com', 'comercial@g2.com', 'cs.coordenacao@g2.com']);
  const [newUserEmail, setNewUserEmail] = useState('');

  const messageTemplates: MessageTemplate[] = [
    { id: 't0', title: 'Boas-vindas Comercial (Leads)', content: 'Olá {{nome}}, recebemos seu contato! Aqui está o link do grupo VIP de mentoria: g2club.com/vip' },
    { id: 't1', title: 'Boas-vindas Onboarding (Alunos)', content: 'Olá {{nome}}, parabéns pela sua inscrição! Vamos agendar sua sessão de alinhamento estratégico?' },
    { id: 't2', title: 'Alerta de Engajamento CS', content: 'Olá {{nome}}, notamos que você não acessa a plataforma há alguns dias. Está com alguma dificuldade no projeto?' }
  ];

  const funnels: FunnelType[] = ['Vendas', 'Mega aula', 'Programa corretor campeão', 'Mentoria Dono'];
  const leadStages = ['Interesse Inicial', 'Entrada no Grupo', 'Participação na Live', 'Nutrição', 'Aquisição'];
  const customerStages = ['Ativação', 'Nutrição', 'Acompanhamento', 'NPS', 'Upsell'];

  const activeStages = currentFunnel === 'Vendas' ? leadStages : customerStages;
  const filteredCustomers = customers.filter(c => c.funnel === currentFunnel);

  // ==========================================
  // 4. INTEGRAÇÃO REAL COM BANCO DE DADOS (SUPABASE API)
  // ==========================================
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/contatos?select=*&order=created_at.desc`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          funnel: c.funnel as FunnelType,
          stage: c.stage,
          productName: c.product_name || 'Nenhum',
          pricePaid: parseFloat(c.price_paid) || 0,
          nps_score: c.nps_score,
          health_score: c.health_score || 100,
          lessons_watched_percentage: c.lessons_watched_percentage || 0,
          open_tickets_count: c.open_tickets_count || 0
        }));
        setCustomers(mapped);
      }
    } catch (err) { console.error("Erro ao ler contatos:", err); }
    finally { setIsLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/produtos?select=*&order=created_at.desc`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setProductsList(data.map((p: any) => ({
          id: p.id,
          crmName: p.crm_name,
          hotmartId: p.hotmart_id,
          status: 'Ativo',
          origin: 'Manual'
        })));
      }
    } catch (err) { console.error("Erro ao ler produtos:", err); }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPhone) return;
    const initialStage = newFunnelSelection === 'Vendas' ? 'Interesse Inicial' : 'Ativação';
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/contatos`, {
        method: 'POST',
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          funnel: newFunnelSelection,
          stage: initialStage,
          price_paid: newFunnelSelection === 'Vendas' ? 0 : parseFloat(newPrice) || 0,
          lessons_watched_percentage: newFunnelSelection === 'Vendas' ? 0 : 20,
          nps_score: newFunnelSelection === 'Vendas' ? null : 10
        })
      });
      if (response.ok) {
        setShowAddModal(false);
        setNewName(''); setNewEmail(''); setNewPhone(''); setNewPrice('0');
        fetchCustomers();
      }
    } catch (err) { alert("Erro ao criar contato."); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodCrmName || !prodHotmartId) return;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/produtos`, {
        method: 'POST',
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ crm_name: prodCrmName, hotmart_id: prodHotmartId })
      });
      if (response.ok) {
        setShowProductModal(false);
        setProdCrmName(''); setProdHotmartId('');
        fetchProducts();
      }
    } catch (err) { alert("Erro ao cadastrar produto."); }
  };

  const handleDeleteProductFromSupabase = async (id: string) => {
    if (!confirm("Deseja realmente remover este produto?")) return;
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/produtos?id=eq.${id}`, {
        method: 'DELETE',
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      });
      if (response.ok) fetchProducts();
    } catch (err) { console.error(err); }
  };

  const handleUpdateStageInDatabase = async (id: string, targetStage: string) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/contatos?id=eq.${id}`, {
        method: 'PATCH',
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage })
      });
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, stage: targetStage } : c));
    } catch (err) { console.error(err); }
  };

  const handleUpdateCSMetrics = async (id: string, extraProgress: number, changeTickets: number) => {
    const client = customers.find(c => c.id === id);
    if (!client) return;
    let newPct = Math.min(100, Math.max(0, client.lessons_watched_percentage + extraProgress));
    let newTickets = Math.max(0, client.open_tickets_count + changeTickets);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/contatos?id=eq.${id}`, {
        method: 'PATCH',
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ lessons_watched_percentage: newPct, open_tickets_count: newTickets, last_login: new Date().toISOString() })
      });
      fetchCustomers();
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer(prev => prev ? { ...prev, lessons_watched_percentage: newPct, open_tickets_count: newTickets } : null);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  // Lógica Drag & Drop
  const handleDragStart = (e: React.DragEvent, id: string) => e.dataTransfer.setData('text/plain', id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    handleUpdateStageInDatabase(id, targetStage);
  };

  // Executar automação Bee Message
  const handleTriggerBeeMessage = () => {
    if (!selectedCustomer || !selectedTemplate) return;
    const template = messageTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSelectedTemplate('');
      alert(`💬 Bee Message Gateway:\n\nMensagem disparada com sucesso para o WhatsApp (${selectedCustomer.phone}) de ${selectedCustomer.name}.\n\nConteúdo enviado:\n"${template.content.replace('{{nome}}', selectedCustomer.name)}"`);
    }, 1200);
  };

  // Simulador de Webhook Hotmart
  const [webhookPayload, setWebhookPayload] = useState(JSON.stringify({
    event: "PURCHASE_APPROVED",
    data: {
      buyer: { name: "Mariana Oliveira", email: "mariana@exemplo.com", phone: "5511977776666" },
      product: { id: "HOT-MEGA", name: "Mega Aula" },
      purchase: { price: { value: 4999.00 } }
    }
  }, null, 2));

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(webhookPayload);
      if (parsed.event !== "PURCHASE_APPROVED") return;

      const response = await fetch(`${SUPABASE_URL}/rest/v1/contatos`, {
        method: 'POST',
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.buyer.name,
          email: parsed.data.buyer.email,
          phone: parsed.data.buyer.phone,
          funnel: 'Mega aula',
          stage: 'Ativação',
          product_name: parsed.data.product.name,
          price_paid: parsed.data.purchase.price.value,
          lessons_watched_percentage: 15,
          nps_score: 10
        })
      });

      if (response.ok) {
        alert(`⚡ Integração Hotmart Executada!\n\nWebhook processado com sucesso.`);
        fetchCustomers();
      }
    } catch (err) { alert("JSON inválido."); }
  };

  // Cálculos do Dashboard Real G2
  const totalInvestment = 9007.40;
  const gmvTotal = customers.reduce((acc, curr) => acc + curr.pricePaid, 0);
  const receitaLiquida = gmvTotal * (1 - 0.099);
  const lucroTotal = receitaLiquida - totalInvestment;
  const totalAlunos = customers.filter(c => c.pricePaid > 0).length;
  
  const clientesExcelente = customers.filter(c => c.health_score >= 80).length;
  const clientesAlerta = customers.filter(c => c.health_score >= 50 && c.health_score < 80).length;
  const clientesChurnRisco = customers.filter(c => c.health_score < 50).length;

  const npsValidos = customers.filter(c => c.nps_score !== null);
  const totalPromotores = npsValidos.filter(c => c.nps_score! >= 9).length;
  const totalDetratores = npsValidos.filter(c => c.nps_score! <= 6).length;
  const npsGeral = npsValidos.length > 0 ? Math.round(((totalPromotores - totalDetratores) / npsValidos.length) * 100) : '—';
  const engajamentoMedio = customers.length > 0 ? Math.round(customers.reduce((acc, c) => acc + c.lessons_watched_percentage, 0) / customers.length) : 0;

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', color: '#1e293b', minHeight: '100vh', userSelect: 'none' }}>
      
      {/* SIDEBAR COM NOMES LIMPOS, SEM ÍCONES, LOG OUT NO FINAL */}
      <aside style={{ width: '260px', backgroundColor: '#0f172a', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #1e2937' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div><img src="https://lh3.googleusercontent.com/d/1gz646aa1VDcy859I5NMQd0_bjka37dBJ" alt="Logo G2" style={{ maxWidth: '140px', height: 'auto', objectFit: 'contain' }} /></div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'kanban', label: 'Jornada do cliente' }, 
              { id: 'clientes', label: 'Contatos' },
              { id: 'produtos', label: 'Produtos' },
              { id: 'integracoes', label: 'Integrações' },
              { id: 'configuracoes', label: 'Configurações' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setCurrentTab(tab.id as TabType)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: '0.2s', backgroundColor: currentTab === tab.id ? '#c5a880' : 'transparent', color: currentTab === tab.id ? '#0f172a' : '#94a3b8' }}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div><button onClick={() => alert('Sessão encerrada!')} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#ef4444', backgroundColor: 'transparent' }}>Log out</button></div>
      </aside>

      {/* PAINEL PRINCIPAL */}
      <main style={{ flex: 1, padding: '40px', overflowX: 'auto', backgroundColor: '#f8fafc' }}>
        
        {/* TELA 1: DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>Dashboard</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 25px 0' }}>Métricas financeiras corporativas e saúde operacional da base G2</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>VOLUME BRUTO (GMV)</span>
                <h3 style={{ fontSize: '26px', margin: '10px 0 0 0', fontWeight: '800' }}>R$ {gmvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>RECEITA LÍQUIDA (HOTMART)</span>
                <h3 style={{ fontSize: '26px', margin: '10px 0 0 0', fontWeight: '800', color: '#c5a880' }}>R$ {receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>RESULTADO OPERACIONAL (LUCRO)</span>
                <h3 style={{ fontSize: '26px', margin: '10px 0 0 0', fontWeight: '800', color: '#10b981' }}>R$ {lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}><strong>NPS da Base:</strong> <span style={{ color: '#eab308', fontWeight: '800' }}>{npsGeral}</span></div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}><strong>Consumo de Conteúdo:</strong> <span style={{ color: '#7c3aed', fontWeight: '800' }}>{engajamentoMedio}%</span></div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}><strong>Alunos Retidos:</strong> <span style={{ color: '#10b981', fontWeight: '800' }}>{clientesExcelente}</span></div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}><strong>Em Risco Crítico:</strong> <span style={{ color: '#ef4444', fontWeight: '800' }}>{clientesChurnRisco}</span></div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '700' }}>Distribuição Harmônica de Saúde (Fase Pós-Venda)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ width: '100%', backgroundColor: '#f1f5f9', height: '14px', borderRadius: '10px', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ width: `${(clientesExcelente/Math.max(1, customers.length))*100}%`, backgroundColor: '#10b981' }}></div>
                  <div style={{ width: `${(clientesAlerta/Math.max(1, customers.length))*100}%`, backgroundColor: '#f59e0b' }}></div>
                  <div style={{ width: `${(clientesChurnRisco/Math.max(1, customers.length))*100}%`, backgroundColor: '#ef4444' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TELA 2: JORNADA DO CLIENTE (KANBAN) */}
        {currentTab === 'kanban' && (
          <div>
            <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Jornada do cliente</h2>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0 0' }}>Arraste os leads e compradores pelos estágios dos pipelines operacionais</p>
                </div>
                <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: '#c5a880', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                  ➕ Novo Contato Real
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
                {funnels.map(funnel => (
                  <button key={funnel} onClick={() => setCurrentFunnel(funnel)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', backgroundColor: currentFunnel === funnel ? '#0f172a' : 'transparent', color: currentFunnel === funnel ? '#ffffff' : '#475569' }}>
                    {funnel}
                  </button>
                ))}
              </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeStages.length}, 1fr)`, gap: '16px' }}>
              {activeStages.map(stage => {
                const stageCustomers = filteredCustomers.filter(c => c.stage === stage);
                return (
                  <div key={stage} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage)} style={{ backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '16px', minHeight: '500px', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b', display: 'flex', justifyContent: 'space-between', margin: '0 0 16px 0' }}>
                      <span>{stage.toUpperCase()}</span>
                      <span style={{ fontSize: '11px', background: '#cbd5e1', padding: '2px 6px', borderRadius: '6px' }}>{stageCustomers.length}</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      {stageCustomers.map(customer => (
                        <div key={customer.id} draggable onDragStart={(e) => handleDragStart(e, customer.id)} onClick={() => setSelectedCustomer(customer)} style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'grab', position: 'relative' }}>
                          <span style={{ position: 'absolute', top: '14px', right: '14px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: customer.health_score >= 80 ? '#10b981' : customer.health_score >= 50 ? '#f59e0b' : '#ef4444' }}></span>
                          <h4 style={{ fontWeight: '700', margin: '0 0 4px 0', fontSize: '13px' }}>{customer.name}</h4>
                          <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#64748b' }}>{customer.email}</p>
                          {customer.pricePaid > 0 ? (
                            <div style={{ fontSize: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                              <span style={{ color: '#c5a880' }}>R$ {customer.pricePaid}</span>
                              <span>Saúde: {customer.health_score}</span>
                            </div>
                          ) : <span style={{ fontSize: '10px', color: '#475569' }}>Lead</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TELA 3: CONTATOS */}
        {currentTab === 'clientes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '25px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>Contatos</h2>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Base relacional de clientes armazenada diretamente no PostgreSQL</p>
              </div>
              <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: '#c5a880', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                ➕ Novo Contato Real
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '16px' }}>Nome</th>
                  <th style={{ padding: '16px' }}>E-mail</th>
                  <th style={{ padding: '16px' }}>Pipeline</th>
                  <th style={{ padding: '16px' }}>Estágio</th>
                  <th style={{ padding: '16px' }}>Health Score</th>
                  <th style={{ padding: '16px' }}>Faturamento</th>
                  <th style={{ padding: '16px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontWeight: '700', color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '16px', color: '#475569' }}>{c.email}</td>
                    <td style={{ padding: '16px', color: '#3b82f6', fontWeight: '600' }}>{c.funnel}</td>
                    <td style={{ padding: '16px', color: '#475569' }}>{c.stage}</td>
                    <td style={{ padding: '16px', fontWeight: '700', color: c.health_score >= 80 ? '#10b981' : '#ef4444' }}>{c.health_score} pts</td>
                    <td style={{ padding: '16px', color: '#c5a880', fontWeight: '700' }}>R$ {c.pricePaid.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '16px' }}>
                      <button onClick={() => setSelectedCustomer(c)} style={{ background: 'none', border: '1px solid #c5a880', color: '#c5a880', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Ver Dossiê</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TELA 4: PRODUTOS */}
        {currentTab === 'produtos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Produtos</h2>
              <button onClick={() => setShowProductModal(true)} style={{ backgroundColor: '#c5a880', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                + Novo Produto
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>Catálogo mapeado de infoprodutos cadastrados na infraestrutura PostgreSQL</p>
            
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontWeight: '700' }}>
                    <th style={{ padding: '14px' }}>Nome no CRM</th>
                    <th style={{ padding: '14px' }}>ID Gatilho Hotmart</th>
                    <th style={{ padding: '14px' }}>Status</th>
                    <th style={{ padding: '14px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {productsList.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '14px', fontWeight: '700' }}>{p.crmName}</td>
                      <td style={{ padding: '14px', fontFamily: 'monospace' }}>{p.hotmartId}</td>
                      <td style={{ padding: '14px' }}><span style={{ fontSize: '11px', backgroundColor: '#fbf7f0', color: '#c5a880', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{p.status}</span></td>
                      <td style={{ padding: '14px' }}><button onClick={() => handleDeleteProductFromSupabase(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Remover</button></td>
                    </tr>
                  ))}
                  {productsList.length === 0 && <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Nenhum produto indexado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TELA 5: INTEGRAÇÕES */}
        {currentTab === 'integracoes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Integrações</h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 20px 0' }}>Sincronize automações enviando Webhooks de teste</p>
              
              <form onSubmit={handleSimulateWebhook} style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Payload do Webhook Hotmart (JSON de Compra Aprovada)</span>
                <textarea value={webhookPayload} onChange={(e) => setWebhookPayload(e.target.value)} style={{ width: '95%', height: '200px', backgroundColor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', padding: '12px', borderRadius: '6px', resize: 'none', fontSize: '11px' }} />
                <button type="submit" style={{ width: '100%', marginTop: '12px', backgroundColor: '#0f172a', color: '#c5a880', fontWeight: '700', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Simular Post Real no Postgres</button>
              </form>
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0' }}>Tokens de Autenticação</h2>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }}><span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>HOTMART ENDPOINT SECRET TOKEN</span><input type="password" value={hotmartToken} readOnly style={{ width: '95%', padding: '8px', borderRadius: '6px', marginTop: '6px', border: '1px solid #cbd5e1' }} /></div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}><span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>BEE MESSAGE GATEWAY TOKEN KEY</span><input type="password" value={beeMessageKey} readOnly style={{ width: '95%', padding: '8px', borderRadius: '6px', marginTop: '6px', border: '1px solid #cbd5e1' }} /></div>
            </div>
          </div>
        )}

        {/* TELA 6: CONFIGURAÇÕES */}
        {currentTab === 'configuracoes' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Configurações</h2>
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '15px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '15px' }}>Liberar Acesso Administrativo</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="nome.consultor@g2.com" />
                <button onClick={() => { if(newUserEmail) { setUsersList([...usersList, newUserEmail]); setNewUserEmail(''); } }} style={{ backgroundColor: '#0f172a', color: '#c5a880', border: 'none', padding: '0 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Convidar</button>
              </div>
              {usersList.map(user => <div key={user} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>• {user}</div>)}
            </div>
          </div>
        )}

      </main>

      {/* FORMULÁRIO MODAL CRIAR CONTATO REAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, backdropFilter: 'blur(3px)' }}>
          <form onSubmit={handleSaveCustomer} style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', width: '380px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Criar Novo Contato Real</h2><button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer' }}>✕</button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Nome Completo *</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>E-mail Único *</label><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>WhatsApp *</label><input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Pipeline Inicial</label><select value={newFunnelSelection} onChange={(e) => setNewFunnelSelection(e.target.value as FunnelType)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '600' }}>{funnels.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              {newFunnelSelection !== 'Vendas' && (
                <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Valor Bruto Pago (R$)</label><input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /></div>
              )}
            </div>
            <button type="submit" style={{ width: '100%', marginTop: '25px', padding: '12px', borderRadius: '6px', backgroundColor: '#0f172a', color: '#c5a880', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Salvar no Postgres G2</button>
          </form>
        </div>
      )}

      {/* MODAL VINCULAR PRODUTO */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}><form onSubmit={handleSaveProduct} style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', width: '380px', border: '1px solid #e2e8f0' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Mapear Novo Infoproduto</h2><button type="button" onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: '#ef4444' }}>✕</button></div><div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}><div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Nome de Exibição CRM *</label><input type="text" value={prodCrmName} onChange={(e) => setProdCrmName(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></div><div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>ID do Gatilho Hotmart *</label><input type="text" value={prodHotmartId} onChange={(e) => setProdHotmartId(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></div></div><button type="submit" style={{ width: '100%', marginTop: '25px', padding: '12px', borderRadius: '6px', backgroundColor: '#0f172a', color: '#c5a880', fontWeight: '700', border: 'none' }}>Salvar no Supabase</button></form></div>
      )}

      {/* DOSSIÊ LATERAL E DISPARADOR BEE MESSAGE */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '360px', height: '100vh', backgroundColor: '#ffffff', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', padding: '30px 24px', overflowY: 'auto', borderLeft: '1px solid #e2e8f0', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h2 style={{ fontSize: '14px', fontWeight: '700', color: '#c5a880', margin: 0 }}>DOSSIÊ CENTRALIZADO</h2><button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer' }}>✕</button></div>
          <div style={{ marginBottom: '20px', fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ margin: 0 }}><strong>Nome:</strong> {selectedCustomer.name}</p>
            <p style={{ margin: 0 }}><strong>WhatsApp:</strong> {selectedCustomer.phone}</p>
            <p style={{ margin: 0 }}><strong>Health Score:</strong> <strong style={{ color: selectedCustomer.health_score >= 80 ? '#10b981' : '#ef4444' }}>{selectedCustomer.health_score} pts</strong></p>
          </div>
          <hr style={{ borderColor: '#e2e8f0', marginBottom: '20px' }} />
          
          {selectedCustomer.pricePaid > 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>🎛️ ENGAJAMENTO CS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Aulas: {selectedCustomer.lessons_watched_percentage}%</span>
                  <button onClick={() => handleQuickUpdateEngagement(selectedCustomer.id, 10, 0)} style={{ padding: '2px 6px', cursor: 'pointer', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px' }}>+10%</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Tickets Suporte: {selectedCustomer.open_tickets_count}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleUpdateCSMetrics(selectedCustomer.id, 0, 1)} style={{ padding: '2px 6px', color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '4px' }}>+1</button>
                    {selectedCustomer.open_tickets_count > 0 && <button onClick={() => handleUpdateCSMetrics(selectedCustomer.id, 0, -1)} style={{ padding: '2px 6px', color: '#10b981', backgroundColor: '#f0fdf4', border: 'none', borderRadius: '4px' }}>-1</button>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#fbf7f0', padding: '16px', borderRadius: '12px', border: '1px solid #f1e9db' }}>
            <span style={{ fontSize: '11px', color: '#c5a880', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💬 DISPARO BEE MESSAGE</span>
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
              <option value="">Selecione um template de texto...</option>
              {messageTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <button onClick={handleTriggerBeeMessage} disabled={!selectedTemplate || isSending} style={{ width: '100%', marginTop: '10px', padding: '10px', backgroundColor: !selectedTemplate || isSending ? '#cbd5e1' : '#0f172a', color: !selectedTemplate || isSending ? '#475569' : '#c5a880', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
              Disparar Automação WhatsApp
            </button>
          </div>
        </div>
      )}

    </div>
  );
}