import { Customer, MessageTemplate } from './types';

/**
 * Simula o disparo de API em background para a Bee Message
 */
export const sendBeeMessageAPI = async (customer: Customer, template: MessageTemplate): Promise<boolean> => {
  // Substitui a tag {{nome}} pelo nome real do cliente de forma dinâmica
  const messageText = template.content.replace('{{nome}}', customer.name);

  console.log(`📡 Enviando API para Bee Message...`);
  console.log(`📱 Destinatário: ${customer.phone}`);
  console.log(`💬 Mensagem: "${messageText}"`);

  // Simula o tempo de resposta do servidor de destino
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true); // Retorna verdadeiro simulando sucesso no envio
    }, 1000);
  });
};
