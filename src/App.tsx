// @ts-nocheck
/* eslint-disable */
import { useState, useEffect } from 'react';

// Link unificado para a sua própria API de funções do Netlify
const API_URL = "/.netlify/functions/webhook";

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
  created_at?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
}

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
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

  // Configurações de API e Automações
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [investmentG2, setInvestmentG2] = useState<number>(9007.40);
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
  // COMUNICAÇÃO COM O SEU ENDPOINT PROPRIETÁRIO
  // ==========================================
  
  // Buscar os clientes salvos nas Netlify Functions
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error("Erro ao carregar clientes da API interna:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar a criação de um contato manual para a API
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPhone) return;
    const initialStage = newFunnelSelection === 'Vendas' ? 'Interesse Inicial' : 'Ativação';
    
    // Monta o payload simulando a estrutura que a API espera receber
    const payload = {
      data: {
        buyer: { name: newName, email: newEmail, phone: newPhone },
        product: { name: newFunnelSelection === 'Vendas' ? 'Lead Manual' : 'Produto Manual G2' },
        purchase: { price: { value: newFunnelSelection === 'Vendas' ? 0 : parseFloat(newPrice) || 0 } }
      }
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setNewName(''); setNewEmail(''); setNewPhone(''); setNewPrice('0');
        fetchCustomers();
      }
    } catch (err) {
      alert("Erro ao salvar contato no armazenamento interno.");
    }
  };

  // Atualizar o estágio por clique ou drag & drop enviando uma mutação completa para a lista
  const handleUpdateStageInDatabase = async (id: string, targetStage: string) => {
    const updatedList = customers.map(c => c.id === id ? { ...c, stage: targetStage } : c);
    setCustomers(updatedList);
    
    // Salvando o novo estado da lista mandando direto para a função lidar
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Action-Type': 'REWRITE_LIST' },
        body: JSON.stringify({ raw_list_update: updatedList })
      });
    } catch (err) {
      console.error("Erro ao sincronizar estágio:", err);
    }
  };

  // Mudar as métricas de progresso de aulas ou tickets
  const handleUpdateCSMetrics = async (id: string, extraProgress: number, changeTickets: number) => {
    const updatedList = customers.map(client => {
      if (client.id !== id) return client;
      
      let newPct = Math.min(100, Math.max(0, client.lessons_watched_percentage + extraProgress));
      let newTickets = Math.max(0, client.open_tickets_count + changeTickets);
      
      let baseHealth = 100 - (newTickets * 15);
      if (newPct < 30) baseHealth -= 20;
      let finalHealth = Math.min(100, Math.max(0, baseHealth));

      const novoObjeto = { ...client, lessons_watched_percentage: newPct, open_tickets_count: newTickets, health_score: finalHealth };
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer(novoObjeto);
      }
      return novoObjeto;
    });

    setCustomers(updatedList);

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Action-Type': 'REWRITE_LIST' },
        body: JSON.stringify({ raw_list_update: updatedList })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerBeeMessage = () => {
    if (!selectedCustomer || !selectedTemplate) return;
    const template = messageTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSelectedTemplate('');
      alert(`💬 Bee Message API:\n\nMensagem disparada com sucesso para o WhatsApp (${selectedCustomer.phone}) de ${selectedCustomer.name}.\n\nConteúdo enviado:\n"${template.content.replace('{{nome}}', selectedCustomer.name)}"`);
    }, 1200);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Lógica Drag & Drop Nativa
  const handleDragStart = (e: React.DragEvent, id: string) => e.dataTransfer.setData('text/plain', id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    handleUpdateStageInDatabase(id, targetStage);
  };

  // Cálculos Financeiros Dinâmicos
  const gmvTotal = customers.reduce((acc, curr) => acc + curr.pricePaid, 0);
  const receitaLiquida = gmvTotal * (1 - 0.099);
  const lucroTotal = receitaLiquida - investmentG2;
  
  const clientesExcelente = customers.filter(c => c.health_score >= 80).length;
  const clientesChurnRisco = customers.filter(c => c.health_score < 50).length;

  const npsValidos = customers.filter(c => c.nps_score !== null);
  const totalPromotores = npsValidos.filter(c => c.nps_score! >= 9).length;
  const totalDetratores = npsValidos.filter(c => c.nps_score! <= 6).length;
  const npsGeral = npsValidos.length > 0 ? Math.round(((totalPromotores - totalDetratores) / npsValidos.length) * 100) : '—';
  const engajamentoMedio = customers.length > 0 ? Math.round(customers.reduce((acc, c) => acc + c.lessons_watched_percentage, 0) / customers.length) : 0;

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', color: '#1e293b', minHeight: '100vh', userSelect: 'none', fontFamily: '"Inter", sans-serif' }}>
      
      {/* SIDEBAR EXECUTIVA G2 BRAND */}
      <aside style={{ width: '260px', backgroundColor: '#0f172a', padding: '30px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #1e2937' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#c5a880', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 'bold', fontSize: '15px' }}>G2</div>
              <span style={{ color: '#ffffff', fontWeight: '800', fontSize: '16px', letterSpacing: '0.5px' }}>G2 SYSTEMS</span>
            </div>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'kanban', label: 'Jornada do cliente' }, 
              { id: 'clientes', label: 'Contatos' },
              { id: 'integracoes', label: 'Chaves API' },
              { id: 'configuracoes', label: 'Configurações' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setCurrentTab(tab.id as TabType)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: '0.2s', backgroundColor: currentTab === tab.id ? '#c5a880' : 'transparent', color: currentTab === tab.id ? '#0f172a' : '#94a3b8' }}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div>
          <button onClick={() => alert('Sessão encerrada!')} style={{ width: '100%', padding: '12px 16px', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#ef4444', backgroundColor: 'transparent' }}>
            Log out
          </button>
        </div>
      </aside>

      {/* CONTEÚDO CENTRAL */}
      <main style={{ flex: 1, padding: '40px', overflowX: 'auto', backgroundColor: '#f8fafc' }}>
        
        {/* TAB 1: DASHBOARD COMPLETO */}
        {currentTab === 'dashboard' && (
          <div>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>Dashboard</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 25px 0' }}>Métricas financeiras integradas e controle de retenção da base G2</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>VOLUME BRUTO (GMV)</span>
                <h3 style={{ fontSize: '26px', margin: '10px 0 0 0', fontWeight: '800', color: '#0f172a' }}>R$ {gmvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>RECEITA LÍQUIDA (HOTMART)</span>
                <h3 style={{ fontSize: '26px', margin: '10px 0 0 0', fontWeight: '800', color: '#c5a880' }}>R$ {receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>LUCRO OPERACIONAL FINAL</span>
                <h3 style={{ fontSize: '26px', margin: '10px 0 0 0', fontWeight: '800', color: '#10b981' }}>R$ {lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}><strong>NPS Atual da Base:</strong> <span style={{ color: '#eab308', fontWeight: '800' }}>{npsGeral}</span></div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}><strong>Consumo de Aulas:</strong> <span style={{ color: '#7c3aed', fontWeight: '800' }}>{engajamentoMedio}%</span></div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}><strong>Alunos Saudáveis:</strong> <span style={{ color: '#10b981', fontWeight: '800' }}>{clientesExcelente}</span></div>
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }}><strong>Custos Atuais (Marketing):</strong> <span style={{ color: '#f59e0b', fontWeight: '800' }}>R$ {investmentG2.toLocaleString('pt-BR')}</span></div>
            </div>
          </div>
        )}

        {/* TAB 2: JORNADA DO CLIENTE */}
        {currentTab === 'kanban' && (
          <div>
            <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Jornada do cliente</h2>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0 0' }}>Arraste os compradores integrados pelos estágios das colunas de atendimento</p>
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

            {isLoading ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Lendo banco de dados no Netlify...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeStages.length}, 1fr)`, gap: '16px' }}>
                {activeStages.map(stage => {
                  const stageCustomers = filteredCustomers.filter(c => c.stage === stage);
                  return (
                    <div key={stage} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, stage)} style={{ backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '16px', minHeight: '520px', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b', display: 'flex', justifyContent: 'space-between', margin: '0 0 16px 0' }}>
                        <span>{stage.toUpperCase()}</span>
                        <span style={{ fontSize: '11px', background: '#cbd5e1', padding: '2px 6px', borderRadius: '6px', color: '#475569' }}>{stageCustomers.length}</span>
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                        {stageCustomers.map(customer => (
                          <div key={customer.id} draggable onDragStart={(e) => handleDragStart(e, customer.id)} onClick={() => setSelectedCustomer(customer)} style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'grab', position: 'relative' }}>
                            <span style={{ position: 'absolute', top: '14px', right: '14px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: customer.health_score >= 80 ? '#10b981' : customer.health_score >= 50 ? '#f59e0b' : '#ef4444' }}></span>
                            <h4 style={{ fontWeight: '700', margin: '0 0 4px 0', fontSize: '13px', color: '#0f172a' }}>{customer.name}</h4>
                            <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '85%' }}>{customer.email}</p>
                            {customer.pricePaid > 0 ? (
                              <div style={{ fontSize: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                <span style={{ color: '#c5a880', fontWeight: '700' }}>R$ {customer.pricePaid.toLocaleString('pt-BR')}</span>
                                <span>Saúde: {customer.health_score}</span>
                              </div>
                            ) : <span style={{ fontSize: '10px', color: '#475569', fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Lead Comercial</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LISTAGEM DE CONTATOS GERAL */}
        {currentTab === 'clientes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '25px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>Contatos da Base</h2>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Base de dados independente criptografada no Netlify Blobs</p>
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
                  <th style={{ padding: '16px' }}>Estágio Corrente</th>
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
                    <td style={{ padding: '16px', fontWeight: '700', color: c.health_score >= 80 ? '#10b981' : c.health_score >= 50 ? '#d97706' : '#dc2626' }}>{c.health_score} pts</td>
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

        {/* TAB 4: CHAVES DE API */}
        {currentTab === 'integracoes' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Chaves Operacionais</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 20px 0' }}>Seu link de produção para plugar diretamente na Hotmart</p>
            
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '8px' }}>LINK ENDPOINT WEBHOOK (COPIE E COLE NA HOTMART)</label>
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/.netlify/functions/webhook`} 
                onClick={(e) => { e.target.select(); alert('Link da API copiado para a área de transferência!'); }}
                style={{ width: '95%', padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', color: '#0f172a', cursor: 'pointer' }} 
              />
              <span style={{ fontSize: '11px', color: '#16a34a', display: 'block', marginTop: '8px', fontWeight: 'bold' }}>📢 Toque no campo para copiar o link completo.</span>
            </div>
          </div>
        )}

        {/* TAB 5: CONFIGURAÇÕES DE EQUIPE + FINANCEIRO */}
        {currentTab === 'configuracoes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', maxWidth: '700px' }}>
            
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Planejamento de Custos Operacionais (G2)</h3>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>Insira o valor total investido em tráfego e marketing para abater no Dashboard</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '13px', fontWeight: '700', color: '#64748b' }}>R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={investmentG2} 
                    onChange={(e) => setInvestmentG2(parseFloat(e.target.value) || 0)} 
                    style={{ width: '85%', padding: '10px 10px 10px 35px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700' }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Convidar Coordenador/Consultor</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="nome.consultor@g2.com" />
                <button onClick={() => { if(newUserEmail) { setUsersList([...usersList, newUserEmail]); setNewUserEmail(''); } }} style={{ backgroundColor: '#0f172a', color: '#c5a880', border: 'none', padding: '0 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>Convidar</button>
              </div>
              {usersList.map(user => <div key={user} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>• {user}</div>)}
            </div>
          </div>
        )}

      </main>

      {/* MODAL CADASTRAR CONTATO REAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, backdropFilter: 'blur(3px)' }}>
          <form onSubmit={handleSaveCustomer} style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', width: '380px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Criar Novo Contato Manual</h2><button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer' }}>✕</button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Nome Completo *</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>E-mail Único *</label><input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>WhatsApp *</label><input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Pipeline Inicial</label><select value={newFunnelSelection} onChange={(e) => setNewFunnelSelection(e.target.value as FunnelType)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '600' }}>{funnels.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              {newFunnelSelection !== 'Vendas' && (
                <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Valor Bruto Pago (R$)</label><input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ width: '94%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} /></div>
              )}
            </div>
            <button type="submit" style={{ width: '100%', marginTop: '25px', padding: '12px', borderRadius: '6px', backgroundColor: '#0f172a', color: '#c5a880', fontWeight: '700', border: 'none', cursor: 'pointer' }}>Salvar no Banco Interno</button>
          </form>
        </div>
      )}

      {/* DOSSIÊ LATERAL DE AUDITORIA & DISPAROS BEE MESSAGE */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '360px', height: '100vh', backgroundColor: '#ffffff', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', padding: '30px 24px', overflowY: 'auto', borderLeft: '1px solid #e2e8f0', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h2 style={{ fontSize: '14px', fontWeight: '700', color: '#c5a880', margin: 0, letterSpacing: '0.5px' }}>DOSSIÊ CENTRALIZADO</h2><button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer' }}>✕</button></div>
          
          <div style={{ marginBottom: '20px', fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ margin: 0 }}><strong>Nome do Cliente:</strong> {selectedCustomer.name}</p>
            <p style={{ margin: 0 }}><strong>WhatsApp Cadastrado:</strong> {selectedCustomer.phone}</p>
            <p style={{ margin: 0 }}><strong>Estágio Atual:</strong> {selectedCustomer.stage} ({selectedCustomer.funnel})</p>
            <p style={{ margin: 0 }}><strong>Produto Comprado:</strong> {selectedCustomer.productName || "Nenhum"}</p>
            <p style={{ margin: 0 }}><strong>Health Score Corrente:</strong> <strong style={{ color: selectedCustomer.health_score >= 80 ? '#10b981' : selectedCustomer.health_score >= 50 ? '#f59e0b' : '#ef4444' }}>{selectedCustomer.health_score} pontos</strong></p>
          </div>
          
          <hr style={{ borderColor: '#e2e8f0', marginBottom: '20px' }} />
          
          {/* PAINEL OPERACIONAL DE MÉTRICAS CS */}
          {selectedCustomer.pricePaid > 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>🎛️ CONTROLE DE ENGAJAMENTO CS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span>Aulas Assistidas: <strong>{selectedCustomer.lessons_watched_percentage}%</strong></span>
                  <button onClick={() => handleUpdateCSMetrics(selectedCustomer.id, 10, 0)} style={{ padding: '4px 8px', cursor: 'pointer', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>+10%</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span>Tickets Abertos: <strong>{selectedCustomer.open_tickets_count}</strong></span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleUpdateCSMetrics(selectedCustomer.id, 0, 1)} style={{ padding: '4px 8px', cursor: 'pointer', color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>+1 Ticket</button>
                    {selectedCustomer.open_tickets_count > 0 && <button onClick={() => handleUpdateCSMetrics(selectedCustomer.id, 0, -1)} style={{ padding: '4px 8px', cursor: 'pointer', color: '#10b981', backgroundColor: '#f0fdf4', border: 'none', borderRadius: '4px', fontWeight: '700', fontSize: '11px' }}>Fechar</button>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DISPARADOR OPERACIONAL DA BEE MESSAGE */}
          <div style={{ backgroundColor: '#fbf7f0', padding: '16px', borderRadius: '12px', border: '1px solid #f1e9db' }}>
            <span style={{ fontSize: '11px', color: '#c5a880', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💬 DISPARO BEE MESSAGE</span>
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#fff', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600' }}>
              <option value="">Selecione um template de texto...</option>
              {messageTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <button onClick={handleTriggerBeeMessage} disabled={!selectedTemplate || isSending} style={{ width: '100%', marginTop: '10px', padding: '10px', backgroundColor: !selectedTemplate || isSending ? '#cbd5e1' : '#0f172a', color: !selectedTemplate || isSending ? '#475569' : '#c5a880', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
              {isSending ? 'Conectando API...' : 'Disparar Automação WhatsApp'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}