import amqplib from 'amqplib';

export interface RespostaSubmetidaEventoDTO {
  id: string;
  avaliacaoId: string;
  colaboradorId?: string;
  scoreIndividual: number;
  nivelRisco: string;
  submetidoEm: string;
}

export class AuditoriaRiscoConsumer {
  private connection: any = null;
  private channel: any = null;
  private readonly brokerUrl: string;
  private readonly exchangeName = 'safemind.eventos';
  private readonly queueName = 'fila.cadastros.auditoria-risco';
  private readonly routingKey = 'resposta.*';
  private conectando = false;

  constructor(brokerUrl?: string) {
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

      console.log(`[CONSUMIDOR 2: CADASTROS]  Escutando fila de auditoria '${this.queueName}' (Routing Key: '${this.routingKey}')`);

      this.channel.consume(this.queueName, async (msg: any) => {
        if (!msg) return;

        try {
          const evento: RespostaSubmetidaEventoDTO = JSON.parse(msg.content.toString());

          if (evento.nivelRisco === 'ALTO' || evento.nivelRisco === 'CRITICO') {
            console.log(
              `[CONSUMIDOR 2: CADASTROS] [ALERTA] [ALERTA NR-1] Resposta com Risco ${evento.nivelRisco} (Score: ${evento.scoreIndividual}) detectada na avaliação '${evento.avaliacaoId}'. Auditoria ocupacional registrada.`
            );
          } else {
            console.log(
              `[CONSUMIDOR 2: CADASTROS] [INFO] Resposta com Risco ${evento.nivelRisco} recebida. Registro arquivado em conformidade.`
            );
          }

          this.channel.ack(msg);
        } catch (err: any) {
          console.error(`[CONSUMIDOR 2: CADASTROS] [ERRO] Erro ao processar mensagem de auditoria:`, err.message);
          this.channel.nack(msg, false, false);
        }
      });
    } catch (err: any) {
      console.warn(`[CONSUMIDOR 2: CADASTROS] [AVISO] RabbitMQ indisponível em ${this.brokerUrl}: ${err.message}. Modo resiliente pronto.`);
    } finally {
      this.conectando = false;
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
