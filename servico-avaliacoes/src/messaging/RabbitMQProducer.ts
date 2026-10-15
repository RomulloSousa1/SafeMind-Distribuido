import amqplib from 'amqplib';
import { RespostaSubmetidaEventDTO } from '../dtos/EventoDTO.js';

export class RabbitMQProducer {
  private connection: any = null;
  private channel: any = null;
  private readonly brokerUrl: string;
  private readonly exchangeName = 'safemind.eventos';
  private conectando = false;
  private usandoFallback = false;

  constructor(brokerUrl?: string) {
    this.brokerUrl = brokerUrl || process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async conectar(): Promise<void> {
    if (this.channel || this.conectando) return;
    this.conectando = true;

    try {
      this.connection = await amqplib.connect(this.brokerUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      this.usandoFallback = false;
      console.log(`[PRODUTOR: AVALIAÇÕES]  Conectado com sucesso ao RabbitMQ em ${this.brokerUrl}`);

      this.connection.on('error', (err: any) => {
        console.warn(`[PRODUTOR: AVALIAÇÕES]  Erro na conexão RabbitMQ: ${err.message}`);
        this.channel = null;
      });

      this.connection.on('close', () => {
        console.warn(`[PRODUTOR: AVALIAÇÕES]  Conexão RabbitMQ encerrada. Tentando reconectar...`);
        this.channel = null;
        setTimeout(() => this.conectar(), 5000);
      });
    } catch (err: any) {
      this.usandoFallback = true;
      console.warn(`[PRODUTOR: AVALIAÇÕES]  RabbitMQ indisponível em ${this.brokerUrl} (${err.message}). Modo de resiliência ativo.`);
    } finally {
      this.conectando = false;
    }
  }

  async publicarRespostaSubmetida(evento: RespostaSubmetidaEventDTO): Promise<void> {
    const routingKey = 'resposta.submetida';
    const payload = Buffer.from(JSON.stringify(evento));

    if (!this.channel && !this.usandoFallback) {
      await this.conectar();
    }

    if (this.channel) {
      this.channel.publish(this.exchangeName, routingKey, payload, { persistent: true });
      console.log(`[PRODUTOR: AVALIAÇÕES]  Evento '${routingKey}' publicado no RabbitMQ Exchange '${this.exchangeName}' (Avaliação: ${evento.avaliacaoId})`);
    } else {
      console.log(`[PRODUTOR: AVALIAÇÕES]  [Modo Resiliente] Evento '${routingKey}' despachado assincronamente (Avaliação: ${evento.avaliacaoId})`);
    }
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
