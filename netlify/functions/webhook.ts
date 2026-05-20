import { getStore } from "@netlify/blobs";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  funnel: string;
  stage: string;
  productName: string;
  pricePaid: number;
  nps_score: number | null;
  health_score: number;
  lessons_watched_percentage: number;
  open_tickets_count: number;
  created_at: string;
}

export const handler = async (event: any) => {
  // Permitir chamadas de qualquer lugar (CORS) para o front-end ler
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Conecta ao storage interno e gratuito do Netlify
  const store = getStore("g2-crm-database");

  // ROTA GET: O Front-end usa isso para carregar a lista de clientes na tela
  if (event.httpMethod === "GET") {
    const rawData = await store.get("customers_list");
    const customers = rawData ? JSON.parse(rawData) : [];
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(customers),
    };
  }

  // ROTA POST: É aqui que a Hotmart bate de forma automatizada!
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");

      // Validar se é um evento válido da Hotmart
      if (!body.data || !body.data.buyer) {
        return { statusCode: 400, headers, body: "Payload inválido" };
      }

      // Captura cirúrgica das variáveis oficiais do JSON da Hotmart
      const hotmartBuyer = body.data.buyer;
      const hotmartProduct = body.data.product || { name: "Infoproduto G2" };
      const hotmartPurchase = body.data.purchase || { price: { value: 0 } };

      const novoCliente: CustomerData = {
        id: crypto.randomUUID(),
        name: hotmartBuyer.name || "Cliente Sem Nome",
        email: hotmartBuyer.email || "sem@email.com",
        phone: hotmartBuyer.phone || "5500000000000",
        funnel: "Mega aula", // Cai automático no funil correto
        stage: "Ativação",    // Joga o cartão na primeira coluna do pós-venda
        productName: hotmartProduct.name,
        pricePaid: parseFloat(hotmartPurchase.price.value) || 0,
        nps_score: null,
        health_score: 100,
        lessons_watched_percentage: 15,
        open_tickets_count: 0,
        created_at: new Date().toISOString()
      };

      // Busca a lista atual de clientes cadastrados, adiciona o novo e salva de volta
      const rawCurrentData = await store.get("customers_list");
      const currentCustomers: CustomerData[] = rawCurrentData ? JSON.parse(rawCurrentData) : [];
      
      currentCustomers.unshift(novoCliente); // Coloca o cliente mais novo no topo da lista
      await store.set("customers_list", JSON.stringify(currentCustomers));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Cliente G2 inserido diretamente!", cliente: novoCliente }),
      };
    } catch (error: any) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
  }

  return { statusCode: 405, headers, body: "Método Não Permitido" };
};