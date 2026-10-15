import amqplib from 'amqplib';
import { RespostaSubmetidaEventDTO } from '../dtos/EventoDTO.js';
import { AvaliacaoService } from '../services/AvaliacaoService.js';

export class ProcessamentoRiscoConsumer {
  private connection: any = null;
  private channel: any = null;
  private readonly brokerUrl: string;
  private readonly exchangeName = 'safemind.eventos';
  private readonly queueName = 'fila.avaliacoes.processamento-risco';
  private readonly routingKey = 'resposta.submetida';
  private conectando = false;

  constructor(
    private readonly avaliacaoService: AvaliacaoService,
    brokerUrl?: string
  ) {
    this.brokerUrl = brokerUrl || process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async iniciar(): Promise<void> {
    if (this.channel || this.conectando) return;
    this.conectando = true;

    try {
      this.connection = await amqplib.connect(this.brokerUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      await this.channel.assertQueue(this.queueName, { durable: true });
      await this.channel.bindQueue(this.queueName, this.exchangeName, this.routingKey);

      await this.channel.prefetch(1);

      console.log(`[CONSUMIDOR 1: AVALIAÇÕES]  Escutando fila '${this.queueName}' (Routing Key: '${this.routingKey}')`);

      this.channel.consume(this.queueName, async (msg: any) => {
        if (!msg) return;

        try {
          const conteudo = msg.content.toString();
          const evento: RespostaSubmetidaEventDTO = JSON.parse(conteudo);

          console.log(`[CONSUMIDOR 1: AVALIAÇÕES] Processando tarefa assíncrona da fila: Recálculo de risco da avaliação '${evento.avaliacaoId}'...`);
          await this.avaliacaoService.processarRecalculoRiscoAssincrono(evento.avaliacaoId);

          this.channel.ack(msg);
          console.log(`[CONSUMIDOR 1: AVALIAÇÕES]  Processamento assíncrono concluído com sucesso e mensagem confirmada (ACK).`);
        } catch (err: any) {
          console.error(`[CONSUMIDOR 1: AVALIAÇÕES]  Erro ao processar mensagem da fila:`, err.message);
          this.channel.nack(msg, false, false);
        }
      });
    } catch (err: any) {
      console.warn(`[CONSUMIDOR 1: AVALIAÇÕES]  Não foi possível conectar ao RabbitMQ em ${this.brokerUrl}: ${err.message}. Modo resiliente pronto.`);
    } finally {
      this.conectando = false;
    }
  }


  async processarEventoLocal(evento: RespostaSubmetidaEventDTO): Promise<void> {
    setImmediate(async () => {
      try {
        console.log(`[CONSUMIDOR 1: AVALIAÇÕES]  [Assíncrono Local] Processando recálculo da avaliação '${evento.avaliacaoId}'...`);
        await this.avaliacaoService.processarRecalculoRiscoAssincrono(evento.avaliacaoId);
        console.log(`[CONSUMIDOR 1: AVALIAÇÕES]  [Assíncrono Local] Recálculo estatístico finalizado.`);
      } catch (err: any) {
        console.error(`[CONSUMIDOR 1: AVALIAÇÕES]  Erro no processamento assíncrono local:`, err.message);
      }
    });
  }

  async fechar(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch {
      // Ignora erro no fechamento
    }
  }
}
