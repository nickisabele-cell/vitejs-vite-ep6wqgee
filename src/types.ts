// Definição dos Funis e das Colunas do Kanban
export type FunnelType = 'Mega aula' | 'Programa corretor campeão' | 'Mentoria Dono';
export type StageType = 'Ativação' | 'Nutrição' | 'Acompanhamento' | 'NPS' | 'Upsell';

// Estrutura das interações que aparecem no Histórico do Cliente
export interface InteractionHistory {
  id: string;
  date: string;
  type: 'Hotmart' | 'Bee Message' | 'Manual';
  content: string;
}

// Estrutura completa do cadastro do Cliente
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  funnel: FunnelType;
  stage: StageType;
  products: string[];
  history: InteractionHistory[];
}

// Estrutura dos templates da Bee Message
export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
}
