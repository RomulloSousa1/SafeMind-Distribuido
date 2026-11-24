import amqp from 'amqplib';

export const QUEUE_RESPOSTAS = 'safemind.respostas.submetidas';

type Connection = Awaited<ReturnType<typeof amqp.connect>>;

let channel: amqp.ConfirmChannel | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function getChannel(): amqp.ConfirmChannel | null {
  return channel;
}

/**
 * Conecta ao RabbitMQ com retry e reconexão automática.
 * `onReady` é chamado a cada (re)conexão, para registrar consumidores.
 */
export async function iniciarBroker(onReady: (ch: amqp.ConfirmChannel) => Promise<void>): Promise<void> {
  const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';

  for (;;) {
    try {
      const conn: Connection = await amqp.connect(url);
      const ch = await conn.createConfirmChannel();
      await ch.assertQueue(QUEUE_RESPOSTAS, { durable: true });
      channel = ch;
      await onReady(ch);
      console.log('[Broker] Conectado ao RabbitMQ.');

      conn.on('error', (err: Error) => console.error('[Broker] Erro:', err.message));
      conn.on('close', () => {
        console.warn('[Broker] Conexão encerrada; reconectando...');
        channel = null;
        void iniciarBroker(onReady);
      });
      return;
    } catch (err) {
      console.log(`[Broker] Aguardando RabbitMQ (${(err as Error).message})...`);
      await sleep(3000);
    }
  }
}
