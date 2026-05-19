import { Customer, MessageTemplate } from './types';

export const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    email: 'carlos@email.com',
    phone: '5541999999999', // Exemplo com DDD de Curitiba
    funnel: 'Mega aula',
    stage: 'Ativação',
    products: ['Inscrição Mega Aula'],
    history: [
      { id: 'h1', date: '19/05/2026', type: 'Hotmart', content: 'Lead importado via Webhook Hotmart.' }
    ]
  },
  {
    id: '2',
    name: 'Ana Costa',
    email: 'ana@email.com',
    phone: '5541888888888',
    funnel: 'Mentoria Dono',
    stage: 'Acompanhamento',
    products: ['Curso Base', 'Upgrade Mentoria'],
    history: [
      { id: 'h2', date: '18/05/2026', type: 'Hotmart', content: 'Compra aprovada: Upgrade Mentoria.' },
      { id: 'h3', date: '18/05/2026', type: 'Bee Message', content: 'Mensagem de boas-vindas enviada automaticamente.' }
    ]
  }
];

export const messageTemplates: MessageTemplate[] = [
  { id: 't1', title: 'Boas-vindas (Ativação)', content: 'Olá {{nome}}, parabéns por dar o primeiro passo! Vamos começar?' },
  { id: 't2', title: 'Convite para Upsell', content: 'Olá {{nome}}, vi que você concluiu o curso. Que tal darmos o próximo passo na Mentoria Dono?' }
];
