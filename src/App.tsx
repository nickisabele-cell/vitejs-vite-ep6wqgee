import React, { useState } from 'react';
import { initialCustomers, messageTemplates } from './mockData';
import { Customer, FunnelType, StageType, MessageTemplate } from './types';
import { sendBeeMessageAPI } from './beeMessageService';

export default function App() {
  // Estados para gerenciar o CRM
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [currentFunnel, setCurrentFunnel] = useState<FunnelType>('Mega aula');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Lista de Funis e Colunas para renderizar na tela
  const funnels: FunnelType[] = ['Mega aula', 'Programa corretor campeão', 'Mentoria Dono'];
  const stages: StageType[] = ['Ativação', 'Nutrição', 'Acompanhamento', 'NPS', 'Upsell'];

  // Filtra os clientes que pertencem ao funil selecionado no topo da tela
  const filteredCustomers = customers.filter(c => c.funnel === currentFunnel);

  // Função para abrir os detalhes do cliente
  const handleOpenHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedTemplate('');
  };

  // Função para disparar a mensagem via API fictícia da Bee Message
  const handleSendMessage = async () => {
    if (!selectedCustomer || !selectedTemplate) return;
    
    const template = messageTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;

    setIsSending(true);
    
    // Chama o serviço que criamos
    const success = await sendBeeMessageAPI(selectedCustomer, template);

    if (success) {
      // Cria a nova linha de histórico
      const newInteraction = {
        id: `h_new_${Date.now()}`,
        date: new Date().toLocaleDateString('pt-BR'),
        type: 'Bee Message' as const,
        content: `Mensagem enviada via API: "${template.title}"`
      };

      // Atualiza o estado global dos clientes com o novo histórico
      const updatedCustomers = customers.map(c => {
        if (c.id === selectedCustomer.id) {
          const updated = { ...c, history: [newInteraction, ...c.history] };
          setSelectedCustomer(updated); // Atualiza o modal aberto
          return updated;
        }
        return c;
      });

      setCustomers(updatedCustomers);
      alert('Mensagem disparada com sucesso via Bee Message API!');
    }
    
    setIsSending(false);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      
      {/* CABEÇALHO E SELEÇÃO DE FUNIL */}
      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8' }}>CRM Infoprodutos - MVP</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>Selecione o Funil de Vendas/CS:</p>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {funnels.map(funnel => (
            <button
              key={funnel}
              onClick={() => setCurrentFunnel(funnel)}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                backgroundColor: currentFunnel === funnel ? '#38bdf8' : '#1e293b',
                color: currentFunnel === funnel ? '#0f172a' : '#94a3b8',
                transition: '0.2s'
              }}
            >
              {funnel}
            </button>
          ))}
        </div>
      </header>

      {/* QUADRO KANBAN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', alignItems: 'start' }}>
        {stages.map(stage => {
          const stageCustomers = filteredCustomers.filter(c => c.stage === stage);
          
          return (
            <div key={stage} style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '15px', minHeight: '400px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '2px solid #334155', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'between' }}>
                <span>{stage}</span>
                <span style={{ fontSize: '12px', background: '#334155', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>
                  {stageCustomers.length}
                </span>
              </h3>

              {/* CARDS DOS CLIENTES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stageCustomers.map(customer => (
                  <div 
                    key={customer.id} 
                    onClick={() => handleOpenHistory(customer)}
                    style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #334155', transition: '0.2s' }}
                  >
                    <h4 style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '14px' }}>{customer.name}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{customer.email}</p>
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {customer.products.map(p => (
                        <span key={p} style={{ fontSize: '10px', backgroundColor: '#0369a1', color: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* DETALHES E HISTÓRICO DO CLIENTE (MODAL LATERAL SIMULADO) */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', backgroundColor: '#1e293b', boxShadow: '-4px 0 15px rgba(0,0,0,0.5)', padding: '25px', overflowY: 'auto', borderLeft: '1px solid #334155', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8', margin: 0 }}>Histórico do Cliente</h2>
            <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
            <p><strong>Nome:</strong> {selectedCustomer.name}</p>
            <p><strong>E-mail:</strong> {selectedCustomer.email}</p>
            <p><strong>Telefone:</strong> {selectedCustomer.phone}</p>
            <p><strong>Funil Atual:</strong> <span style={{ color: '#38bdf8' }}>{selectedCustomer.funnel}</span></p>
          </div>

          <hr style={{ borderColor: '#334155', marginBottom: '20px' }} />

          {/* DISPARO BEE MESSAGE */}
          <div style={{ marginBottom: '25px', backgroundColor: '#0f172a', padding: '15px', borderRadius: '6px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: 0, color: '#10b981' }}>💬 Disparar Bee Message</h3>
            
            <select 
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', marginTop: '8px', fontSize: '13px' }}
            >
              <option value="">-- Selecione um Template --</option>
              {messageTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>

            <button
              onClick={handleSendMessage}
              disabled={!selectedTemplate || isSending}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: !selectedTemplate || isSending ? '#334155' : '#10b981',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                cursor: !selectedTemplate || isSending ? 'not-allowed' : 'pointer'
              }}
            >
              {isSending ? 'Disparando API...' : 'Enviar Mensagem Agora'}
            </button>
          </div>

          {/* LINHA DO TEMPO DO HISTÓRICO */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>Linha do Tempo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {selectedCustomer.history.map(item => (
                <div key={item.id} style={{ borderLeft: '2px solid #334155', paddingLeft: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>
                    <span>{item.date}</span>
                    <span style={{ 
                      color: item.type === 'Hotmart' ? '#f59e0b' : item.type === 'Bee Message' ? '#10b981' : '#94a3b8',
                      fontWeight: 'bold'
                    }}>{item.type}</span>
                  </div>
                  <p style={{ margin: 0, color: '#cbd5e1' }}>{item.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}